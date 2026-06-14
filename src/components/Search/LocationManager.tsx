import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { INDIAN_CITIES } from '../../api/weather';
import { weatherService } from '../../api/weatherService';
import { WeatherData, CityConfig } from '../../types';
import { Search, Plus, Trash2, MapPin, Loader2, Bookmark, Check, Compass, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../UI/GlassCard';

export const LocationManager: React.FC = () => {
  const { 
    currentLocation, 
    setCurrentLocation, 
    savedLocations, 
    addSavedLocation, 
    removeSavedLocation 
  } = useApp();

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedWeatherData, setSavedWeatherData] = useState<{ [key: string]: WeatherData }>({});
  const [isFetchingSaved, setIsFetchingSaved] = useState(false);

  // Filter stations based on search query
  const suggestions = INDIAN_CITIES.filter(
    (city) => 
      city.name.toLowerCase().includes(query.toLowerCase()) || 
      city.state.toLowerCase().includes(query.toLowerCase())
  );

  // Dynamically load meteorological stats for each bookmarked location
  useEffect(() => {
    let active = true;
    const fetchSavedWeather = async () => {
      if (savedLocations.length === 0) return;
      setIsFetchingSaved(true);
      try {
        const results = await weatherService.fetchMultipleRegions(savedLocations);
        if (active) {
          const mapping: { [key: string]: WeatherData } = {};
          results.forEach((data) => {
            const loc = savedLocations.find(l => l.name === data.city);
            if (loc) {
              mapping[loc.id] = data;
            }
          });
          setSavedWeatherData(mapping);
        }
      } catch (err) {
        console.error('Failed to pre-resolve bookmarks board', err);
      } finally {
        if (active) setIsFetchingSaved(false);
      }
    };

    fetchSavedWeather();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchSavedWeather, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [savedLocations]);

  const handleSelectCity = (city: CityConfig) => {
    setCurrentLocation(city);
    setQuery('');
    setShowSuggestions(false);
  };

  const isCurrentBookmarked = savedLocations.some(l => l.id === currentLocation.id);

  const toggleBookmark = () => {
    if (isCurrentBookmarked) {
      removeSavedLocation(currentLocation.id);
    } else {
      addSavedLocation(currentLocation);
    }
  };

  const miniWeatherIcon = (type: string) => {
    switch (type) {
      case 'clear':
        return <Sun className="w-5 h-5 text-yellow-400" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-sky-400" />;
      case 'snow':
        return <CloudSnow className="w-5 h-5 text-indigo-200" />;
      case 'storm':
        return <CloudLightning className="w-5 h-5 text-violet-400" />;
      case 'overcast':
        return <CloudFog className="w-5 h-5 text-slate-400" />;
      default:
        return <CloudFog className="w-5 h-5 text-cyan-300" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 px-2 z-30 relative pointer-events-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        
        {/* Search input and control column */}
        <div className="md:col-span-5 flex flex-col justify-center h-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
              <Search className="w-4 h-4" />
            </div>
            
            <input
              type="text"
              placeholder="Search Indian Weather Stations..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-10 pr-24 py-3 rounded-2xl bg-black/40 border border-white/10 text-sm placeholder-white/35 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/50 backdrop-blur-md transition-all duration-300 shadow-inner"
            />

            {/* Bookmark pill next to focus */}
            <button
              onClick={toggleBookmark}
              className={`absolute inset-y-1.5 right-1.5 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-mono transition-all duration-300 cursor-pointer ${
                isCurrentBookmarked 
                  ? 'bg-gradient-to-r from-teal-500/25 to-emerald-500/25 border-emerald-400/40 text-emerald-300' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isCurrentBookmarked ? 'fill-emerald-400 text-emerald-400' : ''}`} />
              <span>{isCurrentBookmarked ? 'Saved' : 'Save'}</span>
            </button>

            {/* Suggestions drop-down list */}
            <AnimatePresence>
              {showSuggestions && (query.length > 0 || suggestions.length > 0) && (
                <>
                  {/* Backdrop blur click-shield to block input leak */}
                  <div 
                    className="fixed inset-0 z-40 pointer-events-auto" 
                    onClick={() => setShowSuggestions(false)}
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-[#090d16]/95 border border-white/15 shadow-[0_15px_30px_rgba(0,0,0,0.65)] overflow-hidden z-50 backdrop-blur-xl max-h-60 overflow-y-auto no-scrollbar"
                  >
                    <div className="p-2 border-b border-white/5 text-[10px] font-mono text-white/40 tracking-wider">
                      SUGGESTIONS ({suggestions.length})
                    </div>
                    {suggestions.length === 0 ? (
                      <div className="p-4 text-xs text-white/40 text-center font-mono">
                        No IMD station matches found.
                      </div>
                    ) : (
                      suggestions.map((city) => {
                        const isCurrent = city.id === currentLocation.id;
                        return (
                          <button
                            key={city.id}
                            onClick={() => handleSelectCity(city)}
                            className={`w-full text-left px-4 py-3 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isCurrent 
                                ? 'bg-indigo-500/10 text-indigo-300' 
                                : 'hover:bg-white/5 text-white/80 hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-2 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-white/40" />
                              {city.name}, <span className="opacity-60 font-normal">{city.state}</span>
                            </span>
                            <span className="text-[10px] font-mono text-white/30 uppercase">
                              GPS {city.lat.toFixed(1)}°N
                            </span>
                          </button>
                        );
                      })
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* My Regions Panel column */}
        <div className="md:col-span-7 flex flex-col justify-center h-full">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-indigo-300 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <Compass className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
              My Saved Regions ({savedLocations.length})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 border border-white/10 bg-black/20 rounded-2xl backdrop-blur-md p-3 min-h-[64px] items-center">
            {savedLocations.length === 0 ? (
              <div className="col-span-2 text-center text-xs text-white/35 font-mono italic my-auto">
                No saved regions. Click 'Save' to bookmark.
              </div>
            ) : (
              savedLocations.map((loc) => {
                const weather = savedWeatherData[loc.id];
                const isActive = loc.id === currentLocation.id;
                
                return (
                  <motion.div
                    key={loc.id}
                    layoutId={`region-${loc.id}`}
                    className={`relative flex items-center justify-between gap-3 rounded-xl px-3 py-2 w-full h-[48px] border cursor-pointer select-none transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-500/15 to-violet-500/15 border-indigo-400/50 shadow-md ring-1 ring-indigo-400/20' 
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08]'
                    }`}
                    onClick={() => setCurrentLocation(loc)}
                  >
                    {/* Visual details */}
                    <div className="text-left select-none overflow-hidden flex-grow mr-1">
                      <p className={`text-xs font-semibold leading-tight truncate ${isActive ? 'text-indigo-200' : 'text-white'}`}>
                        {loc.name}
                      </p>
                      {weather ? (
                        <p className="text-[9px] font-mono text-white/40 mt-0.5 leading-none truncate">
                          {weather.temperature.toFixed(1)}°C · {weather.weatherType.toUpperCase()}
                        </p>
                      ) : (
                        <p className="text-[9px] font-mono text-white/20 mt-0.5 animate-pulse">
                          fetching...
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {weather && miniWeatherIcon(weather.weatherType)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSavedLocation(loc.id);
                        }}
                        className="text-white/30 hover:text-red-400 p-1 rounded-md hover:bg-white/5 transition-all duration-200 cursor-pointer"
                        title="Remove Bookmark"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LocationManager;
