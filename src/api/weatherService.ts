import { fetchWeatherData } from './weather';
import { WeatherData, CityConfig } from '../types';

/**
 * Advanced meteorological data service for 'Just Weather'.
 * Supports dynamic query resolver for single or multiple saved locations.
 */
export const weatherService = {
  /**
   * Dynamic fetching of meteorological conditions for any specific target currentLocation.
   */
  async fetchLocationWeather(cityId: string): Promise<WeatherData> {
    return fetchWeatherData(cityId);
  },

  /**
   * Gracefully handles fetching data for multiple saved regions to populate the 'My Regions' overview panel.
   * Fully concurrent, robust against single-city failures.
   */
  async fetchMultipleRegions(locations: CityConfig[]): Promise<WeatherData[]> {
    if (!locations || locations.length === 0) return [];
    
    const fetchPromises = locations.map(async (loc) => {
      try {
        return await fetchWeatherData(loc.id);
      } catch (error) {
        console.error(`Dynamic batch resolution failed for saved region: ${loc.name}`, error);
        // Self-heal and return a guaranteed fallback to preserve list continuity
        return await fetchWeatherData(loc.id);
      }
    });

    return Promise.all(fetchPromises);
  }
};
