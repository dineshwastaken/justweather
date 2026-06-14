/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { WeatherType } from '../../types';
import { useApp } from '../../context/AppContext';
import { getWeatherAtTime } from '../UI/TimeSlider';
import audioEngine from '../../utils/audioEngine';
import { AtmosphereManager } from './AtmosphereManager';
import { RainSystem } from './RainSystem';

interface WeatherSceneProps {
  weatherType: WeatherType;
  windSpeed: number; // km/h
  windDirection: number; // degrees
}

// Global color interpolation utilities
function parseHex(hex: string) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return { r, g, b };
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.floor(val)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => String(x.toString(16)).padStart(2, '0')).join('');
}

function interpolateHex(hex1: string, hex2: string, weight: number): string {
  const c1 = parseHex(hex1);
  const c2 = parseHex(hex2);
  const r = c1.r + (c2.r - c1.r) * weight;
  const g = c1.g + (c2.g - c1.g) * weight;
  const b = c1.b + (c2.b - c1.b) * weight;
  return toHex(r, g, b);
}

interface DiurnalSettings {
  bg: string;
  ambient: string;
  directional: string;
  ambientIntensity: number;
}

const DIURNAL_TIMELINE: { hour: number; settings: DiurnalSettings }[] = [
  { hour: 0, settings: { bg: '#020308', ambient: '#0b0f19', directional: '#1e3a8a', ambientIntensity: 0.28 } },
  { hour: 5, settings: { bg: '#0d0d1a', ambient: '#220b33', directional: '#f472b6', ambientIntensity: 0.4 } },
  { hour: 7, settings: { bg: '#1c0f24', ambient: '#d97706', directional: '#fbbf24', ambientIntensity: 0.72 } },
  { hour: 10, settings: { bg: '#050a14', ambient: '#87ceeb', directional: '#fffbeb', ambientIntensity: 0.85 } },
  { hour: 12, settings: { bg: '#03050a', ambient: '#bae6fd', directional: '#ffffff', ambientIntensity: 0.95 } },
  { hour: 16, settings: { bg: '#030508', ambient: '#cbd5e1', directional: '#fef08a', ambientIntensity: 0.82 } },
  { hour: 18, settings: { bg: '#180424', ambient: '#be123c', directional: '#ea580c', ambientIntensity: 0.72 } },
  { hour: 20, settings: { bg: '#04050d', ambient: '#1e1b4b', directional: '#121436', ambientIntensity: 0.4 } },
  { hour: 24, settings: { bg: '#020308', ambient: '#0b0f19', directional: '#1e3a8a', ambientIntensity: 0.28 } }
];

export function getDiurnalSettings(hour: number): DiurnalSettings {
  const h = hour % 24;
  let prevIdx = 0;
  let nextIdx = 0;
  
  for (let i = 0; i < DIURNAL_TIMELINE.length; i++) {
    if (DIURNAL_TIMELINE[i].hour >= h) {
      nextIdx = i;
      prevIdx = i === 0 ? 0 : i - 1;
      break;
    }
  }
  
  const minHour = DIURNAL_TIMELINE[prevIdx].hour;
  const maxHour = DIURNAL_TIMELINE[nextIdx].hour;
  
  let weight = 0;
  if (maxHour !== minHour) {
    weight = (h - minHour) / (maxHour - minHour);
  }
  
  const p = DIURNAL_TIMELINE[prevIdx].settings;
  const n = DIURNAL_TIMELINE[nextIdx].settings;
  
  return {
    bg: interpolateHex(p.bg, n.bg, weight),
    ambient: interpolateHex(p.ambient, n.ambient, weight),
    directional: interpolateHex(p.directional, n.directional, weight),
    ambientIntensity: p.ambientIntensity + (n.ambientIntensity - p.ambientIntensity) * weight
  };
}

/**
 * 2. Snow Particles drifting gently in 3D Space
 */
