import { zColor } from "@remotion/zod-types";
import type React from "react";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Interactive,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
  type CalculateMetadataFunction,
} from "remotion";
import { z } from "zod";
import {
  getCameraView,
  getTimeline,
  viewForProvince,
  viewToTransform,
} from "./camera";
import { loadChineseFont } from "./font";
import {
  findProvinceShape,
  MAP_HEIGHT,
  MAP_WIDTH,
  provinceShapes,
} from "./geo";
import { ProvinceCard } from "./ProvinceCard";

export const chinaMapDataSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  source: z.string(),
  metricLabel: z.string(),
  unit: z.string(),
  decimals: z.number().int().min(0).max(4),
  accentColor: zColor(),
  /** Shown in this order. Names may be short ("广东") or full ("广东省"). */
  provinces: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      yoy: z.number(),
      rank: z.number().int().min(1),
    }),
  ),
});

type Props = z.infer<typeof chinaMapDataSchema>;

const FPS = 30;

const COLORS = {
  land: "#1B2E4E",
  border: "#3A5888",
  activeStroke: "#FFF1C9",
  muted: "#9FB0CC",
  soft: "#C9D4E8",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const ChinaMapData: React.FC<Props> = ({
  title,
  subtitle,
  source,
  metricLabel,
  unit,
  decimals,
  accentColor,
  provinces,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fontFamily = useMemo(
    () => loadChineseFont(title + subtitle + source),
    [title, subtitle, source],
  );
  const timeline = useMemo(
    () => getTimeline(provinces.length, fps),
    [provinces.length, fps],
  );
  const shapes = useMemo(
    () => provinces.map((p) => findProvinceShape(p.name)),
    [provinces],
  );
  const views = useMemo(() => shapes.map(viewForProvince), [shapes]);

  const camera = viewToTransform(getCameraView(frame, timeline, views));
  const mapTransform = `translate(${camera.x} ${camera.y}) scale(${camera.k})`;
  const maxValue = Math.max(...provinces.map((p) => p.value));
  const moveFrames = timeline.beats[0]
    ? timeline.beats[0].arrive - timeline.beats[0].moveStart
    : 0;

  const activeAmount = (i: number) => {
    const { arrive, leave } = timeline.beats[i];
    return interpolate(
      frame,
      [arrive - 0.5 * fps, arrive, leave, leave + 0.5 * fps],
      [0, 1, 1, 0],
      clamp,
    );
  };

  const fillFor = (adcode: string) => {
    const i = shapes.findIndex((s) => s.adcode === adcode);
    if (i === -1) {
      return COLORS.land;
    }
    const summary = interpolateColors(
      0.3 + 0.7 * (provinces[i].value / maxValue),
      [0, 1],
      [COLORS.land, accentColor],
    );
    const stagger = i * 0.08 * fps;
    const settled = interpolateColors(
      frame,
      [
        timeline.outroArrive - 0.4 * fps + stagger,
        timeline.outroArrive + 0.3 * fps + stagger,
      ],
      [COLORS.land, summary],
    );
    return interpolateColors(activeAmount(i), [0, 1], [settled, accentColor]);
  };

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        background:
          "radial-gradient(ellipse at 45% 50%, #10213D 0%, #081226 55%, #040912 100%)",
      }}
    >
      <svg
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [0, 0.8 * fps], [0, 1], clamp),
        }}
      >
        <g transform={mapTransform}>
          {provinceShapes.map((shape) => (
            <path
              key={shape.adcode}
              d={shape.d}
              fill={fillFor(shape.adcode)}
              stroke={COLORS.border}
              strokeWidth={1}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        <g style={{ filter: `drop-shadow(0 0 18px ${accentColor}99)` }}>
          {shapes.map((shape, i) => {
            const amount = activeAmount(i);
            if (amount <= 0) {
              return null;
            }
            return (
              <path
                key={shape.adcode}
                d={shape.d}
                transform={mapTransform}
                fill={accentColor}
                fillOpacity={amount}
                stroke={COLORS.activeStroke}
                strokeOpacity={amount}
                strokeWidth={2.5}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </g>
      </svg>

      {/* Keeps the card readable over the map. */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(4,9,18,0) 50%, rgba(4,9,18,0.8) 68%, rgba(4,9,18,0.92) 100%)",
          opacity: interpolate(
            frame,
            [
              timeline.intro,
              timeline.intro + moveFrames,
              timeline.outroStart,
              timeline.outroStart + 0.6 * fps,
            ],
            [0, 1, 1, 0],
            clamp,
          ),
        }}
      />

      <Interactive.Div
        name="Intro title"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          backgroundColor: "rgba(4,9,18,0.55)",
          color: "white",
          opacity: interpolate(
            frame,
            [0.1 * fps, 0.8 * fps, 2.2 * fps, 2.9 * fps],
            [0, 1, 1, 0],
            clamp,
          ),
        }}
      >
        <div
          style={{ fontSize: 124, fontWeight: 900, letterSpacing: "0.06em" }}
        >
          {title}
        </div>
        <div style={{ fontSize: 48, fontWeight: 500, color: COLORS.soft }}>
          {subtitle}
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="Header"
        style={{
          position: "absolute",
          left: 96,
          top: 72,
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 36,
          fontWeight: 700,
          color: COLORS.soft,
          letterSpacing: "0.04em",
          opacity: interpolate(
            frame,
            [
              2.7 * fps,
              3.3 * fps,
              timeline.outroStart,
              timeline.outroStart + 0.5 * fps,
            ],
            [0, 1, 1, 0],
            clamp,
          ),
        }}
      >
        <div
          style={{
            width: 8,
            height: 40,
            borderRadius: 4,
            backgroundColor: accentColor,
          }}
        />
        {title}
      </Interactive.Div>

      {provinces.map((province, i) => {
        const { arrive, leave } = timeline.beats[i];
        const from = Math.round(arrive - 0.25 * fps);
        return (
          <ProvinceCard
            key={`${i}-${province.name}`}
            name={`Card ${province.name}`}
            province={province.name}
            from={from}
            durationInFrames={Math.round(leave + 0.5 * fps) - from}
            premountFor={fps}
            rank={province.rank}
            metricLabel={metricLabel}
            value={province.value}
            decimals={decimals}
            unit={unit}
            yoy={province.yoy}
            accentColor={accentColor}
            style={{
              opacity: interpolate(
                frame,
                [leave, leave + 0.4 * fps],
                [1, 0],
                clamp,
              ),
              translate: interpolate(
                frame,
                [leave, leave + 0.4 * fps],
                ["0px 0px", "-48px 0px"],
                { ...clamp, easing: Easing.in(Easing.cubic) },
              ),
            }}
          />
        );
      })}

      <Interactive.Div
        name="Outro"
        style={{
          position: "absolute",
          left: 120,
          bottom: 110,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          color: "white",
          opacity: interpolate(
            frame,
            [timeline.outroArrive, timeline.outroArrive + 0.6 * fps],
            [0, 1],
            clamp,
          ),
          translate: interpolate(
            frame,
            [timeline.outroArrive, timeline.outroArrive + 0.6 * fps],
            ["0px 24px", "0px 0px"],
            { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) },
          ),
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: "0.04em" }}>
          {title}
        </div>
        <div style={{ fontSize: 32, fontWeight: 500, color: COLORS.muted }}>
          {source}
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};

const calculateMetadata: CalculateMetadataFunction<Props> = ({ props }) => {
  return {
    durationInFrames: getTimeline(props.provinces.length, FPS).total,
  };
};

export const ChinaMapDataComposition: React.FC = () => {
  return (
    <Composition
      id="ChinaMapData"
      component={ChinaMapData}
      durationInFrames={1386}
      fps={FPS}
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
      schema={chinaMapDataSchema}
      calculateMetadata={calculateMetadata}
      defaultProps={{
        title: "2024年 各省GDP十强",
        subtitle: "地区生产总值 · 单位：万亿元",
        source: "数据来源：各省（市）统计局，同比为按不变价格计算的实际增速",
        metricLabel: "地区生产总值",
        unit: "万亿元",
        decimals: 2,
        accentColor: "#F2B544",
        provinces: [
          { name: "湖南省", value: 5.3231, yoy: 4.8, rank: 10 },
          { name: "上海市", value: 5.3927, yoy: 5.0, rank: 9 },
          { name: "福建省", value: 5.7761, yoy: 5.5, rank: 8 },
          { name: "湖北省", value: 6.0013, yoy: 5.8, rank: 7 },
          { name: "河南省", value: 6.359, yoy: 5.1, rank: 6 },
          { name: "四川省", value: 6.4697, yoy: 5.7, rank: 5 },
          { name: "浙江省", value: 9.0131, yoy: 5.5, rank: 4 },
          { name: "山东省", value: 9.8566, yoy: 5.7, rank: 3 },
          { name: "江苏省", value: 13.7008, yoy: 5.8, rank: 2 },
          { name: "广东省", value: 14.1634, yoy: 3.5, rank: 1 },
        ],
      }}
    />
  );
};
