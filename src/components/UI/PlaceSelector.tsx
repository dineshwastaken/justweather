/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';
import { useWeatherStore } from '../../store/weatherStore';

export const PlaceSelector: React.FC = () => {
  const { selectedCityId, selectCity, cities } = useWeatherStore();

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 px-1 z-20 relative">
      <div className="flex items-center gap-2 mb-2 text-indigo-300 font-mono text-xs uppercase tracking-widest justify-center md:justify-start">
        <MapPin className="w-3.5 h-3.5 animate-bounce" />
        <span>SELECT OBSERVATION REGION</span>
      </div>
      
      {/* Horizontal pill list of Indian cities */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 py-1 px-1 justify-start md:justify-center border border-white/10 bg-black/30 rounded-full h-12 backdrop-blur-md">
        {cities.map((city) => {
          const isActive = city.id === selectedCityId;
          return (
            <button
              key={city.id}
              onClick={() => selectCity(city.id)}
              id={`btn-city-${city.id}`}
              className="relative px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-300 flex-shrink-0 text-white leading-none focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              <span className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-black font-semibold' : 'text-white/70 hover:text-white'}`}>
                {city.name}
              </span>
              
              {/* Dynamic sliding spring background for the active Pill */}
              {isActive && (
                <motion.div
                  layoutId="activePlacePill"
                  className="absolute inset-0 bg-gradient-to-r from-teal-400 to-indigo-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PlaceSelector;
