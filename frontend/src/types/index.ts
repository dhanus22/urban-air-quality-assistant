export enum AQILevel {
  Good = 'Good',
  Moderate = 'Moderate',
  UnhealthySG = 'Unhealthy for Sensitive Groups',
  Unhealthy = 'Unhealthy',
  VeryUnhealthy = 'Very Unhealthy',
  Hazardous = 'Hazardous',
}

export interface PollutantValues {
  pm25?: number;
  pm10?: number;
  o3?: number;
  no2?: number;
  so2?: number;
  co?: number;
  [key: string]: number | undefined;
}

export interface WeatherData {
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  condition?: string;
}

export interface AirQualityData {
  city: string;
  aqi: number;
  level: AQILevel;
  dominantPollutant?: string;
  pollutants: PollutantValues;
  weather?: WeatherData;
  healthAdvisory?: string;
  timestamp?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  station?: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  city?: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  timestamp?: string;
  sources?: string[];
}

export interface RoutineItem {
  time: string;
  activity: string;
  emissionImpact: 'Low' | 'Medium' | 'High';
  sustainableAlternative: string;
  healthTip: string;
}

export interface RoutineRequest {
  city: string;
  lifestyle?: string;
}

export interface RoutineResponse {
  city: string;
  lifestyle: string;
  aqiSummary?: string;
  routines: RoutineItem[];
}

export interface IndoorHack {
  id: string;
  title: string;
  description: string;
  effectiveness: 'Low' | 'Medium' | 'High';
  cost: 'Low' | 'Medium' | 'High';
  steps: string[];
  estimatedImprovement?: string;
  roomType?: string;
}

export interface IndoorHackRequest {
  roomType: string;
  budget: 'Low' | 'Medium' | 'High';
  city?: string;
}

export interface IndoorHackResponse {
  hacks: IndoorHack[];
  summary: string;
}

export interface ImpactRequest {
  currentHabits: string[];
  proposedChanges: string[];
  city?: string;
}

export interface ImpactResponse {
  co2ReductionKg: number;
  healthBenefit: string;
  communityImpact: string;
  actionableTips: string[];
  beforeScore?: number;
  afterScore?: number;
}

export interface SearchResult {
  id: string;
  name: string;
  city: string;
  aqi?: number;
  lat: number;
  lng: number;
}
