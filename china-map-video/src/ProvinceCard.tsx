import type React from "react";
import { useMemo } from "react";
import {
  Composition,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { loadChineseFont } from "./font";

export const UP_COLOR = "#FF6B5B"; // 红涨
export const DOWN_COLOR = "#3DDC97"; // 绿跌

type ProvinceCardProps = {
  readonly province: string;
  readonly rank: number;
  readonly metricLabel: string;
  readonly value: number;
  readonly decimals: number;
  readonly unit: string;
  readonly yoy: number;
  readonly accentColor: string;
  readonly style?: React.CSSProperties;
};

const formatNumber = (value: number, decimals: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const ProvinceCardInner: React.FC<ProvinceCardProps> = ({
  province,
  rank,
  metricLabel,
  value,
  decimals,
  unit,
  yoy,
  accentColor,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fontFamily = useMemo(
    () => loadChineseFont(`全国第名同比${province}${metricLabel}${unit}`),
    [province, metricLabel, unit],
  );
  const up = yoy >= 0;
  const yoyColor = up ? UP_COLOR : DOWN_COLOR;

  return (
    <Interactive.Div
      style={{
        position: "absolute",
        left: 1190,
        top: 0,
        width: 650,
        height: 1080,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        fontFamily,
        color: "white",
        ...style,
      }}
    >
      <div
        style={{
          padding: "8px 24px",
          borderRadius: 999,
          border: `2px solid ${accentColor}`,
          backgroundColor: `${accentColor}22`,
          color: accentColor,
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: "0.06em",
          opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(
            frame,
            [0, 0.5 * fps],
            ["0px 28px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
        }}
      >
        全国第 {rank} 名
      </div>
      <div
        style={{
          marginTop: 28,
          fontSize: 116,
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: "0.04em",
          opacity: interpolate(frame, [0.08 * fps, 0.6 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(
            frame,
            [0.08 * fps, 0.6 * fps],
            ["0px 32px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
        }}
      >
        {province}
      </div>
      <div
        style={{
          marginTop: 36,
          marginBottom: 40,
          height: 6,
          borderRadius: 3,
          backgroundColor: accentColor,
          width: interpolate(frame, [0.2 * fps, 0.75 * fps], [0, 96], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <div
        style={{
          fontSize: 40,
          fontWeight: 500,
          color: "#9FB0CC",
          letterSpacing: "0.04em",
          opacity: interpolate(frame, [0.3 * fps, 0.8 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {metricLabel}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 18,
          marginTop: 4,
          opacity: interpolate(frame, [0.35 * fps, 0.85 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <span
          style={{
            fontSize: 160,
            fontWeight: 900,
            lineHeight: 1.05,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatNumber(
            interpolate(frame, [0.35 * fps, 1.4 * fps], [0, value], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            }),
            decimals,
          )}
        </span>
        <span style={{ fontSize: 46, fontWeight: 700, color: "#C9D4E8" }}>
          {unit}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginTop: 20,
          fontSize: 52,
          fontWeight: 700,
          opacity: interpolate(frame, [0.85 * fps, 1.3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(
            frame,
            [0.85 * fps, 1.3 * fps],
            ["0px 24px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
        }}
      >
        <span style={{ fontSize: 40, fontWeight: 500, color: "#9FB0CC" }}>
          同比
        </span>
        <svg width={34} height={30} viewBox="0 0 34 30">
          <path
            d={up ? "M17 0 L34 30 L0 30 Z" : "M0 0 L34 0 L17 30 Z"}
            fill={yoyColor}
          />
        </svg>
        <span style={{ color: yoyColor, fontVariantNumeric: "tabular-nums" }}>
          {Math.abs(yoy).toFixed(1)}%
        </span>
      </div>
    </Interactive.Div>
  );
};

const provinceCardSchema = {
  province: {
    type: "text-content",
    default: "广东省",
    description: "省份名称",
  },
  rank: {
    type: "number",
    default: 1,
    min: 1,
    step: 1,
    integer: true,
    keyframable: false,
    hiddenFromList: false,
    description: "全国排名",
  },
  metricLabel: {
    type: "text-content",
    default: "地区生产总值",
    description: "指标名称",
  },
  value: {
    type: "number",
    default: 14.16,
    step: 0.01,
    keyframable: false,
    hiddenFromList: false,
    description: "指标数值",
  },
  decimals: {
    type: "number",
    default: 2,
    min: 0,
    max: 4,
    step: 1,
    integer: true,
    keyframable: false,
    hiddenFromList: false,
    description: "小数位数",
  },
  unit: { type: "text-content", default: "万亿元", description: "单位" },
  yoy: {
    type: "number",
    default: 3.5,
    step: 0.1,
    keyframable: false,
    hiddenFromList: false,
    description: "同比（%）",
  },
  accentColor: { type: "color", default: "#F2B544", description: "强调色" },
} as const satisfies InteractivitySchema;

export const ProvinceCard = Interactive.withSchema({
  Component: ProvinceCardInner,
  componentName: "<ProvinceCard>",
  schema: provinceCardSchema,
  wrapInSequence: true,
});

export const ProvinceCardComposition: React.FC = () => {
  return (
    <Composition
      id="ProvinceCard"
      component={ProvinceCard}
      durationInFrames={90}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        province: "广东省",
        rank: 1,
        metricLabel: "地区生产总值",
        value: 14.1634,
        decimals: 2,
        unit: "万亿元",
        yoy: 3.5,
        accentColor: "#F2B544",
      }}
    />
  );
};
