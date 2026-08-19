import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SYNC_CONFIG } from './animationConfig';
import { PharmacyRack } from './PharmacyRack';
import { PharmacyBin } from './PharmacyBin';

/**
 * Background Ambient Particles
 */
function AmbientParticles({ count = 35 }) {
  const pointsRef = useRef();

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 4;

      col[i * 3] = 0.1 + Math.random() * 0.2;
      col[i * 3 + 1] = 0.5 + Math.random() * 0.4;
      col[i * 3 + 2] = 0.8 + Math.random() * 0.2;
    }
    return [pos, col];
  }, [count]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Data Sync Beam Trail connecting Source Rack to Target Rack
 */
function DataSyncBeam({ isDone = false }) {
  const points = useMemo(() => {
    const pList = [];
    const pStart = new THREE.Vector3(-4, 0, 0.5);
    const pEnd = new THREE.Vector3(4, 0, 0.5);

    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const x = THREE.MathUtils.lerp(pStart.x, pEnd.x, t);
      const y = Math.sin(t * Math.PI) * 1.5;
      const z = Math.sin(t * Math.PI) * 0.8 + 0.5;
      pList.push(new THREE.Vector3(x, y, z));
    }
    return pList;
  }, []);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial
        color={isDone ? SYNC_CONFIG.COLORS.successGlow : SYNC_CONFIG.COLORS.pathTrail}
        transparent
        opacity={0.4}
      />
    </line>
  );
}

/**
 * Direct WebGL Ref PharmacyScene Component
 */
export function PharmacyScene({
  sourceRackRef,
  targetRackRef,
  sourceBinRefs,
  moverBinRefs,
  targetBinRefs,
  scannerY,
  hudState,
  ...props
}) {
  const binIndices = useMemo(() => Array.from({ length: SYNC_CONFIG.TOTAL_BINS }, (_, i) => i), []);

  return (
    <>
      {/* Studio Lighting */}
      <ambientLight color="#1e293b" intensity={1.4} />

      <directionalLight
        position={[-6, 10, 8]}
        intensity={2.2}
        color="#f8fafc"
      />

      <directionalLight
        position={[8, 4, -6]}
        intensity={1.8}
        color="#38bdf8"
      />

      <pointLight
        position={[0, -2, 6]}
        intensity={1.5}
        color="#0d9488"
        distance={18}
      />

      {/* Background Atmosphere */}
      <AmbientParticles count={35} />

      {/* Synchronized Bezier Trail Beam */}
      <DataSyncBeam isDone={hudState.isDone} />

      {/* 1. Source Rack */}
      <PharmacyRack
        ref={sourceRackRef}
        position={SYNC_CONFIG.SOURCE_RACK_POS}
        title="SOURCE INVENTORY"
        subtitle="PHARMACY DATABASE A"
        scannerY={scannerY}
      />

      {/* 2. Target Rack */}
      <PharmacyRack
        ref={targetRackRef}
        position={SYNC_CONFIG.TARGET_RACK_POS}
        title="TARGET INVENTORY"
        subtitle="PHARMACY DATABASE B"
        isTarget
      />

      {/* 3. Source Bins (Direct WebGL Ref Array) */}
      {binIndices.map((idx) => (
        <PharmacyBin
          key={`src-bin-${idx}`}
          ref={(el) => { if (sourceBinRefs.current) sourceBinRefs.current[idx] = el; }}
          index={idx}
          colorIdx={idx}
          position={[-14, 0, 0]}
        />
      ))}

      {/* 4. Active Transfer Moving Bins (Direct WebGL Ref Array) */}
      {binIndices.map((idx) => (
        <PharmacyBin
          key={`mover-bin-${idx}`}
          ref={(el) => { if (moverBinRefs.current) moverBinRefs.current[idx] = el; }}
          index={idx}
          colorIdx={idx}
          position={[-14, 0, 0]}
          isMoving
        />
      ))}

      {/* 5. Target Bins (Direct WebGL Ref Array) */}
      {binIndices.map((idx) => (
        <PharmacyBin
          key={`tgt-bin-${idx}`}
          ref={(el) => { if (targetBinRefs.current) targetBinRefs.current[idx] = el; }}
          index={idx}
          colorIdx={idx}
          position={[14, 0, 0]}
          isSynced
        />
      ))}
    </>
  );
}
