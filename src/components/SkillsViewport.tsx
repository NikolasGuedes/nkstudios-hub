import { Float, Grid, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';
import { Eye, Grip, MousePointer2, X } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { __, useLocale } from '../lib/i18n';
import { CursorFollower } from './ui/cursor-follower';
import type { Mesh } from 'three';

const tabs = [
  { id: 'modelagem3d', label: '3D MODELING' },
  { id: 'jogos', label: 'GAMES' },
  { id: 'design', label: 'DESIGN' },
] as const;

const SCENE_COLORS = {
  directional: '#ffffff',
  emissive: '#8cc8ff',
  grid: '#d7e8ff',
  mesh: '#ffffff',
  point: '#006fff',
  shaderBlue: '#006FFF',
  shaderBlueSoft: '#0E70EB',
  shaderBlueStrong: '#005eeb',
} as const;

const CAMERA_POSITION: [number, number, number] = [0, 2.45, 8.4];
const MODEL_POSITION: [number, number, number] = [0, -0.08, 0];
const ORBIT_TARGET: [number, number, number] = MODEL_POSITION;
const VIEWPORT_READY_EVENT = 'nkstudios:viewport-ready';

function PlaceholderModel({ reduceMotion }: { reduceMotion: boolean | null }) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    meshRef.current.rotation.y += delta * 0.42;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
    meshRef.current.position.y = MODEL_POSITION[1] + Math.sin(state.clock.elapsedTime * 0.9) * 0.04;
  });

  return (
    <Float
      floatIntensity={reduceMotion ? 0.2 : 0.9}
      rotationIntensity={reduceMotion ? 0.15 : 0.45}
      speed={reduceMotion ? 0.4 : 1.2}
    >
      <mesh ref={meshRef} castShadow position={MODEL_POSITION}>
        <torusKnotGeometry args={[0.58, 0.2, 220, 32, 2, 3]} />
        <meshPhysicalMaterial
          clearcoat={1}
          clearcoatRoughness={0.12}
          color={SCENE_COLORS.mesh}
          emissive={SCENE_COLORS.emissive}
          emissiveIntensity={0.32}
          metalness={0.22}
          roughness={0.1}
        />
      </mesh>
    </Float>
  );
}

function Scene3D({ reduceMotion, isVisible }: { reduceMotion: boolean | null; isVisible: boolean }) {
  return (
    <Canvas
      className="absolute inset-0 h-full w-full"
      dpr={[1, 1.5]}
      frameloop={isVisible ? 'always' : 'never'}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
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
      <directionalLight color={SCENE_COLORS.directional} intensity={1.55} position={[2, 4, 3]} />
      <pointLight color={SCENE_COLORS.emissive} intensity={11} position={[-3, 1.5, 2.5]} />
      <pointLight color={SCENE_COLORS.point} intensity={8} position={[3, 0.8, 1.5]} />

      <group position={[0, -1.95, -10.5]}>
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

      <PlaceholderModel reduceMotion={reduceMotion} />
    </Canvas>
  );
}

