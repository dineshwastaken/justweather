/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WeatherType = 'clear' | 'rain' | 'snow' | 'overcast' | 'storm' | 'cloudy';

export interface WeatherData {
  city: string;
  state: string;
  temperature: number;
  weatherType: WeatherType;
  description: string;
  humidity: number;
  windSpeed: number; // in km/h
  windDirection: number; // in degrees
  pressure: number; // in hPa
  visibility: number; // in km
  observedAt: string; // ISO String or Local formatted path
  forecast: ForecastDay[];
  alert?: NowcastAlert;
}

export interface ForecastDay {
  dayName: string;
  dateStr: string;
  tempMin: number;
  tempMax: number;
  weatherType: WeatherType;
  description: string;
  humidity: number;
  windSpeed: number;
}

export interface NowcastAlert {
  id: string;
  station: string;
  type: 'green' | 'yellow' | 'orange' | 'red';
  title: string;
  message: string;
  issuedAt: string;
}

export interface CityConfig {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  imdCityId?: string; // ID used by IMD endpoints
}
