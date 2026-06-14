/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wind, 
  Droplets, 
  Compass, 
  Eye, 
  Gauge, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  Cloudy, 
  CloudFog,
  Navigation
} from 'lucide-react';
import { WeatherData, WeatherType } from '../../types';
import GlassCard from './GlassCard';
import TimeSlider, { getWeatherAtTime } from './TimeSlider';
import { useApp } from '../../context/AppContext';

interface CurrentWeatherProps {
  data: WeatherData;
}

/**
 * Animated Temperature Counter Component to fulfill spring-animated transitions beautifully in React 19
 */
const AnimatedTemp: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1000; // 1s spring animation
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing out quadratic function
      const easeProgress = progress * (2 - progress);
      const current = startValue + (endValue - startValue) * easeProgress;
      
      setDisplayValue(parseFloat(current.toFixed(1)));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return (
    <span className="tabular-nums font-semibold tracking-tighter">
      {displayValue}
    </span>
  );
};

export const CurrentWeather: React.FC<CurrentWeatherProps> = ({ data }) => {
  const { predictedTemperature, selectedTime } = useApp();
  const decimalHour = selectedTime / 60;
  const activeWeatherType = getWeatherAtTime(data.weatherType, decimalHour);

  const getDisplayDescription = (type: WeatherType) => {
    if (type === data.weatherType) return data.description;
    switch (type) {
      case 'clear': return 'Clear Sky';
      case 'cloudy': return 'Partly Cloudy';
      case 'overcast': return 'Overcast Sky';
      case 'rain': return 'Rain Showers';
      case 'storm': return 'Thunderstorm';
      case 'snow': return 'Snowfall';
      default: return 'Climatic Variance';
    }
  };

  const activeDescription = getDisplayDescription(activeWeatherType);

  // Resolve standard icon matching each IMD weather type
  const getWeatherIcon = (type: WeatherType) => {
    switch (type) {
      case 'clear':
        return <Sun className="w-20 h-20 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse" />;
      case 'rain':
        return <CloudRain className="w-20 h-20 text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]" />;
      case 'snow':
        return <CloudSnow className="w-20 h-20 text-blue-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />;
      case 'storm':
        return <CloudLightning className="w-20 h-20 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />;
      case 'overcast':
        return <CloudFog className="w-20 h-20 text-slate-400 drop-shadow-[0_0_15px_rgba(148,163,184,0.5)]" />;
      case 'cloudy':
      default:
        return <Cloudy className="w-20 h-20 text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />;
    }
  };

  return (
    <GlassCard className="p-8 w-full md:max-w-2xl mx-auto" gradient>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Place info & observed time */}
        <div className="text-center md:text-left">
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-indigo-300 text-xs font-mono uppercase tracking-widest"
          >
            Live IMD Station Data
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl font-sans mt-1 text-white leading-tight font-extrabold"
          >
            {data.city}
          </motion.h2>
          <p className="text-white/60 text-sm mt-0.5">{data.state}, India</p>

          <div className="flex items-center gap-2 mt-4 justify-center md:justify-start">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <p className="text-xs text-white/40 font-mono">Observed: {data.observedAt}</p>
          </div>
        </div>

        {/* Big Temperature Display & Icon */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-7xl md:text-8xl flex font-sans font-light text-white tracking-tighter">
              <AnimatedTemp value={predictedTemperature} />
              <span className="text-indigo-300 text-4xl font-normal ml-1">°C</span>
            </div>
            <p className="text-white/80 text-sm font-medium mt-1 leading-none capitalize">{activeDescription}</p>
          </div>
          <motion.div 
            key={activeWeatherType}
            initial={{ scale: 0.7, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="flex-shrink-0"
          >
            {getWeatherIcon(activeWeatherType)}
          </motion.div>
        </div>

      </div>

      {/* Meteorological Parameter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
        
        {/* Stat: Wind */}
        <div className="bg-white/[0.03] rounded-2xl p-3 border border-white/5 hover:bg-white/5 transition-all group">
          <div className="flex items-center gap-1.5 text-white/45 text-xs font-mono">
            <Wind className="w-3.5 h-3.5" />
            <span>WIND SPEED</span>
          </div>
          <p className="text-white font-semibold text-lg mt-1 tabular-nums">{data.windSpeed} <span className="text-xs font-normal text-white/60">km/h</span></p>
          
          {/* Compass Angle Indicator */}
          <div className="flex items-center gap-1.5 mt-1 text-indigo-300 text-[10px] font-mono">
            <Navigation 
              className="w-2.5 h-2.5 transition-transform duration-700" 
              style={{ transform: `rotate(${data.windDirection}deg)` }} 
            />
            <span>{data.windDirection}° Direct</span>
          </div>
        </div>

        {/* Stat: Humidity */}
        <div className="bg-white/[0.03] rounded-2xl p-3 border border-white/5 hover:bg-white/5 transition-all">
          <div className="flex items-center gap-1.5 text-white/45 text-xs font-mono">
            <Droplets className="w-3.5 h-3.5" />
            <span>HUMIDITY</span>
          </div>
          <p className="text-white font-semibold text-lg mt-1 tabular-nums">{data.humidity}%</p>
          <div className="w-full bg-white/10 rounded-full h-1 mt-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${data.humidity}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-indigo-400 h-full rounded-full"
            />
          </div>
        </div>

        {/* Stat: Pressure */}
        <div className="bg-white/[0.03] rounded-2xl p-3 border border-white/5 hover:bg-white/5 transition-all">
          <div className="flex items-center gap-1.5 text-white/45 text-xs font-mono">
            <Gauge className="w-3.5 h-3.5" />
            <span>BAROMETER</span>
          </div>
          <p className="text-white font-semibold text-lg mt-1 tabular-nums">{data.pressure} <span className="text-xs font-normal text-white/60">hPa</span></p>
          <p className="text-[10px] text-white/40 mt-1 font-mono uppercase">Atmospheric</p>
        </div>

        {/* Stat: Visibility */}
        <div className="bg-white/[0.03] rounded-2xl p-3 border border-white/5 hover:bg-white/5 transition-all">
          <div className="flex items-center gap-1.5 text-white/45 text-xs font-mono">
            <Eye className="w-3.5 h-3.5" />
            <span>VISIBILITY</span>
          </div>
          <p className="text-white font-semibold text-lg mt-1 tabular-nums">{data.visibility} <span className="text-xs font-normal text-white/60">km</span></p>
          <p className="text-[10px] text-emerald-400/80 font-mono mt-1">
            {data.visibility > 5 ? 'Excellent range' : 'Misty horizon'}
          </p>
        </div>

      </div>

      {/* Interactive Diurnal Time Scrubbing Slider */}
      <TimeSlider />
    </GlassCard>
  );
};

export default CurrentWeather;
