import React, { useState } from 'react';
import {
  Clock,
  Sparkles,
  Printer,
  Calendar,
  AlertCircle,
  Leaf,
  HeartPulse,
  Loader2,
  Users,
} from 'lucide-react';
import { api } from '../services/api';
import { RoutineResponse } from '../types';

const LIFESTYLE_OPTIONS = [
  { value: 'family_with_kids', label: 'Family with Children' },
  { value: 'working_professional', label: 'Working Professional' },
  { value: 'elderly', label: 'Senior / Elderly Citizens' },
  { value: 'student', label: 'College / School Student' },
  { value: 'general', label: 'General Household' },
];

export const DailyRoutines: React.FC = () => {
  const [city, setCity] = useState('Delhi');
  const [lifestyle, setLifestyle] = useState('family_with_kids');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routineData, setRoutineData] = useState<RoutineResponse | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!city.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.getRoutines({
        city: city.trim(),
        lifestyle,
      });
      setRoutineData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate schedule';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper for impact badge
  const getImpactBadge = (impact: string) => {
    const lower = impact.toLowerCase();
    if (lower === 'low') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (lower === 'high') {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0">
      {/* Page Title & Hero */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs print:border-none print:shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Clock className="w-6 h-6 text-teal-50" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Low-Emission Daily Routines
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                AI-crafted daily schedules that minimize particulate exposure and cut personal emissions
              </p>
            </div>
          </div>

          {routineData && (
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-2 self-start md:self-auto transition-colors print:hidden"
              aria-label="Print or save routine schedule as PDF"
            >
              <Printer className="w-4 h-4 text-slate-600" aria-hidden="true" />
              <span>Print Schedule</span>
            </button>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3 print:hidden">
          <div className="sm:col-span-5">
            <label htmlFor="routine-city" className="block text-xs font-semibold text-slate-600 mb-1">
              Your City
            </label>
            <input
              id="routine-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Delhi, London, New York"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-600"
              required
            />
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="routine-lifestyle" className="block text-xs font-semibold text-slate-600 mb-1">
              Lifestyle Category
            </label>
            <div className="relative">
              <select
                id="routine-lifestyle"
                value={lifestyle}
                onChange={(e) => setLifestyle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 appearance-none"
              >
                {LIFESTYLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="sm:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={loading || !city.trim()}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 focus-visible:outline-teal-600 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Planning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Routine</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Error Banner */}
      {error && (
        <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State Banner */}
      {!routineData && !loading && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          <Calendar className="w-12 h-12 text-teal-600/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No Routine Generated Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Select your lifestyle and city above to receive a full 24-hour smog-safe timeline engineered for optimal ventilation, safe commutes, and minimal emissions.
          </p>
          <button
            type="button"
            onClick={() => handleGenerate()}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors"
          >
            Generate Example for Delhi
          </button>
        </div>
      )}

      {/* Schedule Timeline Display */}
      {routineData && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                Optimized Plan for {routineData.city}
              </span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {routineData.aqiSummary || 'Customized timeline to bypass peak vehicular smog and thermal inversions.'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-xl border border-teal-200 text-teal-900 font-semibold shadow-2xs">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>Target: &gt;40% Inhalation Reduction</span>
            </div>
          </div>

          {/* Timeline Items */}
          <div className="relative border-l-2 border-teal-500/30 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-6">
            {routineData.routines.map((item, index) => (
              <div
                key={index}
                className="relative bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow group"
              >
                {/* Timeline Dot Marker */}
                <div
                  className="absolute -left-[31px] sm:-left-[39px] top-6 w-4 h-4 rounded-full bg-teal-600 ring-4 ring-white shadow-xs group-hover:scale-125 transition-transform"
                  aria-hidden="true"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-teal-800 text-sm bg-teal-50 px-2.5 py-1 rounded-lg">
                      {item.time}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">
                      {item.activity}
                    </h3>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${getImpactBadge(
                      item.emissionImpact
                    )}`}
                  >
                    {item.emissionImpact} Emission Impact
                  </span>
                </div>

                {/* Sub details: Alternative + Health Tip */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                  {/* Eco Alternative */}
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-slate-700">
                    <Leaf className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <strong className="block font-semibold text-emerald-950 mb-0.5">
                        Clean Alternative
                      </strong>
                      <span>{item.sustainableAlternative}</span>
                    </div>
                  </div>

                  {/* Health Tip */}
                  <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-start gap-2.5 text-slate-700">
                    <HeartPulse className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <strong className="block font-semibold text-blue-950 mb-0.5">
                        Health Defense Tip
                      </strong>
                      <span>{item.healthTip}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyRoutines;
