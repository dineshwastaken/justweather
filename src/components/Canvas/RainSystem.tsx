/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useApp } from '../../context/AppContext';

interface RainSystemProps {
  windSpeed: number;
  density: number; // dynamically driven particle count
  intensity: number; // speed/visual multiplier
}

/**
 * High-Performance Procedural Physical Rain Particle System.
 * Implements InstancedMesh for locked 60+ FPS on all devices.
 * Uses MeshPhysicalMaterial for real-time light refraction, transmission, and highlights.
 * Dynamically deflects raindrops from the pointer/finger in 3D target coordinates.
 */
export const RainSystem: React.FC<RainSystemProps> = ({ windSpeed, density, intensity }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { interactionState } = useApp();
  const count = Math.min(density, 1200); // capped for performance safety

  // Local instance attributes
  const rawData = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 45;
      const y = Math.random() * 30 - 15;
      const z = (Math.random() - 0.5) * 20;
      const speed = 12 + Math.random() * 10;
      arr.push({ x, y, z, speed });
    }
    return arr;
  }, [count]);

  const tempObject = new THREE.Object3D();

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Wind and mouse sway factors
    const baseWindEffect = Math.sin(state.clock.getElapsedTime() * 0.2) * (windSpeed * 0.04);
    const userSway = interactionState.mousePosition.x * 12.0;
    const finalWindX = baseWindEffect + userSway;
    const fallSpeed = 0.5 * intensity;

    // 3D Pointer mapping approximation
    // Normalized coordinator x/y mapped to 3D space Z=0
    const cursorX = interactionState.mousePosition.x * 15.0;
    const cursorY = interactionState.mousePosition.y * 10.0;

    rawData.forEach((p, idx) => {
      // Delta-timed descending update
      p.y -= p.speed * fallSpeed * delta;
      p.x += finalWindX * delta;

      // Wrap-around boundaries
      if (p.y < -15) {
        p.y = 15 + Math.random() * 2;
        p.x = (Math.random() - 0.5) * 45;
      }
      if (p.x > 25) p.x = -25;
      if (p.x < -25) p.x = 25;

      // Pointer Raycasting repelling force
      const dx = p.x - cursorX;
      const dy = p.y - cursorY;
      const distSq = dx * dx + dy * dy;
      const repelRadius = 3.0; // repelling range in Three units

      let finalX = p.x;
      let finalY = p.y;

      if (distSq < repelRadius * repelRadius) {
        const dist = Math.sqrt(distSq) || 0.001;
        const force = (repelRadius - dist) / repelRadius; // 1 at center, 0 at outer limit
        const angle = Math.atan2(dy, dx);
        
        // Push the droplet outwards along the vector from the cursor
        finalX += Math.cos(angle) * force * 1.8;
        finalY += Math.sin(angle) * force * 1.2;
      }

      tempObject.position.set(finalX, finalY, p.z);
      // Scaling creates thin needle appearance
      tempObject.scale.set(0.06, 0.7 + Math.random() * 0.4, 0.06);
      tempObject.rotation.z = finalWindX * -0.015;
      tempObject.updateMatrix();
      
      meshRef.current!.setMatrixAt(idx, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, count]} castShadow>
      <cylinderGeometry args={[0.06, 0.06, 1.2, 4]} />
      <meshPhysicalMaterial
        color="#ffffff"
        roughness={0.05}
        metalness={0.1}
        transmission={0.8} // highly refractive glass/water property
        thickness={0.8}    // refraction thickness
        ior={1.333}        // index of refraction for water
        clearcoat={1.0}
        clearcoatRoughness={0.05}
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </instancedMesh>
  );
};

export default RainSystem;
