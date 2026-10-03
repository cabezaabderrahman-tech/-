#!/usr/bin/env python3
"""简体中文文档查重：纵向查重（与比对库比对）和横向查重（同批文件互相比对）。

判重规则沿用 tianlian0/paper_checking_system（GPL-2.0）公开的查重原理：
- 两篇文本连续 N 个汉字相同（N 为查重阈值）即认为这些字重复；
- 与某一篇来源的重复字数少于 30 字或重复率低于 0.25% 时，不判定为重复；
- 同一段文字在待查文本中出现多次，只计一次；
- 比对前去掉目录之前的部分（封面、摘要、目录）、末尾的参考文献和非中文字符；
- 纵向查重时，比对库中与待查文件同名的文件自动跳过。

用法：
  paper_check.py add 文件或文件夹...       # 添加到比对库
  paper_check.py list                      # 查看比对库
  paper_check.py remove 名称...            # 从比对库删除
  paper_check.py check 文件或文件夹...     # 查重，输出 HTML 报告和 result.csv
"""

import argparse
import csv
import html
import re
import sys
import time
from array import array
from collections import defaultdict
from pathlib import Path

SUPPORTED = {".pdf", ".docx", ".txt"}
DEFAULT_THRESHOLD = 13
MIN_DUP_CHARS = 30
MIN_DUP_RATIO = 0.0025
NON_KEPT = re.compile(r"[^一-鿿《》（）—；，。“”！]")
PUNCT_RUN = re.compile(r"[。，；（）“”]+")


def is_han(ch):
    return "一" <= ch <= "鿿"


# ---------------------------------------------------------------- 文本提取与清洗

def extract_text(path):
    ext = path.suffix.lower()
    if ext == ".pdf":
        import pymupdf
        with pymupdf.open(path) as doc:
            return "\n".join(page.get_text() for page in doc)
    if ext == ".docx":
        import mammoth
        with path.open("rb") as f:
            return mammoth.extract_raw_text(f).value
    if ext == ".txt":
        data = path.read_bytes()
        for encoding in ("utf-8-sig", "gb18030"):
            try:
                return data.decode(encoding)
            except UnicodeDecodeError:
                pass
        return data.decode("utf-8", errors="ignore")
    raise ValueError(f"不支持的格式 {path.suffix}（支持 PDF、DOCX、TXT；.doc 请先另存为 .docx）")


def strip_sections(text):
    """去掉目录之前的部分（封面、摘要、目录）和末尾的参考文献。"""
    i = text.find("参考文献")
    if 0 <= i < 0.2 * len(text):  # 出现在前 20%，多半是目录里的条目
        text = text[i + 4:]
    for word in ("引言", "绪论", "序言"):
        i = text.find(word)
        if 0 <= i < 0.1 * len(text):
            text = text[i + 2:]
            break
    for _ in range(3):
        i = text.rfind("参考文献")
        if i <= 0.85 * len(text):
            break
        text = text[:i]
    return text


def clean(text, strip=True):
    if strip:
        text = strip_sections(text)
    text = NON_KEPT.sub("", text)
    return PUNCT_RUN.sub("，", text).strip("，")


def collect_files(paths):
    files = []
    for p in map(Path, paths):
        if p.is_dir():
            files += sorted(f for f in p.rglob("*") if f.is_file() and f.suffix.lower() in SUPPORTED)
        elif p.is_file():
            files.append(p)
        else:
            print(f"[跳过] 找不到 {p}", file=sys.stderr)
    return files


def load_files(paths, strip):
    """返回 [(名称, 清洗后文本)]，提取失败的文件打印原因后跳过。"""
    loaded = []
    for f in collect_files(paths):
        try:
            text = clean(extract_text(f), strip)
        except Exception as e:  # 单个文件损坏不影响其他文件
            print(f"[失败] {f.name}：{e}", file=sys.stderr)
            continue
        han = sum(map(is_han, text))
        if han < 100:
            print(f"[提醒] {f.name} 只提取到 {han} 个汉字；如果是扫描版 PDF，需要先做文字识别", file=sys.stderr)
        loaded.append((f.stem, text))
    return loaded


# ---------------------------------------------------------------- 比对

