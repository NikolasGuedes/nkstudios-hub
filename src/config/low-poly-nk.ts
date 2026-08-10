export const LOW_POLY_NK_MODEL_URL = "/3D/LowPolyNK.glb";
export const LOW_POLY_NK_FACE_MATERIAL = "m_face";

export const LOW_POLY_NK_FACE_OFFSETS = {
  blink: [0, 0.25],
  face2: [0, 0.5],
  face3: [0.5, 0.5],
  neutral: [0, 0],
  wink: [0, 0.75],
} as const;

export type LowPolyNkFace = keyof typeof LOW_POLY_NK_FACE_OFFSETS;

export const LOW_POLY_NK_ANIMATIONS = {
  crossFadeSeconds: 0.35,
  fps: 24,
  idleClip: "IDLE",
  idleBeforeRandomSeconds: 3,
  randomClips: ["GREETING", "LOOKING", "STRETCHING"],
} as const;

export type LowPolyNkAnimation =
  | typeof LOW_POLY_NK_ANIMATIONS.idleClip
  | (typeof LOW_POLY_NK_ANIMATIONS.randomClips)[number];

export type LowPolyNkRandomAnimation =
  (typeof LOW_POLY_NK_ANIMATIONS.randomClips)[number];

const NATURAL_BLINK = {
  frameCount: 100,
  ranges: [
    [45, 49],
    [88, 92],
  ],
} as const;

function getNaturalBlinkFace(frame: number): LowPolyNkFace {
  const cycleFrame = frame % NATURAL_BLINK.frameCount;
  const isBlinking = NATURAL_BLINK.ranges.some(
    ([start, end]) => cycleFrame >= start && cycleFrame < end,
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

function getGreetingFace(frame: number): LowPolyNkFace {
  if ((frame >= 45 && frame < 49) || (frame >= 88 && frame < 92)) {
    return "blink";
  }

  if (frame >= 70 && frame < 88) return "wink";

  return "neutral";
}

export function getLowPolyNkFace(
  animation: LowPolyNkAnimation,
  time: number,
): LowPolyNkFace {
  const frame = time * LOW_POLY_NK_ANIMATIONS.fps;

  if (animation === "GREETING") return getGreetingFace(frame);
  if (animation === "LOOKING") return getLookingFace(frame);

  return getNaturalBlinkFace(frame);
}
