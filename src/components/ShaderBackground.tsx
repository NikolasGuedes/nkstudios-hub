import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';

const SHADER_COLORS = {
  shaderBlue: '#006FFF',
  shaderBlueSoft: '#0E70EB',
  shaderBlueStrong: '#005eeb',
} as const;

export default function ShaderBackground({
  reduceMotion,
  isVisible,
}: {
  reduceMotion: boolean | null;
  isVisible: boolean;
}) {
  return (
    <>
      <div className="absolute inset-0">
        <ShaderGradientCanvas
          className="h-full w-full"
          pixelDensity={1}
          pointerEvents="none"
          style={{ width: '100%', height: '100%' }}
        >
          <ShaderGradient
            animate={reduceMotion || !isVisible ? 'off' : 'on'}
            axesHelper="off"
            bgColor1="var(--page-bg)"
            bgColor2="var(--page-bg)"
            brightness={1.2}
            cAzimuthAngle={180}
            cDistance={3.6}
            cPolarAngle={90}
            cameraZoom={1}
            color1={SHADER_COLORS.shaderBlue}
            color2={SHADER_COLORS.shaderBlueStrong}
            color3={SHADER_COLORS.shaderBlueSoft}
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
    </>
  );
}
