import { AQILevel } from '../types';

/**
 * Classifies an AQI numeric value into standard AQI levels
 */
export function getAQILevel(aqi: number): AQILevel {
  if (aqi <= 50) return AQILevel.Good;
  if (aqi <= 100) return AQILevel.Moderate;
  if (aqi <= 150) return AQILevel.UnhealthySG;
  if (aqi <= 200) return AQILevel.Unhealthy;
  if (aqi <= 300) return AQILevel.VeryUnhealthy;
  return AQILevel.Hazardous;
}

/**
 * Returns Tailwind text color class for an AQI level
 */
export function getAQIColor(level: AQILevel): string {
  switch (level) {
    case AQILevel.Good:
      return 'text-aqi-good';
    case AQILevel.Moderate:
      return 'text-aqi-moderate';
    case AQILevel.UnhealthySG:
      return 'text-aqi-unhealthy-sg';
    case AQILevel.Unhealthy:
      return 'text-aqi-unhealthy';
    case AQILevel.VeryUnhealthy:
      return 'text-aqi-very-unhealthy';
    case AQILevel.Hazardous:
      return 'text-aqi-hazardous';
  }
}

/**
 * Returns Tailwind background color class for an AQI level
 */
export function getAQIBgColor(level: AQILevel): string {
  switch (level) {
    case AQILevel.Good:
      return 'bg-aqi-good';
    case AQILevel.Moderate:
      return 'bg-aqi-moderate';
    case AQILevel.UnhealthySG:
      return 'bg-aqi-unhealthy-sg';
    case AQILevel.Unhealthy:
      return 'bg-aqi-unhealthy';
    case AQILevel.VeryUnhealthy:
      return 'bg-aqi-very-unhealthy';
    case AQILevel.Hazardous:
      return 'bg-aqi-hazardous';
  }
}

/**
 * Returns Hex color code for SVG and canvas rendering
 */
export function getAQIHexColor(level: AQILevel): string {
  switch (level) {
    case AQILevel.Good:
      return '#00e400';
    case AQILevel.Moderate:
      return '#ffff00';
    case AQILevel.UnhealthySG:
      return '#ff7e00';
    case AQILevel.Unhealthy:
      return '#ff0000';
    case AQILevel.VeryUnhealthy:
      return '#8f3f97';
    case AQILevel.Hazardous:
      return '#7e0023';
  }
}

/**
 * Returns accessible WCAG AA compliant badge classes
 */
export function getAQIBadgeClass(level: AQILevel): string {
  switch (level) {
    case AQILevel.Good:
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case AQILevel.Moderate:
      return 'bg-amber-100 text-amber-900 border-amber-300';
    case AQILevel.UnhealthySG:
      return 'bg-orange-100 text-orange-950 border-orange-300';
    case AQILevel.Unhealthy:
      return 'bg-rose-100 text-rose-900 border-rose-300';
    case AQILevel.VeryUnhealthy:
      return 'bg-purple-100 text-purple-900 border-purple-300';
    case AQILevel.Hazardous:
      return 'bg-red-950 text-red-100 border-red-800';
  }
}

/**
 * Returns human-readable label for the AQI level
 */
export function getAQILabel(level: AQILevel): string {
  return level;
}

/**
 * Returns health advisory text tailored to the AQI level
 */
export function getHealthAdvice(level: AQILevel): string {
  switch (level) {
    case AQILevel.Good:
      return 'Air quality is satisfactory and poses little to no health risk. Enjoy outdoor activities!';
    case AQILevel.Moderate:
      return 'Air quality is acceptable. Very sensitive individuals should monitor symptoms and consider reducing strenuous outdoor exertion.';
    case AQILevel.UnhealthySG:
      return 'Sensitive groups (children, elderly, those with respiratory/heart conditions) may experience health effects. Limit prolonged outdoor exertion.';
    case AQILevel.Unhealthy:
      return 'Everyone may experience health effects. Sensitive groups should avoid outdoor activities; others should limit prolonged outdoor exertion.';
    case AQILevel.VeryUnhealthy:
      return 'Health alert: Risk of health effects is heightened for the entire population. Avoid prolonged outdoor exertion and wear N95 protection.';
    case AQILevel.Hazardous:
      return 'Health emergency: Serious risk to the entire population. Stay indoors, keep windows tightly closed, and run HEPA air filtration.';
  }
}

/**
 * Returns emoji indicator for the AQI level
 */
export function getAQIEmoji(level: AQILevel): string {
  switch (level) {
    case AQILevel.Good:
      return '🟢';
    case AQILevel.Moderate:
      return '🟡';
    case AQILevel.UnhealthySG:
      return '🟠';
    case AQILevel.Unhealthy:
      return '🔴';
    case AQILevel.VeryUnhealthy:
      return '🟣';
    case AQILevel.Hazardous:
      return '🟤';
  }
}

/**
 * Normalizes AQI value to 0-100 percentage for gauges (based on 0-500 scale)
 */
export function getAQIPercentage(aqi: number): number {
  if (isNaN(aqi) || aqi <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((aqi / 500) * 100)));
}
