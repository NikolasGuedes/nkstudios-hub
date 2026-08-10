export const LOW_POLY_NK_MODEL_URL = "/3D/LowPolyNK_4.glb";
export const LOW_POLY_NK_FACE_MATERIAL = "m_face";

export const LOW_POLY_NK_FACE_OFFSETS = {
  blink: [0, 0.25],
  face2: [0, 0.5],
  face3: [0.5, 0.5],
  neutral: [0, 0],
} as const;

export type LowPolyNkFace = keyof typeof LOW_POLY_NK_FACE_OFFSETS;

export const LOW_POLY_NK_ANIMATIONS = {
  crossFadeSeconds: 0.35,
  fps: 24,
  idleBeforeLookingSeconds: 3,
  sequence: ["IDLE", "LOOKING"],
} as const;

export type LowPolyNkAnimation =
  (typeof LOW_POLY_NK_ANIMATIONS.sequence)[number];

const IDLE_BLINK_FRAME_RANGES = [[45, 49]] as const;

function getIdleFace(frame: number): LowPolyNkFace {
  const isBlinking = IDLE_BLINK_FRAME_RANGES.some(
    ([start, end]) => frame >= start && frame < end,
  );

  return isBlinking ? "blink" : "neutral";
}

function getLookingFace(frame: number): LowPolyNkFace {
  if ((frame >= 62 && frame < 68) || (frame >= 130 && frame < 136)) {
    return "blink";
  }

  if ((frame >= 18 && frame < 62) || (frame >= 136 && frame < 190)) {
    return "face2";
  }

  if (frame >= 68 && frame < 130) return "face3";

  return "neutral";
}

export function getLowPolyNkFace(
  animation: LowPolyNkAnimation,
  time: number,
): LowPolyNkFace {
  const frame = time * LOW_POLY_NK_ANIMATIONS.fps;

  if (animation === "LOOKING") return getLookingFace(frame);

  return getIdleFace(frame);
}
