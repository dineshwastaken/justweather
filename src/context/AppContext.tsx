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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectCity, weatherData } = useWeatherStore();

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

  const [currentLocation, setCurrentLocationState] = useState<CityConfig>(initialBangalore);
  const [savedLocations, setSavedLocations] = useState<CityConfig[]>([]);
  
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

  // Initialize saved locations on mount with Bangalore and Indore
  useEffect(() => {
    setSavedLocations([initialBangalore, getIndore()]);
  }, []);

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
