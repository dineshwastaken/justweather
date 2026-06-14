/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useApp } from '../../context/AppContext';
import { useWeatherStore } from '../../store/weatherStore';
import { getWeatherAtTime } from '../UI/TimeSlider';

/**
 * Unified Volumetric Lighting Engine.
 * Subscribes to diurnal timeline and meteorological states.
 * Dynamically switches between Solar (Day) and Lunar (Night) volumetric rays.
 * Controls ray color temperature, scattering angle, and obscuration values.
 */
export const AtmosphereManager: React.FC = () => {
  const { selectedTime, predictedTemperature } = useApp();
  const { weatherData } = useWeatherStore();

  const decimalHour = selectedTime / 60;
  const isDay = decimalHour >= 6 && decimalHour < 18;

  // Track interactive states
  const [isParting, setIsParting] = useState(false);
  const [isTunnelActive, setIsTunnelActive] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const [pulseProgress, setPulseProgress] = useState(0);

  // Compute live active weather condition, resolving IMD dataset
  const baseWeather = weatherData?.weatherType || 'clear';
  const activeWeather = getWeatherAtTime(baseWeather, decimalHour);

  // Shader material uniform refs
  const solarShaderRef = useRef<THREE.ShaderMaterial>(null);
  const lunarShaderRef = useRef<THREE.ShaderMaterial>(null);

  // Calculate coordinates of celestial sources matching CelestialBody
  const celestialCoordinates = useMemo(() => {
    if (isDay) {
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
  }, [decimalHour, isDay]);

  // Subscribe to raw Met-Sensory-Actions
  useEffect(() => {
    const handleGesture = (e: Event) => {
      const { weather, mode } = (e as CustomEvent).detail;

      if (mode === 'click') {
        setPulseActive(true);
        setPulseProgress(0);
      } else if (mode === 'longpress') {
        if (weather === 'cloudy' || weather === 'overcast' || weather === 'storm' || weather === 'rain') {
          setIsParting(true);
        }
        if (weather === 'overcast') {
          setIsTunnelActive(true);
        }
      } else if (mode === 'release') {
        setIsParting(false);
        setIsTunnelActive(false);
      }
    };

    window.addEventListener('met-sensory-action', handleGesture);
    return () => window.removeEventListener('met-sensory-action', handleGesture);
  }, []);

  // Frame animations & interpolation loop (delta-timed 60FPS)
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Pulse decay math
    if (pulseActive) {
      setPulseProgress((p) => {
        const next = p + 3.0 * delta;
        if (next >= 1.0) {
          setPulseActive(false);
          return 0;
        }
        return next;
      });
    }

    // Custom shader updates
    if (solarShaderRef.current) {
      solarShaderRef.current.uniforms.uTime.value = time;
      solarShaderRef.current.uniforms.uPulse.value = pulseActive ? Math.sin(pulseProgress * Math.PI) : 0;
    }
    if (lunarShaderRef.current) {
      lunarShaderRef.current.uniforms.uTime.value = time;
      lunarShaderRef.current.uniforms.uPulse.value = pulseActive ? Math.sin(pulseProgress * Math.PI) : 0;
    }
  });

  // Calculate solar colors matching altitude (Golden Hour warmth at Sunrise/Sunset vs Noon white)
  const solarRayTheme = useMemo(() => {
    const sunriseWeight = Math.max(0, 1 - Math.abs(decimalHour - 6) / 2);
    const sunsetWeight = Math.max(0, 1 - Math.abs(decimalHour - 18) / 2);
    const goldenFactor = Math.max(sunriseWeight, sunsetWeight);

    let color = new THREE.Color('#fffbeb'); // warm white baseline
    if (goldenFactor > 0) {
      // Golden sunrise or amber crimson sunset
      const sunsetGold = new THREE.Color('#ea580c');
      color.lerp(sunsetGold, goldenFactor);
    }
    return color;
  }, [decimalHour]);

  // Configure Lunar details (Contrast silver-blue with temperature adjustments)
  const lunarRayTheme = useMemo(() => {
    let color = new THREE.Color('#cbd5e1'); // silver moon baseline
    if (predictedTemperature < 21) {
      // Icy bright white tint
      color.lerp(new THREE.Color('#f0f9ff'), 0.7);
    } else {
      // Cool blue silver tint
      color.lerp(new THREE.Color('#38bdf8'), 0.4);
    }
    return color;
  }, [predictedTemperature]);

  // Handle weather obscuration factor (Cloudy block vs parting burst vs foggy glow)
  const finalObscuration = useMemo(() => {
    if (activeWeather === 'clear') {
      return 1.0;
    }
    if (activeWeather === 'snow') {
      return 0.75;
    }
    if (activeWeather === 'cloudy') {
      return isParting ? 1.0 : 0.08; // Cloudy blocks standard rays, parting forces dynamic burst
    }
    if (activeWeather === 'overcast') {
      // Foggy: standard rays heavily obscured (broad fog glow), bursts to 1.0 within cleared tunnel
      return isTunnelActive ? 1.0 : 0.04;
    }
    if (activeWeather === 'storm' || activeWeather === 'rain') {
      return isParting ? 0.8 : 0.02;
    }
    return 0.5;
  }, [activeWeather, isParting, isTunnelActive]);

  // Custom scattering wideness multiplier representing diffused glow vs sharp beams
  const scatterMultiplier = useMemo(() => {
    if (activeWeather === 'overcast') {
      return isTunnelActive ? 1.0 : 3.5; // broad, low-contrast glow in fog, tight sharp beams in tunnel
    }
    return 1.0;
  }, [activeWeather, isTunnelActive]);

  return (
    <group>
      {/* 1. SOLAR DAYTIME GOD RAYS SHAFTS */}
      {isDay && (
        <group position={[celestialCoordinates.x, celestialCoordinates.y - 1.5, celestialCoordinates.z]}>
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <coneGeometry args={[2.5 * scatterMultiplier, 20, 16, 1, true]} />
            <shaderMaterial
              ref={solarShaderRef}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              uniforms={{
                uTime: { value: 0 },
                uColor: { value: solarRayTheme },
                uPulse: { value: 0 },
                uHeatHaze: { value: predictedTemperature > 38 ? (predictedTemperature - 38) / 10 : 0.0 },
                uObscurity: { value: finalObscuration }
              }}
              vertexShader={`
                varying vec2 vUv;
                varying float vDistance;
                void main() {
                  vUv = uv;
                  vDistance = position.y;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                uniform float uTime;
                uniform vec3 uColor;
                uniform float uPulse;
                uniform float uHeatHaze;
                uniform float uObscurity;
                varying vec2 vUv;
                varying float vDistance;

                void main() {
                  // Shimmering pattern of shafts using sin frequencies
                  float noise = sin(vUv.x * 24.0 + uTime * 2.5) * cos(vUv.y * 8.0 - uTime * 1.5) * 0.5 + 0.5;
                  
                  // Gradually decay brightness vertically down the shaft
                  float verticalFade = max(0.0, 1.0 - (vDistance + 10.0) / 20.0);
                  
                  // Heat haze adds soft edge vibration
                  float heatScatter = sin(uTime * (8.0 + uHeatHaze * 5.0) + vUv.y * 32.0) * 0.04 * uHeatHaze;
                  
                  // Output dynamic alpha matching meteorological state
                  float alpha = 0.22 * verticalFade * (0.6 + 0.4 * noise) * uObscurity;
                  
                  // Pulse burst magnification on click gestures
                  alpha += uPulse * verticalFade * 0.35;
                  
                  vec3 finalColor = uColor + vec3(0.12, 0.04, 0.0) * uHeatHaze;
                  gl_FragColor = vec4(finalColor, alpha);
                }
              `}
            />
          </mesh>
        </group>
      )}

      {/* 2. LUNAR NIGHTTIME GOD RAYS SHAFTS */}
      {!isDay && (
        <group position={[celestialCoordinates.x, celestialCoordinates.y - 1.2, celestialCoordinates.z]}>
          <mesh rotation={[Math.PI / 5, 0, 0]}>
            {/* Lunar rays are sharper, more precise and narrow */}
            <coneGeometry args={[1.5 * scatterMultiplier, 18, 12, 1, true]} />
            <shaderMaterial
              ref={lunarShaderRef}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              uniforms={{
                uTime: { value: 0 },
                uColor: { value: lunarRayTheme },
                uPulse: { value: 0 },
                uIceScatter: { value: predictedTemperature < 21 ? (21 - predictedTemperature) / 15 : 0.0 },
                uObscurity: { value: finalObscuration }
              }}
              vertexShader={`
                varying vec2 vUv;
                varying float vDistance;
                void main() {
                  vUv = uv;
                  vDistance = position.y;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                uniform float uTime;
                uniform vec3 uColor;
                uniform float uPulse;
                uniform float uIceScatter;
                uniform float uObscurity;
                varying vec2 vUv;
                varying float vDistance;

                void main() {
                  // Shimmering pattern of silver shafts
                  float noise = sin(vUv.x * 32.0 + uTime * 1.5) * cos(vUv.y * 12.0 - uTime * 0.8) * 0.5 + 0.5;
                  
                  // Narrow sharp beam with rapid decay
                  float decay = max(0.0, 1.0 - (vDistance + 9.0) / 18.0);
                  
                  // Ice scatter freezes and concentrates the scattering beam
                  float focusBeam = 1.0 + (0.4 * uIceScatter);
                  float alpha = 0.15 * decay * (0.75 + 0.25 * noise) * uObscurity * focusBeam;
                  
                  // Intense sharp bloom pulse on gesture trigger
                  alpha += uPulse * decay * 0.42;

                  gl_FragColor = vec4(uColor, alpha);
                }
              `}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default AtmosphereManager;