class Doc:
    def __init__(self, name, text, blocklist=()):
        for word in blocklist:
            text = text.replace(word, "")
        self.name = name
        self.text = PUNCT_RUN.sub("，", text)
        self.han_pos = array("i", (i for i, ch in enumerate(self.text) if is_han(ch)))
        self.han = "".join(self.text[i] for i in self.han_pos)


def winnow(s, k, w):
    """Winnowing 指纹：两段文本只要有 w+k-1 个以上连续相同的字，就必有相同指纹。"""
    hashes = [hash(s[i:i + k]) for i in range(len(s) - k + 1)]
    return {min(hashes[i:i + w]) for i in range(len(hashes) - w + 1)}


class Index:
    """按指纹快速找出可能与待查文本有重复的文档，再逐篇精确比对。"""

    def __init__(self, docs, n):
        self.docs = docs
        self.k = min(n, 8)
        self.w = n - self.k + 1
        self.postings = defaultdict(list)
        for idx, doc in enumerate(docs):
            for fp in winnow(doc.han, self.k, self.w):
                self.postings[fp].append(idx)

    def candidates(self, doc):
        found = set()
        for fp in winnow(doc.han, self.k, self.w):
            found.update(self.postings.get(fp, ()))
        return [self.docs[i] for i in sorted(found)]


def ngram_index(s, n):
    index = defaultdict(list)
    for i in range(len(s) - n + 1):
        index[s[i:i + n]].append(i)
    return index


def compare(a, a_index, b, n):
    """返回 a 中与 b 重复的区间 [(起, 止)]（按汉字下标），不满足判重条件时返回空列表。"""
    starts = set()
    for gram in {b.han[i:i + n] for i in range(len(b.han) - n + 1)}:
        starts.update(a_index.get(gram, ()))
    starts = sorted(starts)

    spans, seen = [], set()
    i = 0
    while i < len(starts):
        j = i
        while j + 1 < len(starts) and starts[j + 1] == starts[j] + 1:
            j += 1
        span = (starts[i], starts[j] + n)
        fragment = a.han[span[0]:span[1]]
        if fragment not in seen:  # 同一段话复制多次只计一次
            seen.add(fragment)
            spans.append(span)
        i = j + 1

    spans = merge(spans)
    dup = sum(e - s for s, e in spans)
    if dup < MIN_DUP_CHARS or dup < MIN_DUP_RATIO * len(a.han):
        return []
    return spans


def merge(spans):
    merged = []
    for s, e in sorted(spans):
        if merged and s <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))
    return merged


def check(targets, library, mode, n):
    """返回每篇待查文档的结果 {doc, covered, sources:[(来源名, 类型, 区间)]}。"""
    results = [{"doc": t, "sources": []} for t in targets]
    jobs = []
    if mode in ("vertical", "both") and library:
        jobs.append(("比对库", Index(library, n)))
    if mode in ("horizontal", "both") and len(targets) > 1:
        jobs.append(("本批次", Index(targets, n)))

    for result in results:
        a = result["doc"]
        a_index = ngram_index(a.han, n)
        for kind, index in jobs:
            for b in index.candidates(a):
                if b is a or (kind == "比对库" and b.name == a.name):
                    continue
                spans = compare(a, a_index, b, n)
                if spans:
                    result["sources"].append((b.name, kind, spans))
        result["sources"].sort(key=lambda src: -span_len(src[2]))
        result["covered"] = merge([sp for _, _, spans in result["sources"] for sp in spans])
    return results


def span_len(spans):
    return sum(e - s for s, e in spans)


def rate(dup, total):
    return dup / total if total else 0.0


# ---------------------------------------------------------------- 报告

REPORT_CSS = """
:root { color-scheme: light; }
body { font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
       max-width: 900px; margin: 32px auto; padding: 0 16px; color: #1f2328; background: #fff; line-height: 1.8; }
h1 { font-size: 22px; margin-bottom: 4px; }
.meta { color: #59636e; font-size: 14px; }
.stats { display: flex; gap: 32px; margin: 20px 0; padding: 16px 20px; background: #f6f8fa; border-radius: 8px; }
.stats b { display: block; font-size: 26px; }
.stats .rate b { color: #cf222e; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #d1d9e0; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
.fulltext { white-space: pre-wrap; font-size: 15px; }
mark { background: #ffd8d3; color: #a40e26; }
details { margin: 8px 0; }
summary { cursor: pointer; }
.frag { margin: 6px 0; padding: 6px 10px; background: #fff5f3; border-left: 3px solid #cf222e; font-size: 14px; }
"""


