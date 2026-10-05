import { interpolateZoom } from "d3-interpolate";
import { Easing, interpolate } from "remotion";
import { MAP_HEIGHT, MAP_WIDTH, type ProvinceShape } from "./geo";

/** Seconds for each part of the video. */
export const TIMING = {
  intro: 3,
  move: 1.4,
  hold: 2.4,
  outroMove: 1.8,
  outroHold: 3.4,
};

export type Beat = {
  readonly moveStart: number;
  readonly arrive: number;
  /** First frame of the next move (or of the outro). */
  readonly leave: number;
};

export type Timeline = {
  readonly intro: number;
  readonly beats: Beat[];
  readonly outroStart: number;
  readonly outroArrive: number;
  readonly total: number;
};

export const getTimeline = (count: number, fps: number): Timeline => {
  const intro = Math.round(TIMING.intro * fps);
  const move = Math.round(TIMING.move * fps);
  const beat = move + Math.round(TIMING.hold * fps);
  const beats = Array.from({ length: count }, (_, i) => {
    const moveStart = intro + i * beat;
    return { moveStart, arrive: moveStart + move, leave: moveStart + beat };
  });
  const outroStart = intro + count * beat;
  const outroArrive = outroStart + Math.round(TIMING.outroMove * fps);
  return {
    intro,
    beats,
    outroStart,
    outroArrive,
    total: outroArrive + Math.round(TIMING.outroHold * fps),
  };
};

/** [centre x, centre y, visible width] in map units — the format d3.interpolateZoom expects. */
export type View = [number, number, number];

export const OVERVIEW: View = [MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH];

/** Where a focused province sits on screen; the right side is kept free for the card. */
const FOCUS_BOX = { x: 160, y: 150, width: 1000, height: 800 };
const MIN_ZOOM = 1.6;
const MAX_ZOOM = 9;

export const viewForProvince = (shape: ProvinceShape): View => {
  const { x, y, width, height } = shape.focus;
  const k = Math.min(
    MAX_ZOOM,
    Math.max(
      MIN_ZOOM,
      Math.min(FOCUS_BOX.width / width, FOCUS_BOX.height / height),
    ),
  );
  const screenX = FOCUS_BOX.x + FOCUS_BOX.width / 2;
  const screenY = FOCUS_BOX.y + FOCUS_BOX.height / 2;
  return [
    x + width / 2 + (MAP_WIDTH / 2 - screenX) / k,
    y + height / 2 + (MAP_HEIGHT / 2 - screenY) / k,
    MAP_WIDTH / k,
  ];
};

export const viewToTransform = ([cx, cy, w]: View) => {
  const k = MAP_WIDTH / w;
  return { k, x: MAP_WIDTH / 2 - cx * k, y: MAP_HEIGHT / 2 - cy * k };
};

type ZoomInterpolatorFactory = typeof interpolateZoom & {
  rho: (rho: number) => typeof interpolateZoom;
};

// Lower rho than d3's default (√2) means less zooming out on long moves.
const zoomPath = (interpolateZoom as ZoomInterpolatorFactory).rho(1.1);

const moveEasing = Easing.bezier(0.65, 0, 0.35, 1);
const settleEasing = Easing.out(Easing.quad);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Slow push-in while holding on a shot, so the frame never feels frozen. */
const drift = ([cx, cy, w]: View, progress: number): View => [
  cx,
  cy,
  w * (1 - 0.04 * progress),
];

const INTRO_START: View = [MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH * 1.08];

/**
 * Smooth zoom-and-pan path (van Wijk & Nuij) between consecutive shots:
 * overview → province 1 → province 2 → … → overview.
 */
export const getCameraView = (
  frame: number,
  timeline: Timeline,
  views: View[],
): View => {
  if (frame < timeline.intro) {
    const p = interpolate(frame, [0, timeline.intro], [0, 1], {
      ...clamp,
      easing: settleEasing,
    });
    return interpolateZoom(INTRO_START, OVERVIEW)(p) as View;
  }

  const restAfter = (i: number): View => drift(views[i], 1);

  for (let i = 0; i < timeline.beats.length; i++) {
    const { moveStart, arrive, leave } = timeline.beats[i];
    if (frame >= leave) {
      continue;
    }
    if (frame < arrive) {
      const from = i === 0 ? OVERVIEW : restAfter(i - 1);
      const t = interpolate(frame, [moveStart, arrive], [0, 1], {
        ...clamp,
        easing: moveEasing,
      });
      return zoomPath(from, views[i])(t) as View;
    }
    const p = interpolate(frame, [arrive, leave], [0, 1], {
      ...clamp,
      easing: settleEasing,
    });
    return drift(views[i], p);
  }

  const from = views.length > 0 ? restAfter(views.length - 1) : OVERVIEW;
  if (frame < timeline.outroArrive) {
    const t = interpolate(
      frame,
      [timeline.outroStart, timeline.outroArrive],
      [0, 1],
      { ...clamp, easing: moveEasing },
    );
    return zoomPath(from, OVERVIEW)(t) as View;
  }
  const p = interpolate(frame, [timeline.outroArrive, timeline.total], [0, 1], {
    ...clamp,
    easing: settleEasing,
  });
  return drift(OVERVIEW, p * 0.5);
};
