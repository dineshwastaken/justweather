/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Sun, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudFog, 
  Droplets, 
  Wind 
} from 'lucide-react';
import { ForecastDay, WeatherType } from '../../types';
import GlassCard from './GlassCard';

interface ForecastTimelineProps {
  forecastList: ForecastDay[];
}

export const ForecastTimeline: React.FC<ForecastTimelineProps> = ({ forecastList }) => {
  // Mini icon resolver for grid columns
  const getMiniIcon = (type: WeatherType) => {
    switch (type) {
      case 'clear':
        return <Sun className="w-8 h-8 text-yellow-400" />;
      case 'rain':
        return <CloudRain className="w-8 h-8 text-sky-400" />;
      case 'snow':
        return <CloudSnow className="w-8 h-8 text-blue-200" />;
      case 'storm':
        return <CloudLightning className="w-8 h-8 text-indigo-400" />;
      case 'overcast':
        return <CloudFog className="w-8 h-8 text-slate-400" />;
      case 'cloudy':
      default:
        return <CloudFog className="w-8 h-8 text-cyan-300" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-white font-sans text-sm font-semibold uppercase tracking-wider font-mono opacity-80 flex items-center gap-2">
          <span>7-Day Meteorological Timeline</span>
        </h3>
        <p className="text-white/40 text-xs font-mono">Swipe or Scroll →</p>
      </div>

      {/* Horizontally scrollable glass wrap */}
      <div className="overflow-x-auto w-full custom-scrollbar pb-3 snap-x scroll-smooth">
        <div className="flex gap-4 min-w-max px-1">
          {forecastList.map((day, idx) => (
            <motion.div
              key={day.dayName + idx}
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, type: 'spring', stiffness: 90 }}
              className="snap-start"
            >
              <GlassCard className="w-36 p-4 flex flex-col items-center text-center justify-between h-56 hover:bg-white/15 hover:scale-[1.03] duration-300">
                
                {/* Day Header */}
                <div>
                  <h4 className="text-white font-bold text-sm leading-none">{day.dayName}</h4>
                  <p className="text-indigo-300/80 text-[10px] uppercase tracking-wider font-mono mt-1 leading-none">{day.dateStr}</p>
                </div>

                {/* Weather Condition Icon */}
                <div className="my-3 flex items-center justify-center">
                  {getMiniIcon(day.weatherType)}
                </div>

                {/* Temperature Range Gauge */}
                <div className="w-full">
                  <div className="flex justify-between items-baseline px-1">
                    <span className="text-white/40 text-xs font-mono">{day.tempMin}°</span>
                    <span className="text-white text-sm font-semibold font-mono">{day.tempMax}°</span>
                  </div>
                  
                  {/* Subtle graphical temperature range line */}
                  <div className="w-full bg-white/10 rounded-full h-1 mt-1.5 overflow-hidden relative">
                    <div 
                      className="absolute bg-gradient-to-r from-cyan-400 to-amber-400 h-full rounded-full"
                      style={{ left: '25%', right: '15%' }}
                    />
                  </div>
                </div>

                {/* Day Weather Sub-Stats */}
                <div className="flex items-center justify-center gap-2.5 mt-2 pt-2 border-t border-white/5 w-full text-[9px] text-white/50 font-mono">
                  <span className="flex items-center gap-0.5" title="Humidity">
                    <Droplets className="w-2.5 h-2.5 text-cyan-400" />
                    {day.humidity}%
                  </span>
                  <span className="flex items-center gap-0.5" title="Wind">
                    <Wind className="w-2.5 h-2.5 text-emerald-400" />
                    {day.windSpeed}k
                  </span>
                </div>

              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ForecastTimeline;