export default function SkillsViewport() {
  useLocale();

  const activeTab = 'modelagem3d';
  const reduceMotion = useReducedMotion();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [isViewportVisible, setIsViewportVisible] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry) setIsViewportVisible(entry.isIntersecting);
      },
      { rootMargin: '200px 0px' },
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
      className="relative h-full cursor-none overflow-hidden rounded-[2.25rem] bg-[var(--skill-blue)]"
    >
      <div className="absolute inset-0">
        <ShaderGradientCanvas
          className="h-full w-full"
          pixelDensity={1}
          pointerEvents="none"
          style={{ width: '100%', height: '100%' }}
        >
          <ShaderGradient
            animate={reduceMotion || !isViewportVisible ? 'off' : 'on'}
            axesHelper="off"
            bgColor1="var(--page-bg)"
            bgColor2="var(--page-bg)"
            brightness={1.2}
            cAzimuthAngle={180}
            cDistance={3.6}
            cPolarAngle={90}
            cameraZoom={1}
            color1={SCENE_COLORS.shaderBlue}
            color2={SCENE_COLORS.shaderBlueStrong}
            color3={SCENE_COLORS.shaderBlueSoft}
            control="props"
            destination="onCanvas"
            embedMode="off"
            envPreset="city"
            format="gif"
            fov={45}
            frameRate={10}
            gizmoHelper="hide"
            grain="off"
            lightType="3d"
            positionX={-1.4}
            positionY={0}
            positionZ={0}
            range="disabled"
            rangeEnd={40}
            rangeStart={0}
            reflection={0.1}
            rotationX={0}
            rotationY={10}
            rotationZ={50}
            shader="defaults"
            type="waterPlane"
            uAmplitude={1}
            uDensity={1.3}
            uFrequency={5.5}
            uSpeed={0.1}
            uStrength={4.8}
            uTime={0}
            wireframe={false}
          />
        </ShaderGradientCanvas>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[var(--surface-blur)] backdrop-blur-[22px]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.012)_22%,rgba(18,90,255,0.035)_58%,rgba(8,56,201,0.1)_100%)]" />

      <Scene3D isVisible={isViewportVisible} reduceMotion={reduceMotion} />
      <CursorFollower
        containerRef={sectionRef}
        defaultIcon={<Grip size={18} strokeWidth={2.1} />}
        hoverIcon={<MousePointer2 size={16} strokeWidth={2.2} />}
        interactiveSelector='button, [data-cursor-hover]'
      />

      <div className="pointer-events-none absolute left-5 top-5 z-30 rounded-2xl md:left-8 md:top-8">
        <p className="text-[0.72rem] font-semibold tracking-[0.42em] text-[var(--text-primary)]">
          {__('MY SKILLS')}
        </p>
      </div>

      <div className="absolute right-5 top-5 z-30  p-4 md:right-8 md:top-8 md:p-5">
        <div className="flex flex-col gap-3">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <button
                data-cursor-hover
                key={tab.id}
                className={[
                  'min-w-[8.8rem] rounded-full border px-4 py-1.5 text-center text-[0.68rem] tracking-[0.14em] transition-colors cursor-none',
                  isActive
                    ? 'border-[var(--text-primary)] bg-[var(--text-primary)] font-bold text-[color:var(--page-bg)]'
                    : 'border-[var(--text-primary)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
                ].join(' ')}
                type="button"
              >
                {__(tab.label)}
              </button>
            );
          })}
        </div>
      </div>

      {detailsVisible ? (
        <div className="absolute bottom-5 left-5 z-30 max-w-[19rem] rounded-[1.75rem] border border-[color:var(--line-mid)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-5 py-4 shadow-[var(--shadow-panel-lg)] backdrop-blur-md md:bottom-8 md:left-8 md:px-6 md:py-5">
          <div className="flex items-start justify-between gap-4">
            <p className="pt-2 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--text-primary)]">
              {__('Active 3D scene')}
            </p>
            <button
              aria-label={__('Hide details')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--line-mid)] bg-[var(--surface-softer)] text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
              onClick={() => setDetailsVisible(false)}
              type="button"
            >
              <X size={15} strokeWidth={2.2} />
            </button>
          </div>

          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
            {__(
              'The central placeholder will be replaced by your final model. For now, the focus is structuring the viewport, grid, camera, and background.',
            )}
          </p>
        </div>
      ) : (
        <button
          aria-label={__('Show details')}
          className="absolute bottom-5 left-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line-mid)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-[var(--text-primary)] shadow-[var(--shadow-panel)] backdrop-blur-md transition hover:bg-[var(--surface-soft)] md:bottom-8 md:left-8"
          onClick={() => setDetailsVisible(true)}
          type="button"
        >
          <Eye size={18} strokeWidth={2.2} />
        </button>
      )}
     
    </section>
  );
}
