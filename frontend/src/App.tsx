import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import { Wind, Loader2 } from 'lucide-react';

// Lazy loaded page components for optimal bundle splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ChatAssistant = lazy(() => import('./pages/ChatAssistant'));
const DailyRoutines = lazy(() => import('./pages/DailyRoutines'));
const IndoorHacks = lazy(() => import('./pages/IndoorHacks'));
const ImpactCalculator = lazy(() => import('./pages/ImpactCalculator'));

// Page loading placeholder fallback
const PageFallback: React.FC = () => (
  <div
    role="status"
    aria-label="Loading page contents"
    className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-500"
  >
    <Loader2 className="w-8 h-8 animate-spin text-teal-600" aria-hidden="true" />
    <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">
      Loading AeroSense...
    </span>
  </div>
);

// 404 Fallback page
const NotFound: React.FC = () => (
  <div className="max-w-md mx-auto py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4">
      <Wind className="w-8 h-8" />
    </div>
    <h1 className="text-2xl font-black text-slate-900 mb-2">Page Not Found</h1>
    <p className="text-sm text-slate-600 mb-6">
      The atmospheric page or telemetry report you requested could not be found.
    </p>
    <Link
      to="/"
      className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
    >
      Return to Dashboard
    </Link>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<ChatAssistant />} />
            <Route path="/routines" element={<DailyRoutines />} />
            <Route path="/indoor-hacks" element={<IndoorHacks />} />
            <Route path="/impact" element={<ImpactCalculator />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
