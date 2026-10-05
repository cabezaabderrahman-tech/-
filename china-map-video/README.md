# 中国地图数据动画

用 [Remotion](https://www.remotion.dev/) 制作的省级数据动画：镜头在省份之间平滑移动，逐个高亮，每次只显示一个省份的四项信息——省份名称、核心指标、同比、全国排名。最后拉回全国视图，按数值深浅一起点亮。

- 尺寸 1920×1080，30fps；时长随省份数量自动计算（10 个省约 46 秒）
- 示例数据：2024 年各省 GDP 前十（各省统计局公布的数据，同比为按不变价格计算的实际增速）

## 常用命令

```bash
npm i            # 安装依赖
npm run dev      # 打开 Remotion Studio 预览
npx remotion render ChinaMapData out/china-map-data.mp4   # 导出 MP4
```

## 换成自己的数据

打开 `src/ChinaMapData.tsx`，修改 `<Composition>` 里的 `defaultProps`，或者在 Studio 右侧面板直接编辑：

| 字段 | 含义 |
|---|---|
| `title` / `subtitle` | 开场标题和副标题；标题也会显示在左上角和结尾 |
| `source` | 结尾的数据来源说明 |
| `metricLabel` / `unit` / `decimals` | 指标名称、单位、小数位数 |
| `accentColor` | 高亮颜色 |
| `provinces` | 按播放顺序排列的省份列表：`name`、`value`、`yoy`（同比，%）、`rank` |

- 省份名称写简称（`广东`）或全称（`广东省`）都可以；写错时会报错并列出可用名称。
- 列表顺序就是播放顺序。示例按第 10 名到第 1 名倒序播放，最后落在第一名。
- 同比为正显示红色 ▲，为负显示绿色 ▼（红涨绿跌）。
- 想调整节奏，改 `src/camera.ts` 里的 `TIMING`（单位：秒）。

## 文件结构

| 文件 | 作用 |
|---|---|
| `src/ChinaMapData.tsx` | 主画面：地图、高亮、标题、结尾，以及合成注册和默认数据 |
| `src/ProvinceCard.tsx` | 右侧信息卡片，在 Studio 里也可以单独打开（Elements / ProvinceCard） |
| `src/camera.ts` | 时间线和镜头路径（d3 `interpolateZoom`，平滑推拉摇移） |
| `src/geo.ts` | 投影（兰伯特等角圆锥，标准纬线 25°N / 47°N）、省份路径和取景框 |
| `src/font.ts` | 思源黑体（Noto Sans SC），随项目打包，渲染时不需要联网 |
| `src/data/china-provinces.json` | 省级边界数据，由 `scripts/prepare-geo.mjs` 生成 |

## 地图数据说明

省级边界来自 npm 包 [`cn-atlas`](https://github.com/BarbarossaWang/cn-atlas)（源自 shengshixian.com 2023 年版），包含 34 个省级行政区以及南海诸岛岛屿，但**不含南海断续线**。

如果视频要在中国境内公开发布，地图须符合国家标准地图要求（使用[标准地图服务](http://bzdt.ch.mnr.gov.cn/)的底图，或报送审核取得审图号）。
