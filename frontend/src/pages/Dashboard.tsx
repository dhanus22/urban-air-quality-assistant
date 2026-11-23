import React, { useState } from 'react';
import {
  Search,
  MapPin,
  RefreshCw,
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Compass,
} from 'lucide-react';
import { useAirQuality } from '../hooks/useAirQuality';
import AQIGauge from '../components/AQIGauge';
import PollutantCard from '../components/PollutantCard';
import { getAQIBgColor, getAQIColor } from '../utils/aqi-utils';

export const Dashboard: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const { data, loading, error, fetchAirQuality, fetchByLocation } = useAirQuality('Delhi');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchAirQuality(searchInput.trim());
    }
  };

  const handleQuickCity = (city: string) => {
    setSearchInput(city);
    fetchAirQuality(city);
  };

  const aqiBgClass = data ? getAQIBgColor(data.level) : 'bg-slate-50';
  const aqiTextClass = data ? getAQIColor(data.level) : 'text-slate-800';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Search & Location Banner */}
      <section
        aria-label="Location and Search Controls"
        className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 flex items-center gap-2 max-w-xl"
            role="search"
          >
            <label htmlFor="city-search-input" className="sr-only">
              Search by City or Monitoring Station
            </label>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                id="city-search-input"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search city (e.g., Delhi, London, New York, Tokyo)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 focus-visible:outline-teal-600 disabled:opacity-50"
            >
              <span>Search</span>
            </button>
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={fetchByLocation}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl border border-slate-200/80 transition-colors flex items-center gap-2 focus-visible:outline-teal-600 disabled:opacity-50"
              aria-label="Detect air quality using current device GPS location"
            >
              <MapPin className="w-4 h-4 text-teal-600" aria-hidden="true" />
              <span>Use My Location</span>
            </button>

            <button
              type="button"
              onClick={() => data?.city && fetchAirQuality(data.city)}
              disabled={loading}
              className="p-2.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors focus-visible:outline-teal-600 disabled:opacity-50"
              aria-label="Refresh current air quality readings"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs text-slate-500">
          <span className="font-semibold text-slate-400">Popular Cities:</span>
          {['Delhi', 'London', 'New York', 'Tokyo', 'Mumbai', 'Beijing'].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleQuickCity(city)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 transition-colors font-medium text-slate-600"
            >
              {city}
            </button>
          ))}
        </div>
      </section>

      {/* Live Region for Screen Readers */}
      <div aria-live="polite" className="sr-only">
        {loading
          ? 'Fetching updated air quality telemetry data...'
          : error
          ? `Error loading data: ${error}`
          : data
          ? `Air quality in ${data.city} is ${data.aqi} AQI, classified as ${data.level}.`
          : ''}
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-sm"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <strong className="font-semibold">Notice: </strong>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAirQuality('Delhi')}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-1 bg-white h-80 rounded-2xl border border-slate-200" />
          <div className="lg:col-span-2 bg-white h-80 rounded-2xl border border-slate-200" />
        </div>
      )}

      {/* Main AQI Telemetry Content */}
      {data && (
        <div className="space-y-8">
          {/* Primary Row: Gauge + Health Advisory */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* AQI Gauge Card */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold uppercase tracking-wider text-slate-400">
                  Live Station Telemetry
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  {data.timestamp
                    ? new Date(data.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Real-time'}
                </span>
              </div>

              {/* City Title */}
              <div className="text-center my-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
                  <Compass className="w-6 h-6 text-teal-600" aria-hidden="true" />
                  {data.city}
                </h1>
                {data.station && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                    Station: {data.station}
                  </p>
                )}
              </div>

              {/* Gauge */}
              <div className="my-4">
                <AQIGauge aqi={data.aqi} size="lg" />
              </div>

              {/* Dominant Pollutant Badge */}
              <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Dominant Pollutant:</span>
                <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                  {data.dominantPollutant || 'PM2.5'}
                </span>
              </div>
            </div>

            {/* Health Advisory & Weather Highlights */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-6">
              {/* Health Advisory Card */}
              <div
                className={`rounded-2xl border p-6 shadow-xs transition-colors ${aqiBgClass}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-white/80 shadow-xs">
                    <ShieldAlert className={`w-6 h-6 ${aqiTextClass}`} aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Health Advisory & Risk Level
                    </h2>
                    <span className={`text-xs font-semibold ${aqiTextClass}`}>
                      Status: {data.level}
                    </span>
                  </div>
                </div>

                <p className="text-sm sm:text-base leading-relaxed text-slate-700 bg-white/90 p-4 rounded-xl border border-white/60 shadow-xs">
                  {data.healthAdvisory ||
                    'Monitor hourly smog variations and restrict intense outdoor activities.'}
                </p>

                {/* Practical Recommendations Pills */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-semibold text-slate-700">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-white flex items-center gap-2">
                    <span className="text-base">😷</span>
                    <span>{data.aqi > 100 ? 'Wear N95 Mask' : 'No Mask Needed'}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-white flex items-center gap-2">
                    <span className="text-base">🪟</span>
                    <span>{data.aqi > 150 ? 'Close Windows' : 'Ventilate Midday'}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-white flex items-center gap-2 col-span-2 sm:col-span-1">
                    <span className="text-base">🏃</span>
                    <span>{data.aqi > 150 ? 'Exercise Indoors' : 'Outdoor OK'}</span>
                  </div>
                </div>
              </div>

              {/* Weather Conditions Card */}
              {data.weather && (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Meteorological Context
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Thermometer className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Temperature</span>
                        <span className="text-base font-bold text-slate-800">
                          {data.weather.temperature ?? '--'}°C
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Droplets className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Humidity</span>
                        <span className="text-base font-bold text-slate-800">
                          {data.weather.humidity ?? '--'}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <Wind className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Wind Speed</span>
                        <span className="text-base font-bold text-slate-800">
                          {data.weather.windSpeed ?? '--'} km/h
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Compass className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Atmosphere</span>
                        <span className="text-xs font-bold text-slate-800 truncate block">
                          {data.weather.condition ?? 'Stable'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Row: Specific Pollutant Cards Breakdown */}
          <section aria-labelledby="pollutants-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="pollutants-heading" className="text-xl font-bold text-slate-900">
                  Individual Pollutant Breakdown
                </h2>
                <p className="text-xs text-slate-500">
                  Sensory telemetry measurements benchmarked against WHO safe threshold boundaries
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.pollutants && Object.keys(data.pollutants).length > 0 ? (
                <>
                  {data.pollutants.pm25 !== undefined && (
                    <PollutantCard name="PM2.5" value={data.pollutants.pm25} unit="µg/m³" />
                  )}
                  {data.pollutants.pm10 !== undefined && (
                    <PollutantCard name="PM10" value={data.pollutants.pm10} unit="µg/m³" />
                  )}
                  {data.pollutants.no2 !== undefined && (
                    <PollutantCard name="NO2" value={data.pollutants.no2} unit="ppb" />
                  )}
                  {data.pollutants.o3 !== undefined && (
                    <PollutantCard name="O3" value={data.pollutants.o3} unit="ppb" />
                  )}
                  {data.pollutants.so2 !== undefined && (
                    <PollutantCard name="SO2" value={data.pollutants.so2} unit="ppb" />
                  )}
                  {data.pollutants.co !== undefined && (
                    <PollutantCard name="CO" value={data.pollutants.co} unit="ppm" />
                  )}
                </>
              ) : (
                <div className="col-span-full bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
                  Specific pollutant sensor sub-indices are currently being calibrated for this station.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