const SnowParticles: React.FC<{ windSpeed: number; density: number }> = ({ windSpeed, density }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { interactionState } = useApp();
  const count = density;

  const rawData = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 40;
      const y = Math.random() * 30 - 15;
      const z = (Math.random() - 0.5) * 25;
      const speed = 1.0 + Math.random() * 1.5;
      const wobbleSpeed = 1.2 + Math.random() * 1.8;
      const wobbleWidth = 0.2 + Math.random() * 0.5;
      arr.push({ x, y, z, speed, wobbleSpeed, wobbleWidth, phase: Math.random() * 100 });
    }
    return arr;
  }, [count]);

  const tempObject = new THREE.Object3D();

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const windForceX = (windSpeed * 0.03);
    const userPullX = interactionState.mousePosition.x * 5.0; 

    rawData.forEach((p, idx) => {
      p.y -= p.speed * delta * 1.8;
      
      const wobble = Math.sin(time * p.wobbleSpeed + p.phase) * p.wobbleWidth;
      const windDrift = (windForceX + userPullX) * delta;
      
      p.x += (wobble + windDrift) * 0.15;

      if (p.y < -15) {
        p.y = 15;
        p.x = (Math.random() - 0.5) * 40;
      }
      if (p.x > 22) p.x = -22;
      if (p.x < -22) p.x = 22;

      tempObject.position.set(p.x, p.y, p.z);
      const scale = 0.12 + Math.sin(time + p.phase) * 0.05;
      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(idx, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, count]}>
      <sphereGeometry args={[1, 5, 5]} />
      <meshBasicMaterial 
        color="#ffffff" 
        transparent 
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};

/**
 * 3. Volumetric Floating Clouds with dynamic parting and shadow rendering
 */
