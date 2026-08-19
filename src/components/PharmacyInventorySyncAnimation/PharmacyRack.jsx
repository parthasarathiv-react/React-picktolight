import React, { useMemo } from 'react';
import * as THREE from 'three';
import { SYNC_CONFIG } from './animationConfig';

// -----------------------------------------------------------------
// ⚡ PERFORMANCE OPTIMIZATION: Shared Geometries Singleton
// -----------------------------------------------------------------
const rackPostGeo = new THREE.BoxGeometry(0.12, SYNC_CONFIG.RACK_HEIGHT, 0.12);
const rackTopBottomGeo = new THREE.BoxGeometry(SYNC_CONFIG.RACK_WIDTH, 0.15, SYNC_CONFIG.RACK_DEPTH);
const rackShelfGeo = new THREE.BoxGeometry(SYNC_CONFIG.RACK_WIDTH - 0.05, 0.04, SYNC_CONFIG.RACK_DEPTH - 0.05);
const rackDividerGeo = new THREE.BoxGeometry(0.02, 0.55, SYNC_CONFIG.RACK_DEPTH - 0.1);
const rackBaseGeo = new THREE.BoxGeometry(SYNC_CONFIG.RACK_WIDTH + 0.3, 0.12, SYNC_CONFIG.RACK_DEPTH + 0.3);

/**
 * Ultra-Fast 60 FPS PharmacyRack 3D Component
 */
export function PharmacyRack({
  isSource = true,
  rackRef,
  ...props
}) {
  const yShelves = useMemo(() => [1.0, 0.0, -1.0], []);
  const dividerX = useMemo(() => [-0.9, 0.0, 0.9], []);

  const storeRef = (key, el) => {
    if (rackRef && rackRef.current) {
      if (key === 'left') rackRef.current.leftSupport = el;
      if (key === 'right') rackRef.current.rightSupport = el;
      if (key === 'top') rackRef.current.topFrame = el;
      if (key === 'bottom') rackRef.current.bottomFrame = el;
      if (key.startsWith('shelf_')) {
        const idx = parseInt(key.split('_')[1], 10);
        if (!rackRef.current.shelves) rackRef.current.shelves = [];
        rackRef.current.shelves[idx] = el;
      }
      if (key === 'container') rackRef.current.container = el;
    }
  };

  return (
    <group ref={(el) => storeRef('container', el)} {...props}>
      {/* Left Vertical Post */}
      <mesh
        ref={(el) => storeRef('left', el)}
        geometry={rackPostGeo}
        position={[-SYNC_CONFIG.RACK_WIDTH / 2 + 0.12, 0, 0]}
      >
        <meshStandardMaterial color={SYNC_CONFIG.COLORS.rackFrame} roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Right Vertical Post */}
      <mesh
        ref={(el) => storeRef('right', el)}
        geometry={rackPostGeo}
        position={[SYNC_CONFIG.RACK_WIDTH / 2 - 0.12, 0, 0]}
      >
        <meshStandardMaterial color={SYNC_CONFIG.COLORS.rackFrame} roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Top Frame */}
      <mesh
        ref={(el) => storeRef('top', el)}
        geometry={rackTopBottomGeo}
        position={[0, SYNC_CONFIG.RACK_HEIGHT / 2 - 0.15, 0]}
      >
        <meshStandardMaterial color={SYNC_CONFIG.COLORS.rackFrame} roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Bottom Frame */}
      <mesh
        ref={(el) => storeRef('bottom', el)}
        geometry={rackTopBottomGeo}
        position={[0, -SYNC_CONFIG.RACK_HEIGHT / 2 + 0.15, 0]}
      >
        <meshStandardMaterial color={SYNC_CONFIG.COLORS.rackFrame} roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Shelves & Slot Dividers */}
      {yShelves.map((yPos, idx) => (
        <group key={`shelf_grp_${idx}`}>
          {/* Acrylic Glass Shelf */}
          <mesh
            ref={(el) => storeRef(`shelf_${idx}`, el)}
            geometry={rackShelfGeo}
            position={[0, yPos, 0]}
          >
            <meshStandardMaterial
              color={SYNC_CONFIG.COLORS.rackShelves}
              transparent
              opacity={0.7}
              roughness={0.1}
              metalness={0.2}
            />
          </mesh>

          {/* Slot Dividers */}
          {dividerX.map((divX, dIdx) => (
            <mesh
              key={`div_${idx}_${dIdx}`}
              geometry={rackDividerGeo}
              position={[divX, yPos + 0.3, 0]}
            >
              <meshStandardMaterial
                color="#334155"
                transparent
                opacity={0.6}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Base Footing */}
      <mesh geometry={rackBaseGeo} position={[0, -SYNC_CONFIG.RACK_HEIGHT / 2 - 0.05, 0]}>
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>
    </group>
  );
}
