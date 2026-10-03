import random
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import paper_check as pc  # noqa: E402

N = pc.DEFAULT_THRESHOLD


def han(length, seed):
    rng = random.Random(seed)
    return "".join(chr(rng.randint(0x4E00, 0x9FA5)) for _ in range(length))


def dup_of(target, sources, mode="vertical"):
    library = sources if mode == "vertical" else []
    targets = [target] + ([] if mode == "vertical" else sources)
    result = pc.check(targets, library, mode, N)[0]
    return pc.span_len(result["covered"]), result["sources"]


class CompareTest(unittest.TestCase):
    def setUp(self):
        self.src = pc.Doc("来源", han(3000, 1))

    def test_copied_passage_is_counted(self):
        a = pc.Doc("待查", han(2000, 2) + self.src.han[100:300] + han(1000, 3))
        dup, sources = dup_of(a, [self.src])
        self.assertEqual(dup, 200)
        self.assertEqual(sources[0][0], "来源")

    def test_repeated_copy_counts_once(self):
        copied = self.src.han[100:300]
        a = pc.Doc("待查", han(2000, 2) + copied + han(1000, 3) + copied + han(1000, 4))
        self.assertEqual(dup_of(a, [self.src])[0], 200)

    def test_below_30_chars_is_ignored(self):
        a = pc.Doc("待查", han(2000, 2) + self.src.han[500:525] + han(1000, 3))
        self.assertEqual(dup_of(a, [self.src])[0], 0)

    def test_run_shorter_than_threshold_is_ignored(self):
        pieces = [self.src.han[i:i + N - 1] + han(20, 100 + i) for i in range(0, 1200, 40)]
        a = pc.Doc("待查", "".join(pieces))
        self.assertEqual(dup_of(a, [self.src])[0], 0)

    def test_same_name_in_library_is_skipped(self):
        a = pc.Doc("来源", self.src.han)
        self.assertEqual(dup_of(a, [self.src])[0], 0)

    def test_horizontal_mode_compares_batch(self):
        a = pc.Doc("甲", han(1000, 2) + self.src.han[0:400])
        dup, sources = dup_of(a, [self.src], mode="horizontal")
        self.assertEqual(dup, 400)
        self.assertEqual(sources[0][1], "本批次")

    def test_punctuation_does_not_break_match(self):
        copied = self.src.han[100:300]
        punctuated = "，".join(copied[i:i + 20] for i in range(0, 200, 20))
        a = pc.Doc("待查", han(1000, 2) + "。" + punctuated + "。" + han(500, 3))
        self.assertEqual(dup_of(a, [self.src])[0], 200)

    def test_blocklist_removes_keyword(self):
        doc = pc.Doc("x", "某某大学的研究表明", blocklist=["某某大学"])
        self.assertEqual(doc.han, "的研究表明")


class CleanTest(unittest.TestCase):
    def test_strips_toc_and_references(self):
        body = han(5000, 5)
        raw = "封面 摘要 目录 第一章 参考文献\n" + body + "\n参考文献\n[1] Smith 2020"
        self.assertEqual(pc.clean(raw), body)

    def test_keeps_only_chinese_and_normalizes_punctuation(self):
        self.assertEqual(pc.clean("深度学习（Deep Learning）。。是AI的分支；", strip=False), "深度学习，是的分支")


if __name__ == "__main__":
    unittest.main()