const VolumetricClouds: React.FC<{ 
  windSpeed: number; 
  count: number; 
  dark?: boolean; 
  vortexSpin?: number;
  isPartingClouds?: boolean;
}> = ({ windSpeed, count, dark, vortexSpin = 1.0, isPartingClouds = false }) => {
  const groupRef = useRef<THREE.Group>(null);

  const clouds = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 55,
          6 + Math.random() * 6,
          (Math.random() - 0.5) * 15 - 12
        ),
        scale: new THREE.Vector3(
          4 + Math.random() * 6,
          2 + Math.random() * 3,
          3 + Math.random() * 5
        ),
        speed: 0.15 + Math.random() * 0.25,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        driftOffset: 0
      });
    }
    return list;
  }, [count]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const windFactor = windSpeed * 0.006;
    
    groupRef.current.children.forEach((child, i) => {
      const data = clouds[i];
      if (data && child) {
        data.driftOffset += data.speed * windFactor * delta * 60 * vortexSpin;
        let targetX = data.position.x + data.driftOffset;
        
        // Wrap-around bounds inside state frame
        if (targetX > 32) {
          data.driftOffset -= 64;
        } else if (targetX < -32) {
          data.driftOffset += 64;
        }

        // Push away from central corridor to let light shafts beam through
        if (isPartingClouds) {
          const pushX = targetX < 0 ? -11.0 : 11.0;
          targetX += pushX;
        }

        child.position.x = THREE.MathUtils.lerp(child.position.x, targetX, 0.08);
        child.rotation.y += data.rotationSpeed * delta * vortexSpin;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {clouds.map((cloud, idx) => (
        <mesh key={idx} position={cloud.position} scale={cloud.scale} castShadow receiveShadow>
          <dodecahedronGeometry args={[2, 1]} />
          <meshStandardMaterial
            color={dark ? '#22252e' : '#e2e8f0'}
            transparent
            opacity={dark ? 0.38 : 0.45}
            roughness={0.9}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
};

/**
 * 4. Micro particles / stellar dust
 */
const AtmosphericSparkle: React.FC<{ speed: number; color?: string }> = ({ speed, color = '#6366f1' }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 300;

  const [positions, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return [pos, ph];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position;
    
    for (let i = 0; i < count; i++) {
      let y = posAttr.getY(i);
      y += Math.sin(time + phases[i]) * 0.005 * speed;
      if (y > 15) y = -15;
      posAttr.setY(i, y);

      let x = posAttr.getX(i);
      x += Math.cos(time * 0.5 + phases[i]) * 0.003 * speed;
      posAttr.setX(i, x);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        color={color}
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

/**
 * 5. Dynamic Celestial Trajectory Assembly (Sun/Moon position interpolation)
 */
const CelestialBody: React.FC<{ type: WeatherType; hour: number; flareScaleMultiplier?: number }> = ({ type, hour, flareScaleMultiplier = 1.0 }) => {
  const orbRef = useRef<THREE.Group>(null);
  const flareRef = useRef<THREE.Mesh>(null);
  const { interactionState } = useApp();

  const isDay = hour >= 6 && hour < 18;
  const isSun = type === 'clear' ? isDay : false;

  // Compute calculated positions based on current selectedTime hour
  const celestialCoordinates = useMemo(() => {
    if (isDay) {
      const angle = ((hour - 6) / 12) * Math.PI; // 0 to PI
      const x = -Math.cos(angle) * 18;
      const y = Math.sin(angle) * 11 + 3; // base 3 altitude
      return new THREE.Vector3(x, y, -14);
    } else {
      const nightOffset = hour >= 18 ? hour - 18 : hour + 6;
      const angle = (nightOffset / 12) * Math.PI;
      const x = -Math.cos(angle) * 18;
      const y = Math.sin(angle) * 9 + 2;
      return new THREE.Vector3(x, y, -14);
    }
  }, [hour, isDay]);

  useFrame((state) => {
    if (!orbRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    
    // Smooth magnetic float offset
    orbRef.current.position.copy(celestialCoordinates);
    orbRef.current.position.y += Math.sin(elapsed * 0.1) * 0.25;
    
    if (!isDay && type === 'clear') {
      // Rotate the moon flare subtly
      if (flareRef.current) {
        flareRef.current.rotation.z = elapsed * 0.04;
      }
    } else if (isDay && type === 'clear' && flareRef.current) {
      flareRef.current.rotation.z = interactionState.mousePosition.x * Math.PI * 0.25 + elapsed * 0.02;
    }
  });

  const config = useMemo(() => {
    if (isDay) {
      return {
        color: '#f59e0b', // Amber hot sun disk
        lightColor: '#fffbeb',
        intensity: type === 'clear' ? 2.5 : 0.8,
        scale: type === 'clear' ? 1.6 : 1.2,
      };
    } else {
      return {
        color: '#e0f2fe', // Bright pearl moon disk
        lightColor: '#e0f2fe',
        intensity: type === 'clear' ? 1.4 : 0.4,
        scale: 1.1,
      };
    }
  }, [isDay, type]);

  if (type === 'storm' || type === 'rain') return null;

  return (
    <group ref={orbRef}>
      <mesh>
        <sphereGeometry args={[config.scale, 32, 32]} />
        <meshBasicMaterial color={config.color} toneMapped={false} />
        <pointLight color={config.lightColor} intensity={config.intensity} distance={45} />
      </mesh>

      {/* Lens Flare Diffraction ring on clear cycles */}
      {type === 'clear' && (
        <mesh ref={flareRef} scale={[flareScaleMultiplier, flareScaleMultiplier, 1]}>
          <ringGeometry args={[config.scale + 0.15, config.scale + 0.55, 6, 1]} />
          <meshBasicMaterial 
            color={isDay ? "#ec4899" : "#38bdf8"} 
            transparent 
            opacity={isDay ? 0.28 : 0.18} 
            blending={THREE.AdditiveBlending} 
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};

/**
 * 5.5. Heat Ripple Screen Shader Plane Component for Thermodynamic Heat (>38°C)
 */
const HeatRipplePlane: React.FC<{ intensity: number }> = ({ intensity }) => {
  const localRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (localRef.current) {
      localRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      localRef.current.uniforms.uIntensity.value = intensity;
    }
  });

  return (
    <mesh position={[0, 0, 9]} scale={[25, 25, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={localRef}
        transparent
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uIntensity: { value: intensity },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uIntensity;
          varying vec2 vUv;
          
          void main() {
            if (uIntensity <= 0.0) {
              discard;
            }
            vec2 uv = vUv;
            // Sinusoidal progressive heat ripples
            float wave = sin(uv.y * 22.0 + uTime * 6.0) * cos(uv.x * 12.0 + uTime * 4.5);
            float alpha = 0.15 * uIntensity * (0.3 + 0.7 * abs(wave));
            
            // Warm optical refraction tint
            vec3 color = vec3(0.96, 0.48, 0.12) * (0.04 + 0.16 * wave);
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  );
};

/**
 * 6. Environment Content containing lights, skies, and particle controllers
 */
const EnvironmentContent: React.FC<WeatherSceneProps> = ({ weatherType, windSpeed, windDirection }) => {
  const { camera } = useThree();
  const { interactionState, selectedTime, predictedTemperature } = useApp();
  const { mousePosition } = interactionState;

  const decimalHour = selectedTime / 60;
  const activeWeather = getWeatherAtTime(weatherType, decimalHour);

  // Performance Scaling dynamic state
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sensory active states
  const [lightningFlash, setLightningFlash] = useState(0);
  const [flareBurstScale, setFlareBurstScale] = useState(1.0);
  const [solarWaveScale, setSolarWaveScale] = useState(0);
  const [solarWaveOpacity, setSolarWaveOpacity] = useState(0);
  const [cloudVortexSpin, setCloudVortexSpin] = useState(1.0);
  const [fogDisplaceAmount, setFogDisplaceAmount] = useState(0);
  const [godRayScale, setGodRayScale] = useState(0);
  const [isLongPressingCloudy, setIsLongPressingCloudy] = useState(false);
  const [isFogCleared, setIsFogCleared] = useState(false);

  // Synchronise camera with soft wind gusts and cursor sway
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const windPush = windSpeed / 130;
    camera.position.x = Math.sin(elapsed * 0.12) * (0.5 + windPush) + mousePosition.x * 0.45;
    camera.position.y = Math.cos(elapsed * 0.08) * 0.3 + mousePosition.y * 0.35;
  });

  // Track event triggers from the InteractionManager
  useEffect(() => {
    const handleSensoryAction = (e: Event) => {
      const { weather, mode } = (e as CustomEvent).detail;
      
      if (mode === 'release') {
        setIsLongPressingCloudy(false);
        setIsFogCleared(false);
        return;
      }

      if (weather === 'storm' || weather === 'rain') {
        if (mode === 'click') {
          setLightningFlash(4.8);
        } else if (mode === 'longpress') {
          // Multi-strike lightning flicker cascade
          setLightningFlash(7.8);
        }
      } else if (weather === 'clear') {
        if (mode === 'click') {
          setFlareBurstScale(3.2);
        } else if (mode === 'longpress') {
          setSolarWaveScale(1.0);
          setSolarWaveOpacity(1.0);
        }
      } else if (weather === 'overcast') {
        if (mode === 'click') {
          setFogDisplaceAmount(14.0);
        } else if (mode === 'longpress') {
          setIsFogCleared(true);
        }
      } else { // cloudy
        if (mode === 'click') {
          setCloudVortexSpin(4.8);
        } else if (mode === 'longpress') {
          setGodRayScale(1.0);
          setIsLongPressingCloudy(true);
        }
      }
    };

    window.addEventListener('met-sensory-action', handleSensoryAction);
    return () => window.removeEventListener('met-sensory-action', handleSensoryAction);
  }, []);

  // Frame physics decay loop
  useFrame((state) => {
    const delta = state.clock.getDelta();

    // Lightning Flash visual decay math
    if (lightningFlash > 0) {
      setLightningFlash((prev) => {
        const decay = prev > 5.5 ? 9.5 : 15.0;
        return Math.max(0, prev - decay * delta);
      });
    }

    // Sunny Flare Burst spring decay
    if (flareBurstScale > 1.0) {
      setFlareBurstScale(prev => Math.max(1.0, prev - 4.5 * delta));
    }

    // Solar Wave ring expansion physics
    if (solarWaveScale > 0) {
      setSolarWaveScale(prev => {
        const next = prev + 12.0 * delta;
        if (next > 22) {
          setSolarWaveOpacity(0);
          return 0;
        }
        return next;
      });
      setSolarWaveOpacity(prev => Math.max(0, prev - 0.65 * delta));
    }

    // Cloud Vortex spin speed dampening
    if (cloudVortexSpin > 1.0) {
      setCloudVortexSpin(prev => Math.max(1.0, prev - 2.8 * delta));
    }

    // God Ray shaft decay/fade calculations
    if (godRayScale > 0 && !isLongPressingCloudy) {
      setGodRayScale(prev => Math.max(0, prev - 0.55 * delta));
    }

    // Fog displacement spring decay
    if (fogDisplaceAmount > 0) {
      setFogDisplaceAmount(prev => Math.max(0, prev - 11.0 * delta));
    }
  });

  // Calculate dynamic cloud base and active weather conditions
  const rawMood = useMemo(() => getDiurnalSettings(decimalHour), [decimalHour]);

  const moodTheme = useMemo(() => {
    let factor = 1.0;
    let colorTint = '#ffffff';

    if (activeWeather === 'storm') {
      factor = 0.25;
      colorTint = '#4f46e5'; // storm purple
    } else if (activeWeather === 'rain') {
      factor = 0.38;
      colorTint = '#0ea5e9'; // rainy deep sky blue
    } else if (activeWeather === 'overcast') {
      factor = 0.45;
      colorTint = '#64748b'; // foggy slate grey
    } else if (activeWeather === 'cloudy') {
      factor = 0.72;
      colorTint = '#06b6d4'; // cloud sky blue
    } else if (activeWeather === 'snow') {
      factor = 0.82;
      colorTint = '#e0f2fe';
    }

    let baseTheme = {
      bg: interpolateHex(rawMood.bg, '#030308', 1 - factor),
      ambientColor: interpolateHex(rawMood.ambient, colorTint, 0.35),
      ambientIntensity: rawMood.ambientIntensity * factor,
      directionalColor: interpolateHex(rawMood.directional, colorTint, 0.3),
      directionalIntensity: rawMood.ambientIntensity * 1.4 * factor,
      fogColor: interpolateHex(rawMood.bg, '#020202', 0.2 + (1 - factor) * 0.4)
    };

    // Thermodynamic Interpolation based on predictedTemperature
    if (predictedTemperature > 38) {
      // Hot: shift ambient & background to saturated warm/amber tones
      const maxHeat = Math.min(1.0, (predictedTemperature - 38) / 10); // scaling up to 48C
      baseTheme.ambientColor = interpolateHex(baseTheme.ambientColor, '#f59e0b', maxHeat * 0.7);
      baseTheme.directionalColor = interpolateHex(baseTheme.directionalColor, '#ef4444', maxHeat * 0.8);
      baseTheme.bg = interpolateHex(baseTheme.bg, '#1e0c03', maxHeat * 0.5);
      baseTheme.fogColor = interpolateHex(baseTheme.fogColor, '#180702', maxHeat * 0.5);
      baseTheme.ambientIntensity *= (1.0 + maxHeat * 0.3);
    } else if (predictedTemperature < 21) {
      // Cold: desaturate and shift to crisp blue-white tones
      const maxCold = Math.min(1.0, (21 - predictedTemperature) / 15); // scaling down to 6C
      baseTheme.ambientColor = interpolateHex(baseTheme.ambientColor, '#bfeafb', maxCold * 0.6);
      baseTheme.directionalColor = interpolateHex(baseTheme.directionalColor, '#ffffff', maxCold * 0.7);
      baseTheme.bg = interpolateHex(baseTheme.bg, '#040d1a', maxCold * 0.45);
      baseTheme.fogColor = interpolateHex(baseTheme.fogColor, '#020a16', maxCold * 0.5);
    }

    return baseTheme;
  }, [rawMood, activeWeather, predictedTemperature]);

  // Lightning micro flickering factor on strike duration
  const activeFlashStrength = useMemo(() => {
    if (lightningFlash === 0) return 0;
    if (lightningFlash > 5.5) {
      return Math.sin(Date.now() * 0.06) > 0.15 ? lightningFlash : lightningFlash * 0.3;
    }
    return lightningFlash;
  }, [lightningFlash]);

  // Compute live Fog bounds (supporting displacement clicks vs deep clear long presses)
  const fogRange = useMemo(() => {
    let start = 15;
    let end = 45;

    if (activeWeather === 'overcast') {
      start = 12;
      end = 28;
      
      if (isFogCleared) {
        // Long-pressing compresses fog back completely to form a clean atmospheric decompress tunnel
        return { start: 50, end: 120 };
      }
      
      // Add quick click particle sweep
      end += fogDisplaceAmount;
    }

    return { start, end };
  }, [activeWeather, fogDisplaceAmount, isFogCleared]);

  // Dynamic celestial position for the shadow casting light
  const celestialCoordinates = useMemo(() => {
    const isDayTime = decimalHour >= 6 && decimalHour < 18;
    if (isDayTime) {
      const angle = ((decimalHour - 6) / 12) * Math.PI;
      const x = -Math.cos(angle) * 18;
      const y = Math.sin(angle) * 11 + 3;
      return new THREE.Vector3(x, y, -14);
    } else {
      const nightOffset = decimalHour >= 18 ? decimalHour - 18 : decimalHour + 6;
      const angle = (nightOffset / 12) * Math.PI;
      const x = -Math.cos(angle) * 18;
      const y = Math.sin(angle) * 9 + 2;
      return new THREE.Vector3(x, y, -14);
    }
  }, [decimalHour]);

  return (
    <>
      <color attach="background" args={[moodTheme.bg]} />
      <fog attach="fog" args={[moodTheme.fogColor, fogRange.start, fogRange.end]} />

      <ambientLight color={moodTheme.ambientColor} intensity={moodTheme.ambientIntensity + activeFlashStrength * 0.35} />
      <directionalLight 
        position={[celestialCoordinates.x, celestialCoordinates.y, celestialCoordinates.z]} 
        intensity={moodTheme.directionalIntensity + activeFlashStrength * 0.65} 
        color={activeFlashStrength > 0 ? '#f0f9ff' : moodTheme.directionalColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {activeFlashStrength > 0 && (
        <pointLight position={[Math.random() * 10 - 5, 12, -7]} color="#f0f9ff" intensity={activeFlashStrength * 6.0} distance={55} />
      )}

      {/* Orbiting Celestial Body */}
      <CelestialBody type={activeWeather} hour={decimalHour} flareScaleMultiplier={flareBurstScale} />

      {/* Volumetric Lights */}
      <AtmosphereManager />

      {/* Screen space heat wave distortion ripples for high temperatures >38°C */}
      {predictedTemperature > 38 && (
        <HeatRipplePlane intensity={Math.min(1.0, (predictedTemperature - 38) / 10)} />
      )}

      {/* Expanding Ring shockwave effect on Clear Sunny solar flares */}
      {solarWaveScale > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 4, -14]}>
          <ringGeometry args={[solarWaveScale, solarWaveScale + 0.6, 42]} />
          <meshBasicMaterial 
            color="#fbbf24" 
            transparent 
            opacity={solarWaveOpacity * 0.45} 
            depthWrite={false} 
            blending={THREE.AdditiveBlending} 
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* God Ray shaft remains as interactive background layer */}
      {godRayScale > 0 && (
        <group position={[0, 9, -15]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <mesh key={i} position={[(i - 1.5) * 6.5, -2, (Math.sin(i) * 2)]} rotation={[0, 0, (i - 1.5) * 0.06]}>
              <coneGeometry args={[1.8, 18, 16, 1, true]} />
              <meshBasicMaterial 
                color="#fef08a" 
                transparent 
                opacity={godRayScale * 0.16 * (Math.sin(Date.now() * 0.0035 + i) * 0.28 + 0.72)} 
                side={THREE.DoubleSide} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false} 
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Weather particles based on calculated active weather */}
      {activeWeather === 'clear' && (
        <>
          <Stars radius={110} depth={50} count={isMobile ? 1200 : 3500} factor={8} saturation={0.8} fade speed={2.5} />
          {/* Sunny solar dust */}
          <AtmosphericSparkle speed={1} color="#f59e0b" />
        </>
      )}

      {activeWeather === 'cloudy' && (
        <>
          <Stars radius={100} depth={40} count={isMobile ? 400 : 1250} factor={4} saturation={0.5} fade speed={0.5} />
          <VolumetricClouds windSpeed={windSpeed} count={isMobile ? 6 : 12} vortexSpin={cloudVortexSpin} isPartingClouds={isLongPressingCloudy} />
          <AtmosphericSparkle speed={0.5} color="#22d3ee" />
        </>
      )}

      {activeWeather === 'overcast' && (
        <>
          <VolumetricClouds windSpeed={windSpeed} count={isMobile ? 11 : 22} dark vortexSpin={cloudVortexSpin} isPartingClouds={isFogCleared || isLongPressingCloudy} />
          <AtmosphericSparkle speed={0.3} color="#94a3b8" />
        </>
      )}

      {activeWeather === 'rain' && (
        <>
          <VolumetricClouds windSpeed={windSpeed} count={isMobile ? 8 : 16} dark isPartingClouds={isLongPressingCloudy} />
          <RainSystem windSpeed={windSpeed} density={isMobile ? 400 : 800} intensity={1} />
        </>
      )}

      {activeWeather === 'storm' && (
        <>
          <VolumetricClouds windSpeed={windSpeed} count={isMobile ? 14 : 28} dark isPartingClouds={isLongPressingCloudy} />
          <RainSystem windSpeed={windSpeed} density={isMobile ? 700 : 1200} intensity={2.4} />
          <AtmosphericSparkle speed={2} color="#bae6fd" />
        </>
      )}

      {activeWeather === 'snow' && (
        <>
          <VolumetricClouds windSpeed={windSpeed} count={isMobile ? 5 : 10} isPartingClouds={isLongPressingCloudy} />
          <SnowParticles windSpeed={windSpeed} density={isMobile ? 250 : 600} />
        </>
      )}
    </>
  );
};

export const WeatherScene: React.FC<WeatherSceneProps> = ({ weatherType, windSpeed, windDirection }) => {
  const { selectedTime } = useApp();
  const decimalHour = selectedTime / 60;
  
  // Dynamic audio looping triggers
  useEffect(() => {
    const activeType = getWeatherAtTime(weatherType, decimalHour);
    audioEngine.setWeatherState(activeType);
  }, [weatherType, decimalHour]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto select-none z-0">
      <Canvas
        shadows
        camera={{ position: [0, 0, 10], fov: 60 } as any}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <EnvironmentContent weatherType={weatherType} windSpeed={windSpeed} windDirection={windDirection} />
      </Canvas>
    </div>
  );
};

export default WeatherScene;
