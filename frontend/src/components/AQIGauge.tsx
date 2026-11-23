import React, { useEffect, useState } from 'react';
import {
  getAQIColor,
  getAQIHexColor,
  getAQILevel,
  getAQILabel,
  getAQIPercentage,
  getAQIEmoji,
} from '../utils/aqi-utils';

export interface AQIGaugeProps {
  aqi: number;
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
}

export const AQIGauge: React.FC<AQIGaugeProps> = ({
  aqi,
  size = 'md',
  showEmoji = true,
}) => {
  const level = getAQILevel(aqi);
  const colorClass = getAQIColor(level);
  const hexColor = getAQIHexColor(level);
  const label = getAQILabel(level);
  const emoji = getAQIEmoji(level);
  const percentage = getAQIPercentage(aqi);

  // SVG semicircle math
  const radius = 75;
  const strokeWidth = 14;
  const arcLength = Math.PI * radius; // Half-circle circumference ≈ 235.62
  const targetOffset = arcLength * (1 - percentage / 100);

  // Animated fill on mount
  const [currentOffset, setCurrentOffset] = useState<number>(arcLength);

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCurrentOffset(targetOffset);
    } else {
      const timer = setTimeout(() => {
        setCurrentOffset(targetOffset);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [targetOffset]);

  const sizeClasses = {
    sm: { container: 'w-44', aqiText: 'text-3xl', labelText: 'text-xs' },
    md: { container: 'w-60', aqiText: 'text-5xl', labelText: 'text-sm' },
    lg: { container: 'w-72', aqiText: 'text-6xl', labelText: 'text-base' },
  }[size];

  return (
    <div
      role="meter"
      aria-label="Air Quality Index"
      aria-valuenow={aqi}
      aria-valuemin={0}
      aria-valuemax={500}
      aria-valuetext={`${aqi} AQI, ${label}`}
      className={`flex flex-col items-center justify-center select-none ${sizeClasses.container} ${colorClass}`}
      data-testid="aqi-gauge"
    >
      <div className="relative w-full aspect-2/1 flex items-end justify-center overflow-hidden">
        <svg
          viewBox="0 0 180 95"
          className="w-full h-auto overflow-visible"
          aria-hidden="true"
        >
          {/* Background Track */}
          <path
            d="M 15 90 A 75 75 0 0 1 165 90"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <path
            d="M 15 90 A 75 75 0 0 1 165 90"
            fill="none"
            stroke={hexColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={currentOffset}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          />
        </svg>

        {/* Center AQI Numeric Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <div className="flex items-center gap-1.5">
            {showEmoji && <span className="text-xl">{emoji}</span>}
            <span
              className={`font-black tracking-tight ${sizeClasses.aqiText} text-slate-800`}
              data-testid="aqi-value"
            >
              {aqi}
            </span>
          </div>
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            AQI Score
          </span>
        </div>
      </div>

      {/* Level Label Badge below */}
      <div className="mt-3 text-center">
        <span
          className={`inline-block px-3 py-1 rounded-full font-bold shadow-xs ${sizeClasses.labelText} ${colorClass}`}
          data-testid="aqi-level-label"
        >
          {label}
        </span>
      </div>
    </div>
  );
};

export default AQIGauge;
