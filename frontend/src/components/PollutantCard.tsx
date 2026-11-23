import React, { useState } from 'react';
import { Info } from 'lucide-react';

export interface PollutantCardProps {
  name: string;
  value: number;
  unit: string;
}

export const POLLUTANT_LIMITS: Record<
  string,
  { limit: number; desc: string; fullname: string }
> = {
  'PM2.5': {
    limit: 35,
    fullname: 'Fine Particulate Matter (PM2.5)',
    desc: 'Tiny particles ≤2.5µm that penetrate deep into lungs and the bloodstream, elevating cardiovascular risks.',
  },
  'PM10': {
    limit: 150,
    fullname: 'Respirable Particulate Matter (PM10)',
    desc: 'Inhalable coarse particles that irritate airways, lungs, eyes, and provoke coughing and asthma.',
  },
  NO2: {
    limit: 100,
    fullname: 'Nitrogen Dioxide (NO2)',
    desc: 'Emitted from vehicle exhausts and power stations; triggers bronchial inflammation and spasms.',
  },
  O3: {
    limit: 100,
    fullname: 'Ground-Level Ozone (O3)',
    desc: 'Photochemical smog oxidant that reduces lung capacity and provokes sharp chest pain during exercise.',
  },
  SO2: {
    limit: 75,
    fullname: 'Sulfur Dioxide (SO2)',
    desc: 'Formed from burning fossil fuels containing sulfur; severely irritates mucous membranes.',
  },
  CO: {
    limit: 9,
    fullname: 'Carbon Monoxide (CO)',
    desc: 'Odorless gas from combustion that displaces oxygen in red blood cells.',
  },
};

export const PollutantCard: React.FC<PollutantCardProps> = ({
  name,
  value,
  unit,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Normalize key name (e.g. pm25 -> PM2.5)
  const upperKey = name.toUpperCase().replace(/\./g, '');
  let matchedKey = 'PM2.5';
  if (upperKey.includes('PM25')) matchedKey = 'PM2.5';
  else if (upperKey.includes('PM10')) matchedKey = 'PM10';
  else if (upperKey.includes('NO2')) matchedKey = 'NO2';
  else if (upperKey.includes('O3')) matchedKey = 'O3';
  else if (upperKey.includes('SO2')) matchedKey = 'SO2';
  else if (upperKey.includes('CO')) matchedKey = 'CO';
  else if (POLLUTANT_LIMITS[name]) matchedKey = name;

  const pollutantInfo = POLLUTANT_LIMITS[matchedKey] || {
    limit: 100,
    fullname: name,
    desc: `Atmospheric concentration of ${name}.`,
  };

  const limit = pollutantInfo.limit;
  const ratio = value / limit;

  // Determine status color and label
  let statusColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let statusText = 'Safe';

  if (ratio > 1.5) {
    statusColor = 'bg-rose-500';
    badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
    statusText = 'Hazardous';
  } else if (ratio > 1.0) {
    statusColor = 'bg-orange-500';
    badgeColor = 'bg-orange-50 text-orange-800 border-orange-200';
    statusText = 'Above Limit';
  } else if (ratio > 0.6) {
    statusColor = 'bg-amber-400';
    badgeColor = 'bg-amber-50 text-amber-900 border-amber-200';
    statusText = 'Moderate';
  }

  const progressPercent = Math.min(100, Math.round((value / (limit * 1.5)) * 100));

  return (
    <div
      className="relative bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow"
      aria-label={`${pollutantInfo.fullname}: ${value} ${unit}. Standard limit is ${limit} ${unit}. Current status is ${statusText}.`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-800 text-base">{name}</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTooltip((prev) => !prev)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-teal-600 focus-visible:outline-teal-600 rounded-full p-0.5"
              aria-label={`Health info for ${pollutantInfo.fullname}`}
              aria-expanded={showTooltip}
            >
              <Info className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            {/* Tooltip Overlay */}
            {showTooltip && (
              <div
                role="tooltip"
                className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-xl leading-relaxed pointer-events-none"
              >
                <p className="font-semibold text-teal-300 mb-1">
                  {pollutantInfo.fullname}
                </p>
                <p className="text-slate-300">{pollutantInfo.desc}</p>
                <div className="mt-2 pt-1 border-t border-slate-700/80 text-[11px] text-slate-400">
                  Standard Safe Limit: <strong className="text-white">{limit} {unit}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}
        >
          {statusText}
        </span>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1 my-2">
        <span className="text-2xl font-black tracking-tight text-slate-900">
          {value}
        </span>
        <span className="text-xs font-medium text-slate-500">{unit}</span>
      </div>

      {/* Progress Bar vs Safe Limit */}
      <div className="mt-3">
        <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
          <span>Safe: ≤{limit} {unit}</span>
          <span>{Math.round(ratio * 100)}% of limit</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={limit * 1.5}
          aria-label={`${name} concentration relative to safe limit`}
          className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${statusColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PollutantCard;
