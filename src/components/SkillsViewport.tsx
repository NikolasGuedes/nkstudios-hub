import {
  Grid,
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Eye, Grip, MousePointer2, X } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { __, useLocale } from "../lib/i18n";
import { CursorFollower } from "./ui/cursor-follower";
import ShaderBackground from "./ShaderBackground";

const SCENE_COLORS = {
  directional: "#ffffff",
  emissive: "#8cc8ff",
  grid: "#d7e8ff",
  point: "#006fff",
} as const;

const CAMERA_POSITION: [number, number, number] = [0, 2.45, 8.4];
const GROUND_Y = -1.95;
const MODEL_SCALE = 0.72;
const MODEL_POSITION: [number, number, number] = [0, -2.005, 0];
const MODEL_ROTATION: [number, number, number] = [0, -Math.PI / 2, 0];
const MODEL_URL = "/3D/LowPolyNK.glb";
const ORBIT_TARGET: [number, number, number] = [0, -0.2, 0];
const VIEWPORT_READY_EVENT = "nkstudios:viewport-ready";

function LowPolyModel() {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => scene.clone(true), [scene]);

  return (
    <group
      position={MODEL_POSITION}
      rotation={MODEL_ROTATION}
      scale={MODEL_SCALE}
    >
      <primitive object={model} />
    </group>
  );
}

function Scene3D({
  isVisible,
}: {
  isVisible: boolean;
}) {
  return (
    <Canvas
      className="absolute inset-0 h-full w-full"
      dpr={[1, 1.5]}
      frameloop={isVisible ? "always" : "never"}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      shadows={false}
    >
      <PerspectiveCamera fov={38} makeDefault position={CAMERA_POSITION} />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={1.6}
        minPolarAngle={1.05}
        rotateSpeed={0.7}
        target={ORBIT_TARGET}
      />
      <ambientLight intensity={1.25} />
      <directionalLight
        color={SCENE_COLORS.directional}
        intensity={1.55}
        position={[2, 4, 3]}
      />
      <pointLight
        color={SCENE_COLORS.emissive}
        intensity={11}
        position={[-3, 1.5, 2.5]}
      />
      <pointLight
        color={SCENE_COLORS.point}
        intensity={8}
        position={[3, 0.8, 1.5]}
      />

      <group position={[0, GROUND_Y, -10.5]}>
        <Grid
          args={[80, 44]}
          cellColor={SCENE_COLORS.grid}
          cellSize={0.9}
          cellThickness={0.4}
          fadeDistance={78}
          fadeStrength={1.8}
          followCamera={false}
          infiniteGrid
          sectionColor={SCENE_COLORS.directional}
          sectionSize={4.5}
          sectionThickness={0.78}
          side={2}
        />
      </group>

      <LowPolyModel />
    </Canvas>
  );
}

export default function SkillsViewport() {
  useLocale();

  const reduceMotion = useReducedMotion();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [isViewportVisible, setIsViewportVisible] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setIsViewportVisible(entry.isIntersecting);
      },
      { rootMargin: "80px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId = 0;
    let firstFrameId = 0;
    let secondFrameId = 0;

    const dispatchReady = () => {
      if (cancelled) return;

      window.dispatchEvent(new CustomEvent(VIEWPORT_READY_EVENT));
    };

    firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(dispatchReady);
    });

    timeoutId = window.setTimeout(dispatchReady, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
    };
  }, []);

  return (
    <section
      data-skills-viewport
      ref={sectionRef}
      className="relative h-full cursor-none overflow-hidden rounded-[2.25rem] bg-[var(--Azul)]"
    >
      <ShaderBackground
        isVisible={isViewportVisible}
        reduceMotion={reduceMotion}
      />

      <Scene3D isVisible={isViewportVisible} />
      <CursorFollower
        containerRef={sectionRef}
        defaultIcon={<Grip size={18} strokeWidth={2.1} />}
        hoverIcon={<MousePointer2 size={16} strokeWidth={2.2} />}
        interactiveSelector="button, [data-cursor-hover]"
      />

      {detailsVisible ? (
        <div className="absolute bottom-5 left-5 z-30 w-[calc(100%-2.5rem)] max-w-[42rem] rounded-[1.75rem] border border-[color:var(--line-mid)] bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] px-5 py-4 shadow-[var(--shadow-panel-lg)] backdrop-blur-md md:bottom-8 md:left-8 md:px-6 md:py-5">
          <div className="flex items-start justify-between gap-4">
            <p className="pt-2 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--Branco)]">
              {__("Model references")}
            </p>
            <button
              aria-label={__("Hide details")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--line-mid)] bg-[var(--surface-softer)] text-[var(--Branco)] transition hover:bg-[var(--surface-soft)]"
              onClick={() => setDetailsVisible(false)}
              type="button"
            >
              <X size={15} strokeWidth={2.2} />
            </button>
          </div>

          <p className="mt-2 text-sm leading-6 text-[var(--Branco)]">
            {__(
              "Reference images used to create the LowPolyNK test model.",
            )}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <figure className="overflow-hidden rounded-2xl border border-[color:var(--line-mid)] bg-black/15 p-2">
              <img
                alt={__("Front reference")}
                className="h-[clamp(9rem,28vh,15rem)] w-full object-contain"
                src="/3D/referencia_01.JPG"
              />
              <figcaption className="px-1 pb-1 pt-2 text-center text-[0.62rem] uppercase tracking-[0.16em] text-[var(--Branco)]">
                {__("Front reference")}
              </figcaption>
            </figure>

            <figure className="overflow-hidden rounded-2xl border border-[color:var(--line-mid)] bg-black/15 p-2">
              <img
                alt={__("Side reference")}
                className="h-[clamp(9rem,28vh,15rem)] w-full object-contain"
                src="/3D/referencia_02.JPG"
              />
              <figcaption className="px-1 pb-1 pt-2 text-center text-[0.62rem] uppercase tracking-[0.16em] text-[var(--Branco)]">
                {__("Side reference")}
              </figcaption>
            </figure>
          </div>
        </div>
      ) : (
        <button
          aria-label={__("Show details")}
          className="absolute bottom-5 left-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line-mid)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-[var(--Branco)] shadow-[var(--shadow-panel)] backdrop-blur-md transition hover:bg-[var(--surface-soft)] md:bottom-8 md:left-8"
          onClick={() => setDetailsVisible(true)}
          type="button"
        >
          <Eye size={18} strokeWidth={2.2} />
        </button>
      )}
    </section>
  );
}

useGLTF.preload(MODEL_URL);
