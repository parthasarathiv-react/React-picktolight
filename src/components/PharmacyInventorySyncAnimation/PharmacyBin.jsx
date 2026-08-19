import React, { useMemo, forwardRef } from 'react';
import * as THREE from 'three';
import { SYNC_CONFIG } from './animationConfig';

// -----------------------------------------------------------------
// ⚡ PERFORMANCE OPTIMIZATION: Shared Geometries & Textures Singleton
// -----------------------------------------------------------------
const binBodyGeo = new THREE.BoxGeometry(0.84, 0.62, 0.94);
const binLipGeo = new THREE.BoxGeometry(0.88, 0.05, 0.98);
const binHandleGeo = new THREE.BoxGeometry(0.55, 0.16, 0.02);
const binLabelGeo = new THREE.PlaneGeometry(0.70, 0.28);
const binBarcodeGeo = new THREE.PlaneGeometry(0.56, 0.10);
const binAccentGeo = new THREE.BoxGeometry(0.72, 0.04, 0.01);
const binLedGeo = new THREE.SphereGeometry(0.035, 8, 8);
const binHaloGeo = new THREE.BoxGeometry(0.92, 0.70, 1.02);

// Single pre-rendered barcode texture for zero GC overhead
const sharedBarcodeTexture = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 32);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(4, 4, 120, 24);
  ctx.fillStyle = '#ffffff';
  let x = 8;
  while (x < 116) {
    const w = (x % 3) + 1;
    ctx.fillRect(x, 6, w, 20);
    x += w + (x % 2) + 2;
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
})();

/**
 * Ultra-Fast 60 FPS Direct WebGL Ref PharmacyBin 3D Component
 */
export const PharmacyBin = forwardRef(function PharmacyBin({
  index = 0,
  colorIdx = 0,
  isScanning = false,
  isSynced = false,
  isMoving = false,
  opacity = 1,
  ...props
}, ref) {
  const bodyColor = useMemo(() => {
    return SYNC_CONFIG.COLORS.binBodies[colorIdx % SYNC_CONFIG.COLORS.binBodies.length];
  }, [colorIdx]);

  const lidColor = useMemo(() => {
    return SYNC_CONFIG.COLORS.binLids[colorIdx % SYNC_CONFIG.COLORS.binLids.length];
  }, [colorIdx]);

  const accentColor = useMemo(() => {
    return SYNC_CONFIG.COLORS.binAccents[colorIdx % SYNC_CONFIG.COLORS.binAccents.length];
  }, [colorIdx]);

  const statusColor = isSynced
    ? SYNC_CONFIG.COLORS.successGlow
    : isScanning
    ? SYNC_CONFIG.COLORS.scannerBeam
    : '#f59e0b';

  return (
    <group ref={ref} {...props}>
      {/* Outer Bin Body */}
      <mesh geometry={binBodyGeo} position={[0, 0, 0]}>
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.35}
          metalness={0.05}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Top Rim */}
      <mesh geometry={binLipGeo} position={[0, 0.30, 0]}>
        <meshStandardMaterial color={lidColor} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Front Recessed Handle */}
      <mesh geometry={binHandleGeo} position={[0, 0.02, 0.475]}>
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>

      {/* Front Label Plate */}
      <mesh geometry={binLabelGeo} position={[0, -0.12, 0.473]}>
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>

      {/* Barcode Graphic */}
      <mesh geometry={binBarcodeGeo} position={[0, -0.06, 0.476]}>
        <meshBasicMaterial map={sharedBarcodeTexture} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Accent Color Band */}
      <mesh geometry={binAccentGeo} position={[0, -0.25, 0.474]}>
        <meshStandardMaterial color={accentColor} roughness={0.2} />
      </mesh>

      {/* Status LED */}
      <mesh geometry={binLedGeo} position={[0.31, 0.22, 0.48]}>
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Scanning / Selection Halo */}
      {(isScanning || isMoving) && (
        <mesh geometry={binHaloGeo} position={[0, 0, 0]}>
          <meshBasicMaterial
            color={SYNC_CONFIG.COLORS.scannerBeam}
            wireframe
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
});
