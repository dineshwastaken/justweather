import React, { createContext, useContext, useState, useEffect } from 'react';
import { CityConfig } from '../types';
import { useWeatherStore } from '../store/weatherStore';
import { INDIAN_CITIES } from '../api/weather';

export interface InteractionState {
  mousePosition: { x: number; y: number };
  isPressing: boolean;
}

interface AppContextType {
  currentLocation: CityConfig;
  setCurrentLocation: (loc: CityConfig) => void;
  savedLocations: CityConfig[];
  addSavedLocation: (loc: CityConfig) => void;
  removeSavedLocation: (cityId: string) => void;
  interactionState: InteractionState;
  setInteractionState: React.Dispatch<React.SetStateAction<InteractionState>>;
  selectedTime: number; // minutes from 0 to 1439
  setSelectedTime: (time: number) => void;
  predictedTemperature: number;
  setPredictedTemperature: (temp: number) => void;
  syncToCurrentTime: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectCity, weatherData, refreshWeather } = useWeatherStore();

  const getIndore = (): CityConfig => {
    return INDIAN_CITIES.find(c => c.id === 'indore') || {
      id: 'indore',
      name: 'Indore',
      state: 'Madhya Pradesh',
      lat: 22.7196,
      lng: 75.8577,
      imdCityId: '42754'
    };
  };

  const initialBangalore = INDIAN_CITIES.find(c => c.id === 'bangalore') || INDIAN_CITIES[0];
  const initialIndore = getIndore();

  const isValidCityConfig = (obj: any): obj is CityConfig => {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.id === 'string' &&
      typeof obj.name === 'string' &&
      typeof obj.state === 'string' &&
      typeof obj.lat === 'number' &&
      typeof obj.lng === 'number'
    );
  };

  const getSavedLocationsFromStorage = (): CityConfig[] | null => {
    try {
      const saved = localStorage.getItem('justweather_saved_locations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(isValidCityConfig)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing saved locations from localStorage', e);
    }
    return null;
  };

  const getCurrentLocationFromStorage = (): CityConfig | null => {
    try {
      const loc = localStorage.getItem('justweather_current_location');
      if (loc) {
        const parsed = JSON.parse(loc);
        if (isValidCityConfig(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing current location from localStorage', e);
    }
    return null;
  };

  const [currentLocation, setCurrentLocationState] = useState<CityConfig>(() => {
    const stored = getCurrentLocationFromStorage();
    return stored || initialBangalore;
  });

  const [savedLocations, setSavedLocations] = useState<CityConfig[]>(() => {
    const stored = getSavedLocationsFromStorage();
    return stored || [initialBangalore, initialIndore];
  });
  
  const [selectedTime, setSelectedTime] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  const [predictedTemperature, setPredictedTemperature] = useState<number>(24.5);

  // Synchronize predicted temperature from weatherData and diurnal time
  useEffect(() => {
    if (weatherData) {
      const forecastDay = weatherData.forecast[0];
      const tempMin = forecastDay ? forecastDay.tempMin : weatherData.temperature - 4;
      const tempMax = forecastDay ? forecastDay.tempMax : weatherData.temperature + 4;
      const hour = selectedTime / 60;
      
      const center = (tempMax + tempMin) / 2;
      const amplitude = (tempMax - tempMin) / 2;
      const radians = ((hour - 9) / 24) * 2 * Math.PI;
      const factor = Math.sin(radians);
      const computed = parseFloat((center + amplitude * factor).toFixed(1));
      
      setPredictedTemperature(computed);
    } else {
      setPredictedTemperature(24.5);
    }
  }, [selectedTime, weatherData]);

  // Synchronize state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('justweather_current_location', JSON.stringify(currentLocation));
    } catch (e) {
      console.error('Error saving current location to localStorage', e);
    }
  }, [currentLocation]);

  useEffect(() => {
    try {
      localStorage.setItem('justweather_saved_locations', JSON.stringify(savedLocations));
    } catch (e) {
      console.error('Error saving saved locations to localStorage', e);
    }
  }, [savedLocations]);

  const [interactionState, setInteractionState] = useState<InteractionState>({
    mousePosition: { x: 0, y: 0 },
    isPressing: false,
  });

  const setCurrentLocation = (loc: CityConfig) => {
    setCurrentLocationState(loc);
  };

  // Keep the weatherStore in sync with AppContext:
  useEffect(() => {
    selectCity(currentLocation.id);
  }, [currentLocation, selectCity]);

  const addSavedLocation = (loc: CityConfig) => {
    if (!savedLocations.some(l => l.id === loc.id)) {
      setSavedLocations(prev => [...prev, loc]);
    }
  };

  const removeSavedLocation = (cityId: string) => {
    // Prevent removing everything to ensure we always have a saved location
    setSavedLocations(prev => prev.filter(l => l.id !== cityId));
  };

  const syncToCurrentTime = () => {
    const now = new Date();
    setSelectedTime(now.getHours() * 60 + now.getMinutes());
    refreshWeather().catch(err => console.error('Error refreshing weather on sync:', err));
  };

  return (
    <AppContext.Provider
      value={{
        currentLocation,
        setCurrentLocation,
        savedLocations,
        addSavedLocation,
        removeSavedLocation,
        interactionState,
        setInteractionState,
        selectedTime,
        setSelectedTime,
        predictedTemperature,
        setPredictedTemperature,
        syncToCurrentTime,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
