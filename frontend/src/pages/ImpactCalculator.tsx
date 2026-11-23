import React, { useState } from 'react';
import {
  Calculator,
  Sparkles,
  TrendingUp,
  Heart,
  Users,
  Lightbulb,
  CheckSquare,
  Square,
  Loader2,
  TreePine,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { ImpactResponse } from '../types';

const DEFAULT_HABITS = [
  'Drives single-occupancy petrol car daily',
  'Uses gas cooktop without strong ventilation',
  'Leaves windows open during morning peak smog',
  'Burns yard leaves or solid waste',
  'Operates diesel generator during outages',
  'No indoor particulate air filtration',
];

const DEFAULT_CHANGES = [
  'Switch to metro transit or bus 3 days/week',
  'Install DIY Corsi-Rosenthal / HEPA air purifier',
  'Adopt induction / electric cooking',
  'Carpool or use electric vehicle for work commute',
  'Time window airing for afternoon clean air window',
  'Participate in community urban tree planting',
];

export const ImpactCalculator: React.FC = () => {
  const [selectedHabits, setSelectedHabits] = useState<string[]>([
    DEFAULT_HABITS[0],
    DEFAULT_HABITS[2],
  ]);
  const [selectedChanges, setSelectedChanges] = useState<string[]>([
    DEFAULT_CHANGES[0],
    DEFAULT_CHANGES[1],
  ]);
  const [city] = useState('Delhi');
  const [loading, setLoading] = useState(false);
  const [impactData, setImpactData] = useState<ImpactResponse | null>(null);

  const toggleHabit = (habit: string) => {
    setSelectedHabits((prev) =>
      prev.includes(habit) ? prev.filter((h) => h !== habit) : [...prev, habit]
    );
  };

  const toggleChange = (change: string) => {
    setSelectedChanges((prev) =>
      prev.includes(change) ? prev.filter((c) => c !== change) : [...prev, change]
    );
  };

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedChanges.length === 0 || loading) return;

    setLoading(true);

    try {
      const res = await api.getImpact({
        currentHabits: selectedHabits,
        proposedChanges: selectedChanges,
        city: city.trim(),
      });
      setImpactData(res);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    handleCalculate();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Card */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Calculator className="w-6 h-6 text-teal-50" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Personal & Community Impact Calculator
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Quantify how everyday lifestyle choices slash emissions and shield family health
              </p>
            </div>
          </div>
        </div>

        {/* Checkbox Selector Grids */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Current Habits Column */}
          <div className="bg-rose-50/40 border border-rose-200/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                <span>🔴 Current High-Emission Habits</span>
              </h2>
              <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                {selectedHabits.length} selected
              </span>
            </div>
            <div className="space-y-2">
              {DEFAULT_HABITS.map((habit) => {
                const isSelected = selectedHabits.includes(habit);
                return (
                  <button
                    key={habit}
                    type="button"
                    onClick={() => toggleHabit(habit)}
                    role="checkbox"
                    aria-checked={isSelected}
                    className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-rose-100/70 border-rose-300 text-rose-950 shadow-2xs font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span>{habit}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Proposed Changes Column */}
          <div className="bg-emerald-50/40 border border-emerald-200/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>🟢 Proposed Clean Alternatives</span>
              </h2>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {selectedChanges.length} selected
              </span>
            </div>
            <div className="space-y-2">
              {DEFAULT_CHANGES.map((change) => {
                const isSelected = selectedChanges.includes(change);
                return (
                  <button
                    key={change}
                    type="button"
                    onClick={() => toggleChange(change)}
                    role="checkbox"
                    aria-checked={isSelected}
                    className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950 shadow-2xs font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span>{change}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Calculate Action Button */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => handleCalculate()}
            disabled={loading || selectedChanges.length === 0}
            className="px-8 py-3 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 focus-visible:outline-teal-600 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Computing Atmospheric Impacts...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Calculate My Environmental Impact</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Results Display */}
      {impactData && (
        <section aria-label="Impact Results" className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CO2 Reduction Metric */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Annual Greenhouse Gas Prevention
                </span>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                  {impactData.co2ReductionKg.toLocaleString()} <span className="text-base font-bold text-slate-500">kg CO₂</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
                <TreePine className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Equivalent to the carbon absorbed by {Math.round(impactData.co2ReductionKg / 22)} mature pine trees!</span>
              </p>
            </div>

            {/* Health Shield Score */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Personal Health Protection
                </span>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mt-2">
                  {impactData.healthBenefit}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-800">
                <span>Clean Air Index:</span>
                <span className="bg-teal-50 px-2.5 py-1 rounded-md">
                  {impactData.beforeScore ?? 42} → {impactData.afterScore ?? 88}/100
                </span>
              </div>
            </div>

            {/* Community Multiplier */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Neighborhood Collective Scale
                </span>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mt-2">
                  {impactData.communityImpact}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Community collective action creates clean air microclimates.
              </div>
            </div>
          </div>

          {/* Actionable Clean Air Tips */}
          {impactData.actionableTips && impactData.actionableTips.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Next High-Impact Steps to Further Clean Your Air</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
                {impactData.actionableTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ImpactCalculator;
