/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudSun, 
  RefreshCw, 
  Activity, 
  Compass, 
  CloudFog
} from 'lucide-react';
import { useWeatherStore } from './store/weatherStore';
import LocationManager from './components/Search/LocationManager';
import InteractionManager from './components/Canvas/InteractionManager';
import CurrentWeather from './components/UI/CurrentWeather';
import ForecastTimeline from './components/UI/ForecastTimeline';
import NowcastAlert from './components/UI/NowcastAlert';
import { AppProvider, useApp } from './context/AppContext';
import FeedbackWidget from './components/UI/FeedbackWidget';
import GlassSkeleton from './components/UI/GlassSkeleton';

const WeatherScene = lazy(() => import('./components/Canvas/WeatherScene'));

function WeatherAppContent() {
  const { currentLocation } = useApp();
  const { 
    weatherData, 
    isLoading, 
    error, 
    selectCity, 
    refreshWeather 
  } = useWeatherStore();

  // Keep the weatherStore in sync with the current active search location
  useEffect(() => {
    selectCity(currentLocation.id);
  }, [currentLocation, selectCity]);

  return (
    <div className="relative w-full h-full text-white bg-slate-950 overflow-hidden font-sans select-none">
      
      {/* Tap & Hold Event Broker */}
      <InteractionManager />
      
      {/* 1. Interactive 3D WebGL Canvas Layer */}
      {weatherData && (
        <Suspense fallback={null}>
          <WeatherScene 
            weatherType={weatherData.weatherType}
            windSpeed={weatherData.windSpeed}
            windDirection={weatherData.windDirection}
          />
        </Suspense>
      )}

      {/* 2. Complex Atmospheric Interactive Blur Overlay (blends R3F smoothly into card grids) */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/20 to-slate-950/60 pointer-events-none z-[1]" />

      {/* 3. Liquid Glass UI Layout Layer */}
      {/* Root layout has pointer-events-none to let scroll/hover pass into the 3D Canvas */}
      <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-4 md:p-6 overflow-y-auto custom-scrollbar pointer-events-none z-10">
        
        {/* App Header Bar */}
        <header className="w-full max-w-4xl mx-auto flex items-center justify-between pointer-events-auto py-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-500/15 border border-indigo-400/20 shadow-inner flex items-center justify-center">
              <CloudFog className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-white font-extrabold tracking-tight text-xl font-sans uppercase flex items-center gap-1.5 leading-none">
                JUST WEATHER <span className="text-xs text-indigo-400 font-normal lowercase font-mono px-2 py-0.5 rounded-md border border-indigo-400/10 bg-indigo-950/20">v2.0</span>
              </h1>
              <p className="text-[10px] text-white/40 tracking-wider font-mono uppercase mt-0.5">Tactile Canvas Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => refreshWeather()}
              disabled={isLoading}
              className="p-2 or-btn rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-white/80 hover:text-white hover:bg-white/10 active:scale-95 duration-200 transition-all cursor-pointer disabled:opacity-40"
              title="Refresh Meteorological Station"
              id="btn-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Dynamic Warning Alert banner, Search Region, and Weather Stats card grids */}
        <main className="w-full flex-grow flex flex-col justify-center items-center py-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              // 4. Fluid Loading Stage (Liquid Glass Skeleton loaders matching exact UI specs)
              <motion.div 
                key="loader"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col justify-start items-center pointer-events-auto z-50 text-center"
              >
                <GlassSkeleton />
              </motion.div>
            ) : error ? (
              // 5. Fatal Error Stage (Bypassed normally by climatic fallbacks)
              <motion.div 
                key="error"
                className="flex flex-col items-center justify-center text-center py-10 pointer-events-auto max-w-md mx-auto z-50"
              >
                <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 mb-4 shadow-[0_0_25px_rgba(239,68,68,0.35)]">
                  <Activity className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-white font-sans text-xl font-bold">Inversion Error</h3>
                <p className="text-white/60 text-sm mt-2 font-mono">{error}</p>
                <button
                  onClick={() => selectCity(currentLocation.id)}
                  className="mt-5 px-5 py-2 rounded-full bg-indigo-500 text-black font-semibold text-xs hover:bg-indigo-400 active:scale-95 cursor-pointer duration-200"
                >
                  Retry Radar Fetch
                </button>
              </motion.div>
            ) : weatherData ? (
              // 6. Active Weather Interface (All widgets have pointer-events-auto)
              <motion.div 
                key="panels"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full flex flex-col justify-center items-center pointer-events-auto py-2 z-10"
              >
                {/* 6.1 Interactive Location Search & saved regions bookmarks panel */}
                <LocationManager />

                {/* 6.2 Glowing Nowcast Alert Banner if present */}
                <NowcastAlert alert={weatherData.alert} />

                {/* 6.3 Current weather glass pane */}
                <CurrentWeather data={weatherData} />

                {/* 6.4 Forecast horizontal scroller timeline */}
                <ForecastTimeline forecastList={weatherData.forecast} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>

        {/* Global Meteorological Footer */}
        <footer className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[10px] text-white/30 font-mono tracking-wider pointer-events-auto border-t border-white/5 pt-4 uppercase">
          <div className="flex items-center gap-1.5 mb-2 sm:mb-0">
            <Compass className="w-3.5 h-3.5 animate-spin-slow text-indigo-400/80" />
            <span>JUST WEATHER INTEGRATED GLOBAL OBSERVER</span>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-indigo-400 transition-colors">SATELLITE DATA GRID</span>
            <span>•</span>
            <span className="hover:text-indigo-400 transition-colors">WIND INTERACTIVE SENSORS</span>
          </div>
        </footer>

      </div>

      {/* 4. Elegant Serverless Multi-Action Micro-Feedback Panel */}
      <FeedbackWidget />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <WeatherAppContent />
    </AppProvider>
  );
}