def display_slice(doc, span):
    s, e = span
    return doc.text[doc.han_pos[s]:doc.han_pos[e - 1] + 1]


def highlighted_text(doc, covered):
    """全文中重复部分加 <mark>，重复区间内夹着的标点一并标出。"""
    marked = bytearray(len(doc.text))
    for s, e in covered:
        for j in range(doc.han_pos[s], doc.han_pos[e - 1] + 1):
            marked[j] = 1
    parts, start = [], 0
    for j in range(1, len(doc.text) + 1):
        if j == len(doc.text) or marked[j] != marked[start]:
            chunk = html.escape(doc.text[start:j])
            parts.append(f"<mark>{chunk}</mark>" if marked[start] else chunk)
            start = j
    return "".join(parts)


def write_report(result, path, n, checked_at):
    doc, sources = result["doc"], result["sources"]
    total = len(doc.han)
    dup = span_len(result["covered"])
    rows = "".join(
        f"<tr><td>{html.escape(name)}</td><td>{kind}</td>"
        f"<td class=num>{span_len(spans)}</td><td class=num>{rate(span_len(spans), total):.2%}</td></tr>"
        for name, kind, spans in sources
    ) or "<tr><td colspan=4>未发现重复来源</td></tr>"
    details = "".join(
        f"<details><summary>与《{html.escape(name)}》重复的 {len(spans)} 处</summary>"
        + "".join(f"<div class=frag>{html.escape(display_slice(doc, sp))}</div>" for sp in spans)
        + "</details>"
        for name, _, spans in sources
    )
    path.write_text(f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>查重报告 - {html.escape(doc.name)}</title><style>{REPORT_CSS}</style></head>
<body>
<h1>查重报告：{html.escape(doc.name)}</h1>
<div class="meta">检测时间 {checked_at} · 查重阈值：连续 {n} 字相同 · 只统计汉字</div>
<div class="stats">
  <div class="rate">总重复率<b>{rate(dup, total):.2%}</b></div>
  <div>重复字数<b>{dup}</b></div>
  <div>总字数<b>{total}</b></div>
  <div>重复来源<b>{len(sources)}</b></div>
</div>
<h2>重复来源</h2>
<table><tr><th>来源</th><th>类型</th><th class=num>重复字数</th><th class=num>占本文</th></tr>{rows}</table>
{details}
<h2>全文（标红为重复部分）</h2>
<div class="fulltext">{highlighted_text(doc, result["covered"])}</div>
</body></html>
""", encoding="utf-8")


def write_outputs(results, out_dir, n):
    out_dir.mkdir(parents=True, exist_ok=True)
    checked_at = time.strftime("%Y-%m-%d %H:%M")
    used = set()
    with (out_dir / "result.csv").open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["文件名", "总字数", "重复字数", "总重复率", "重复来源数", "最主要来源", "该来源重复率"])
        for result in results:
            doc, sources = result["doc"], result["sources"]
            total, dup = len(doc.han), span_len(result["covered"])
            top_name, top_rate = ("", "")
            if sources:
                top_name, top_rate = sources[0][0], f"{rate(span_len(sources[0][2]), total):.2%}"
            writer.writerow([doc.name, total, dup, f"{rate(dup, total):.2%}", len(sources), top_name, top_rate])

            stem = doc.name
            while stem in used:
                stem += "_"
            used.add(stem)
            write_report(result, out_dir / f"{stem}.html", n, checked_at)


# ---------------------------------------------------------------- 命令行

def load_library(lib_dir):
    if not lib_dir.is_dir():
        return []
    return [(f.stem, f.read_text(encoding="utf-8")) for f in sorted(lib_dir.glob("*.txt"))]


def cmd_add(args):
    args.library.mkdir(parents=True, exist_ok=True)
    added = load_files(args.paths, not args.no_strip)
    for name, text in added:
        target = args.library / f"{name}.txt"
        print(f"[{'更新' if target.exists() else '添加'}] {name}（{sum(map(is_han, text))} 字）")
        target.write_text(text, encoding="utf-8")
    print(f"比对库现有 {len(list(args.library.glob('*.txt')))} 篇：{args.library}")


def cmd_list(args):
    docs = load_library(args.library)
    for name, text in docs:
        print(f"{name}\t{sum(map(is_han, text))} 字")
    print(f"共 {len(docs)} 篇：{args.library}")


def cmd_remove(args):
    for name in args.names:
        target = args.library / f"{Path(name).stem}.txt"
        if target.exists():
            target.unlink()
            print(f"[删除] {target.stem}")
        else:
            print(f"[跳过] 比对库中没有 {target.stem}", file=sys.stderr)


def cmd_check(args):
    if not 1 <= args.threshold <= 99:
        sys.exit("查重阈值应在 1 到 99 之间（推荐 10 到 16）")
    block = [w for word in args.block for w in word.split() if w]
    targets = [Doc(name, text, block) for name, text in load_files(args.paths, not args.no_strip)]
    if not targets:
        sys.exit("没有可查重的文件")
    library = []
    if args.mode != "horizontal":
        library = [Doc(name, text, block) for name, text in load_library(args.library)]
        if not library:
            print(f"[提醒] 比对库 {args.library} 是空的，跳过纵向查重；"
                  "纵向查重需要先用 add 添加比对文件", file=sys.stderr)
    if args.mode != "vertical" and len(targets) < 2:
        print("[提醒] 只有 1 个待查文件，跳过横向查重", file=sys.stderr)

    started = time.time()
    results = check(targets, library, args.mode, args.threshold)
    out_dir = args.out or Path("reports") / time.strftime("check_%Y%m%d_%H%M%S")
    write_outputs(results, out_dir, args.threshold)

    print(f"\n查重完成（{time.time() - started:.1f} 秒，比对库 {len(library)} 篇，阈值 {args.threshold}）")
    for result in results:
        doc, sources = result["doc"], result["sources"]
        total, dup = len(doc.han), span_len(result["covered"])
        top = f"，最主要来源《{sources[0][0]}》{rate(span_len(sources[0][2]), total):.2%}" if sources else ""
        print(f"  {doc.name}：重复率 {rate(dup, total):.2%}（{dup}/{total} 字）{top}")
    print(f"报告：{out_dir}/（每篇一个 HTML，汇总在 result.csv）")


def main(argv=None):
    parser = argparse.ArgumentParser(description="简体中文文档查重（纵向 + 横向）")
    parser.add_argument("--library", type=Path, default=Path("paper_library"),
                        help="比对库目录（默认 ./paper_library）")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("add", help="添加文件到比对库")
    p.add_argument("paths", nargs="+")
    p.add_argument("--no-strip", action="store_true", help="保留目录前内容和参考文献，全文入库")
    p.set_defaults(func=cmd_add)

    p = sub.add_parser("list", help="查看比对库")
    p.set_defaults(func=cmd_list)

    p = sub.add_parser("remove", help="从比对库删除")
    p.add_argument("names", nargs="+")
    p.set_defaults(func=cmd_remove)

    p = sub.add_parser("check", help="查重")
    p.add_argument("paths", nargs="+")
    p.add_argument("--mode", choices=["vertical", "horizontal", "both"], default="both",
                   help="vertical=与比对库比对，horizontal=同批文件互相比对，both=两者都做（默认）")
    p.add_argument("-n", "--threshold", type=int, default=DEFAULT_THRESHOLD,
                   help=f"连续多少个字相同算重复（默认 {DEFAULT_THRESHOLD}，推荐 10 到 16）")
    p.add_argument("--block", nargs="*", default=[], help="过滤的关键词，如学校名、机构名")
    p.add_argument("--out", type=Path, help="报告输出目录（默认 reports/check_时间）")
    p.add_argument("--no-strip", action="store_true", help="保留目录前内容和参考文献，全文查重")
    p.set_defaults(func=cmd_check)

    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
