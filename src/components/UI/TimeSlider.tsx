/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useWeatherStore } from '../../store/weatherStore';
import { WeatherType } from '../../types';
import { 
  Sun, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  Cloudy, 
  CloudFog,
  Moon,
  Clock
} from 'lucide-react';

/**
 * Deterministic climatic progression algorithm based on base city weather.
 * Allows sliding to dynamically transition meteorological particles across the entire layout.
 */
export function getWeatherAtTime(baseWeather: WeatherType, hour: number): WeatherType {
  const h = Math.floor(hour) % 24;
  if (baseWeather === 'storm') {
    if (h < 6) return 'overcast';
    if (h < 13) return 'rain';
    if (h < 20) return 'storm';
    return 'rain';
  }
  if (baseWeather === 'rain') {
    if (h < 5) return 'cloudy';
    if (h < 11) return 'overcast';
    if (h < 18) return 'rain';
    return 'overcast';
  }
  if (baseWeather === 'clear') {
    if (h >= 19 || h <= 5) return 'clear'; // starry night
    if (h >= 6 && h <= 10) return 'cloudy';  // morning clouds/mist
    if (h >= 11 && h <= 16) return 'clear';  // pristine sun
    return 'cloudy'; // sunset haze
  }
  if (baseWeather === 'cloudy') {
    if (h < 6) return 'overcast';
    if (h < 13) return 'cloudy';
    if (h < 17) return 'clear';
    return 'cloudy';
  }
  if (baseWeather === 'overcast') {
    if (h < 8) return 'overcast';
    if (h < 14) return 'cloudy';
    if (h < 19) return 'overcast';
    return 'rain';
  }
  if (baseWeather === 'snow') {
    if (h < 6) return 'overcast';
    if (h < 17) return 'snow';
    return 'overcast';
  }
  return baseWeather;
}

export const TimeSlider: React.FC = () => {
  const { selectedTime, setSelectedTime } = useApp();
  const { weatherData } = useWeatherStore();
  
  const baseWeather = weatherData?.weatherType || 'clear';

  // Format time (minutes) to HH:MM format
  const formattedTime = useMemo(() => {
    const hours = Math.floor(selectedTime / 60);
    const mins = Math.floor(selectedTime % 60);
    const padHours = String(hours).padStart(2, '0');
    const padMins = String(mins).padStart(2, '0');
    return `${padHours}:${padMins}`;
  }, [selectedTime]);

  const decimalHour = selectedTime / 60;

  // Pre-calculate 6 interval snapshots for visual feedback
  const intervals = [0, 4, 8, 12, 16, 20];

  const miniIcon = (type: WeatherType) => {
    switch (type) {
      case 'clear':
        return <Sun className="w-3.5 h-3.5 text-yellow-400" />;
      case 'rain':
        return <CloudRain className="w-3.5 h-3.5 text-sky-400" />;
      case 'snow':
        return <CloudSnow className="w-3.5 h-3.5 text-indigo-200" />;
      case 'storm':
        return <CloudLightning className="w-3.5 h-3.5 text-violet-400" />;
      case 'overcast':
        return <CloudFog className="w-3.5 h-3.5 text-slate-400" />;
      case 'cloudy':
      default:
        return <Cloudy className="w-3.5 h-3.5 text-cyan-300" />;
    }
  };

  return (
    <div className="w-full mt-6 bg-white/[0.03] border border-white/5 rounded-2xl p-4 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <span className="text-indigo-300 font-mono text-[10px] tracking-widest uppercase flex items-center gap-1.5 leading-none">
          <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          DIURNAL TIMELINE SLIDER (24h)
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/40 uppercase">ACTIVE TIME:</span>
          <span className="px-2.5 py-1 text-xs font-bold font-mono tracking-wider rounded-lg bg-black/40 border border-white/10 text-emerald-400 shadow-inner">
            {formattedTime}
          </span>
          <span className="text-[10px] font-mono text-white/55 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 uppercase">
            {getWeatherAtTime(baseWeather, decimalHour).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Range Slider input track */}
      <div className="relative w-full px-2 py-4">
        <input
          type="range"
          min="0"
          max="1439"
          value={selectedTime}
          onChange={(e) => setSelectedTime(parseInt(e.target.value))}
          className="w-full h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer focus:outline-none focus:ring-0 active:scale-[0.99] transition-all duration-150 range-accent-indigo"
          style={{
            background: `linear-gradient(to right, rgba(99, 102, 241, 0.45) 0%, rgba(99, 102, 241, 0.45) ${(selectedTime / 1439) * 100}%, rgba(255,255,255,0.08) ${(selectedTime / 1439) * 100}%, rgba(255,255,255,0.08) 100%)`
          }}
        />
      </div>

      {/* 6 snapshot milestones for chronological guidance */}
      <div className="grid grid-cols-6 gap-1 w-full text-center mt-1">
        {intervals.map((hour) => {
          const wType = getWeatherAtTime(baseWeather, hour);
          const isNearest = Math.abs(decimalHour - hour) < 2;
          return (
            <div 
              key={hour} 
              onClick={() => setSelectedTime(hour * 60)}
              className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-colors cursor-pointer ${
                isNearest ? 'bg-indigo-500/10 text-indigo-200' : 'hover:bg-white/[0.02] text-white/40'
              }`}
            >
              <span className="text-[9px] font-bold font-mono">
                {String(hour).padStart(2, '0')}:00
              </span>
              <div className="flex items-center justify-center p-1 rounded-md bg-white/5 border border-white/5 shadow-inner">
                {miniIcon(wType)}
              </div>
              <span className="text-[8px] font-mono scale-90 tracking-tighter uppercase opacity-80">
                {wType === 'overcast' ? 'fog' : wType === 'storm' ? 'storm' : wType}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlider;
