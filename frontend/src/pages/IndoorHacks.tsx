import React, { useState } from 'react';
import {
  Home,
  Sparkles,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { IndoorHack, IndoorHackResponse } from '../types';

const ROOM_OPTIONS = [
  { value: 'Living Room', label: 'Living Room' },
  { value: 'Bedroom', label: 'Bedroom' },
  { value: 'Kitchen', label: 'Kitchen' },
  { value: 'Home Office', label: 'Home Office' },
  { value: 'General / Whole Home', label: 'Whole Home' },
];

const BUDGET_OPTIONS: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High'];

export const IndoorHacks: React.FC = () => {
  const [roomType, setRoomType] = useState('Living Room');
  const [budget, setBudget] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [city] = useState('Delhi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hacksResponse, setHacksResponse] = useState<IndoorHackResponse | null>(null);
  const [expandedHackIds, setExpandedHackIds] = useState<Record<string, boolean>>({});

  const handleFetchHacks = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.getIndoorHacks({
        roomType,
        budget,
        city: city.trim(),
      });
      setHacksResponse(res);
      // Automatically expand first hack
      if (res.hacks && res.hacks.length > 0) {
        setExpandedHackIds({ [res.hacks[0].id]: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve indoor hacks';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedHackIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Initial load helper
  React.useEffect(() => {
    handleFetchHacks();
  }, []);

  const getEffectivenessBadge = (eff: string) => {
    const lower = eff.toLowerCase();
    if (lower === 'high') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (lower === 'medium') {
      return 'bg-teal-100 text-teal-800 border-teal-300';
    }
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Hero Card */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-xs">
              <Home className="w-6 h-6 text-teal-50" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Indoor Air Quality Hacks
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Budget-conscious, proven indoor air filtration and sealing techniques for winter smog
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <form
          onSubmit={handleFetchHacks}
          className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3"
        >
          {/* Room Selector */}
          <div className="sm:col-span-4">
            <label htmlFor="hack-room-select" className="block text-xs font-semibold text-slate-600 mb-1">
              Select Room
            </label>
            <select
              id="hack-room-select"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            >
              {ROOM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Selector */}
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Budget Tier
            </label>
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Budget Tier">
              {BUDGET_OPTIONS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget(b)}
                  role="radio"
                  aria-checked={budget === b}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    budget === b
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {b} Cost
                </button>
              ))}
            </div>
          </div>

          {/* City / Refresh Button */}
          <div className="sm:col-span-4 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 focus-visible:outline-teal-600 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading Hacks...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Explore Solutions</span>
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

      {/* Summary Banner */}
      {hacksResponse?.summary && (
        <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-5 text-sm text-teal-950 flex items-start gap-3 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">{hacksResponse.summary}</p>
        </div>
      )}

      {/* Hacks Cards Grid */}
      {hacksResponse && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hacksResponse.hacks.map((hack: IndoorHack) => {
            const isExpanded = !!expandedHackIds[hack.id];

            return (
              <div
                key={hack.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getEffectivenessBadge(
                        hack.effectiveness
                      )}`}
                    >
                      {hack.effectiveness} Effectiveness
                    </span>

                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-slate-400" />
                      {hack.cost} Budget
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                    {hack.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {hack.description}
                  </p>

                  {/* Estimated Improvement Chip */}
                  {hack.estimatedImprovement && (
                    <div className="bg-emerald-50 text-emerald-800 text-xs px-3 py-1.5 rounded-xl border border-emerald-200/80 font-medium mb-4 flex items-center gap-2">
                      <span className="text-sm">📈</span>
                      <span>{hack.estimatedImprovement}</span>
                    </div>
                  )}

                  {/* DIY Steps Accordion */}
                  {isExpanded && hack.steps && hack.steps.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Step-by-Step DIY Implementation:
                      </h4>
                      <ol className="space-y-2 text-xs text-slate-700">
                        {hack.steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {hack.steps?.length || 0} implementation steps
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleExpand(hack.id)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 focus-visible:outline-teal-600"
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? 'Hide Steps' : 'View DIY Guide'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IndoorHacks;
