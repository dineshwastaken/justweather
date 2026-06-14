/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useWeatherStore } from '../../store/weatherStore';
import { getWeatherAtTime } from '../UI/TimeSlider';
import { WeatherType } from '../../types';
import audioEngine from '../../utils/audioEngine';

/**
 * Omnipresent Sensory Manager.
 * Registers interactive gestures across the entire WebGL Canvas bounding frame.
 * Measures click duration and triggers matching synthesized waveforms alongside
 * reactive visual parameter sweeps.
 */
export const InteractionManager: React.FC = () => {
  const { interactionState, setInteractionState, selectedTime } = useApp();
  const { weatherData } = useWeatherStore();
  
  const baseWeather = weatherData?.weatherType || 'clear';
  const activeWeather = getWeatherAtTime(baseWeather, selectedTime / 60);
  
  const pressTimeoutRef = useRef<any>(null);
  const isHeldRef = useRef<boolean>(false);
  const clickStartRef = useRef<number>(0);

  useEffect(() => {
    const handleGestureStart = (clientX: number, clientY: number) => {
      clickStartRef.current = Date.now();
      isHeldRef.current = false;
      
      setInteractionState(prev => ({ ...prev, isPressing: true }));

      // Set timeout for trigger of "Long Press"
      pressTimeoutRef.current = setTimeout(() => {
        isHeldRef.current = true;
        // Trigger Long-press event on the current active weather
        triggerSensoryEvent(activeWeather, 'longpress');
      }, 550); // Threshold for long press
    };

    const handleGestureEnd = () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }
      
      setInteractionState(prev => ({ ...prev, isPressing: false }));
      
      const duration = Date.now() - clickStartRef.current;
      
      if (!isHeldRef.current && duration < 550) {
        // Trigger standard Click event
        triggerSensoryEvent(activeWeather, 'click');
      } else if (isHeldRef.current) {
        // Long press released
        triggerSensoryEvent(activeWeather, 'release');
      }
    };

    const triggerSensoryEvent = (weather: WeatherType, mode: 'click' | 'longpress' | 'release') => {
      // 1. Audio synthesise triggers based on current weather state
      if (mode === 'click') {
        switch (weather) {
          case 'storm':
          case 'rain':
            audioEngine.triggerLightningSnap();
            break;
          case 'clear':
            audioEngine.triggerLensFlareBurst();
            break;
          case 'overcast':
            audioEngine.triggerFogDisplace();
            break;
          case 'cloudy':
          default:
            audioEngine.triggerCloudVortex();
            break;
        }
      } else if (mode === 'longpress') {
        switch (weather) {
          case 'storm':
          case 'rain':
            audioEngine.triggerThunderRoll();
            break;
          case 'clear':
            audioEngine.triggerSolarWindSwell();
            break;
          case 'overcast':
            audioEngine.triggerSonicBlast();
            break;
          case 'cloudy':
          default:
            audioEngine.triggerCloudPartingGodRays();
            break;
        }
      }

      // 2. Dispatch custom events into the DOM to instruct our R3F shaders & particles
      const visualEvent = new CustomEvent('met-sensory-action', {
        detail: { weather, mode }
      });
      window.dispatchEvent(visualEvent);
    };

    // Global desktop event hookups
    const onMouseDown = (e: MouseEvent) => {
      // Exclude interactive menu interface elements so search clicks/saves don't trigger ambient sounds
      const target = e.target as HTMLElement;
      if (target.closest('input') || target.closest('button') || target.closest('a')) return;
      handleGestureStart(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      handleGestureEnd();
    };

    // Global mobile touch event hookups
    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input') || target.closest('button')) return;
      if (e.touches.length > 0) {
        handleGestureStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      handleGestureEnd();
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeWeather, setInteractionState]);

  return null;
};

export default InteractionManager;
