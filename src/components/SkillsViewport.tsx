import { Float, Grid, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';
import { Eye, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useRef, useState } from 'react';
import type { Mesh } from 'three';

const tabs = [
  { id: 'modelagem3d', label: 'MODELAGEM 3D' },
  { id: 'jogos', label: 'JOGOS' },
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

function Scene3D({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <Canvas
      className="absolute inset-0 h-full w-full"
      dpr={[1, 1.5]}
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
  const activeTab = 'modelagem3d';
  const reduceMotion = useReducedMotion();
  const [detailsVisible, setDetailsVisible] = useState(false);

  return (
    <section className="relative h-full overflow-hidden rounded-[2.25rem] border border-[color:var(--line-soft)] bg-[var(--skill-blue)] shadow-[var(--shadow-skill)]">
      <div className="absolute inset-0">
        <ShaderGradientCanvas
          className="h-full w-full"
          pixelDensity={1}
          pointerEvents="none"
          style={{ width: '100%', height: '100%' }}
        >
          <ShaderGradient
            animate={reduceMotion ? 'off' : 'on'}
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

      <Scene3D reduceMotion={reduceMotion} />

      <div className="pointer-events-none absolute left-5 top-5 z-30 rounded-2xl md:left-8 md:top-8">
        <p className="text-[0.72rem] font-semibold tracking-[0.42em] text-[var(--text-primary)]">
          MY SKILLS
        </p>
      </div>

      <div className="absolute right-5 top-5 z-30  p-4 md:right-8 md:top-8 md:p-5">
        <div className="flex flex-col gap-3">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <motion.button
                key={tab.id}
                whileHover={{ x: isActive ? 0 : 3 }}
                className={[
                  'min-w-[8.8rem] rounded-full border px-4 py-1.5 text-center text-[0.68rem] tracking-[0.14em] transition',
                  isActive
                    ? 'border-(--text-primary) bg-(--text-primary) text-(--page-bg) font-bold'
                    : 'border-(--text-primary) bg-transparent text-(--text-primary)',
                ].join(' ')}
                type="button"
              >
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {detailsVisible ? (
        <div className="absolute bottom-5 left-5 z-30 max-w-[19rem] rounded-[1.75rem] border border-[color:var(--line-mid)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-5 py-4 shadow-[var(--shadow-panel-lg)] backdrop-blur-md md:bottom-8 md:left-8 md:px-6 md:py-5">
          <div className="flex items-start justify-between gap-4">
            <p className="pt-2 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--text-primary)]">
              Cena 3D ativa
            </p>
            <button
              aria-label="Esconder detalhes"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--line-mid)] bg-[var(--surface-softer)] text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
              onClick={() => setDetailsVisible(false)}
              type="button"
            >
              <X size={15} strokeWidth={2.2} />
            </button>
          </div>

          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
            O placeholder central sera substituido pelo seu modelo final. O foco
            agora e estruturar viewport, grid, camera e fundo.
          </p>
        </div>
      ) : (
        <button
          aria-label="Mostrar detalhes"
          className="absolute bottom-5 left-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line-mid)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-[var(--text-primary)] shadow-[var(--shadow-panel)] backdrop-blur-md transition hover:bg-[var(--surface-soft)] md:bottom-8 md:left-8"
          onClick={() => setDetailsVisible(true)}
          type="button"
        >
          <Eye size={18} strokeWidth={2.2} />
        </button>
      )}

    

      <div className="pointer-events-none absolute inset-0 rounded-[2.25rem] ring-1 ring-inset ring-[color:var(--line-soft)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--line-bright)] to-transparent" />
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[var(--line-mid)] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[var(--line-mid)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--line-mid)] to-transparent" />
      </div>
    </section>
  );
}
