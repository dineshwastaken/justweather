/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { WeatherData, CityConfig } from '../types';
import { fetchWeatherData, INDIAN_CITIES } from '../api/weather';

interface WeatherState {
  selectedCityId: string;
  weatherData: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  cities: CityConfig[];
  
  selectCity: (cityId: string) => Promise<void>;
  refreshWeather: () => Promise<void>;
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  selectedCityId: 'bangalore',
  weatherData: null,
  isLoading: true,
  error: null,
  cities: INDIAN_CITIES,

  selectCity: async (cityId: string) => {
    set({ selectedCityId: cityId, isLoading: true, error: null });
    try {
      const data = await fetchWeatherData(cityId);
      set({ weatherData: data, isLoading: false });
    } catch (err: any) {
      set({ 
        error: err?.message || 'Failed to acquire weather data.', 
        isLoading: false 
      });
    }
  },

  refreshWeather: async () => {
    const { selectedCityId } = get();
    set({ isLoading: true, error: null });
    try {
      const data = await fetchWeatherData(selectedCityId);
      set({ weatherData: data, isLoading: false });
    } catch (err: any) {
      set({ 
        error: err?.message || 'Failed to refresh weather data.', 
        isLoading: false 
      });
    }
  }
}));
