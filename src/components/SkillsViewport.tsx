import { Float, Grid, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';
import { motion, useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import type { Mesh } from 'three';

const tabs = [
  { id: 'modelagem3d', label: 'MODELAGEM3D' },
  { id: 'jogos', label: 'JOGOS' },
  { id: 'design', label: 'DESIGN' },
] as const;

function PlaceholderModel({ reduceMotion }: { reduceMotion: boolean | null }) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    meshRef.current.rotation.y += delta * 0.42;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
    meshRef.current.position.y = 0.28 + Math.sin(state.clock.elapsedTime * 0.9) * 0.08;
  });

  return (
    <Float
      floatIntensity={reduceMotion ? 0.2 : 0.9}
      rotationIntensity={reduceMotion ? 0.15 : 0.45}
      speed={reduceMotion ? 0.4 : 1.2}
    >
      <mesh ref={meshRef} castShadow position={[0, 0.25, 0]}>
        <torusKnotGeometry args={[0.58, 0.2, 220, 32, 2, 3]} />
        <meshPhysicalMaterial
          clearcoat={1}
          clearcoatRoughness={0.12}
          color="#f7f8ff"
          emissive="#8cc8ff"
          emissiveIntensity={0.32}
          metalness={0.22}
          roughness={0.1}
        />
      </mesh>
    </Float>
  );
}

function CameraRig({ reduceMotion }: { reduceMotion: boolean | null }) {
  const { camera } = useThree();

  useFrame((state) => {
    camera.position.x = 0;
    camera.position.z = 8.4;
    camera.position.y = reduceMotion ? 2.45 : 2.45 + Math.sin(state.clock.elapsedTime * 0.18) * 0.04;
    camera.lookAt(0, 0.15, -1.8);
  });

  return null;
}

function Scene3D({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <Canvas
      className="absolute inset-0 h-full w-full"
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      shadows={false}
    >
      <PerspectiveCamera fov={38} makeDefault position={[0, 2.45, 8.4]} />
      <CameraRig reduceMotion={reduceMotion} />
      <ambientLight intensity={1.25} />
      <directionalLight color="#ffffff" intensity={1.55} position={[2, 4, 3]} />
      <pointLight color="#58b7ff" intensity={11} position={[-3, 1.5, 2.5]} />
      <pointLight color="#0f6fff" intensity={8} position={[3, 0.8, 1.5]} />

      <group position={[0, -1.95, -10.5]}>
        <Grid
          args={[80, 44]}
          cellColor="#d7e8ff"
          cellSize={0.9}
          cellThickness={0.4}
          fadeDistance={78}
          fadeStrength={1.8}
          followCamera={false}
          infiniteGrid
          sectionColor="#ffffff"
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

  return (
    <section className="relative h-full overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#1568ff] shadow-[0_32px_120px_rgba(0,57,173,0.45)]">
      <div className="absolute inset-0">
        <ShaderGradientCanvas
          className="h-full w-full"
          pixelDensity={1}
          pointerEvents="none"
          style={{ width: '100%', height: '100%' }}
        >
          <ShaderGradient
            animate={reduceMotion ? 'off' : 'on'}
            brightness={1}
            cAzimuthAngle={180}
            cDistance={2.8}
            cPolarAngle={90}
            cameraZoom={1}
            color1="#4a99ff"
            color2="#156cff"
            color3="#1e62d8"
            control="props"
            envPreset="city"
            grain="off"
            lightType="env"
            positionX={0}
            positionY={0}
            positionZ={0}
            reflection={0.02}
            rotationX={0}
            rotationY={0}
            rotationZ={0}
            shader="defaults"
            type="plane"
            uAmplitude={0.8}
            uDensity={0.8}
            uFrequency={3.6}
            uSpeed={0.12}
            uStrength={1.2}
            uTime={0}
            wireframe={false}
            zoomOut={false}
          />
        </ShaderGradientCanvas>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[40.8%] h-px bg-white/72 shadow-[0_0_16px_rgba(255,255,255,0.34)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.012)_22%,rgba(18,90,255,0.035)_58%,rgba(8,56,201,0.1)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.16),transparent_16%),linear-gradient(90deg,rgba(33,120,255,0.16)_0%,transparent_28%,transparent_72%,rgba(130,195,255,0.18)_100%)]" />

      <Scene3D reduceMotion={reduceMotion} />

      <div className="absolute left-6 top-6 z-30 flex flex-col gap-4 md:left-8 md:top-8">
        <p className="text-[0.72rem] font-semibold tracking-[0.42em] text-white">
          MY SKILLS
        </p>

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
                    ? 'border-white bg-white text-[#0b0f17]'
                    : 'border-white/70 bg-transparent text-white',
                ].join(' ')}
                type="button"
              >
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="relative z-20 flex h-full flex-col p-6 md:p-8">
        <div className="mt-auto flex items-end justify-between gap-6">
          <div className="max-w-sm">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/75">
              Cena 3D ativa
            </p>
            <p className="mt-2 text-sm leading-6 text-white/78">
              O placeholder central sera substituido pelo seu modelo final. O foco
              agora e estruturar viewport, grid, camera e fundo.
            </p>
          </div>

          <div className="text-right text-[0.68rem] uppercase tracking-[0.22em] text-white/72">
            <p>Scene 01</p>
            <p className="mt-2">Modelagem 3D</p>
          </div>
        </div>
      </div>
    </section>
  );
}
