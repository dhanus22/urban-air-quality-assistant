import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Wind,
  MessageSquare,
  Clock,
  Home,
  Calculator,
  Menu,
  X,
  ShieldCheck,
  Leaf,
} from 'lucide-react';
import SkipLink from './SkipLink';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: Wind },
  { name: 'AI Chat', path: '/chat', icon: MessageSquare },
  { name: 'Daily Routines', path: '/routines', icon: Clock },
  { name: 'Indoor Hacks', path: '/indoor-hacks', icon: Home },
  { name: 'Impact Calculator', path: '/impact', icon: Calculator },
];

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Accessibility Skip Link */}
      <SkipLink targetId="main-content">Skip to main content</SkipLink>

      {/* Header & Main Navigation */}
      <header
        role="banner"
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* App Logo & Name */}
            <NavLink
              to="/"
              className="flex items-center gap-3 group focus-visible:outline-teal-600 rounded-lg p-1"
              aria-label="Urban Air Quality Assistant Home"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Wind className="w-5 h-5 text-teal-50" aria-hidden="true" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-teal-800 to-blue-800 bg-clip-text text-transparent block leading-tight">
                  AeroSense AI
                </span>
                <span className="text-xs text-slate-500 font-medium block">
                  Urban Air Quality Assistant
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation */}
            <nav
              aria-label="Main navigation"
              className="hidden md:flex items-center gap-1.5"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 shadow-xs font-semibold ring-1 ring-teal-600/20'
                        : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100/70'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-teal-600' : 'text-slate-400'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Hamburger Toggle */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={toggleMobileMenu}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
                aria-label={mobileMenuOpen ? 'Close main menu' : 'Open main menu'}
                className="p-2 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100 focus-visible:outline-teal-600"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-teal-600' : 'text-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        className="flex-1 focus:outline-hidden"
      >
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer
        role="contentinfo"
        className="border-t border-slate-200 bg-white text-slate-600 mt-auto"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-teal-600 flex items-center justify-center text-white">
                <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <span className="font-semibold text-slate-800">
                Urban Air Quality Assistant
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-medium">
                AI Powered
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-teal-600" aria-hidden="true" />
              <span>
                WHO Global Air Quality Standard & EPA AQI Compliant Algorithms
              </span>
            </div>

            <p className="text-xs text-slate-400 text-center md:text-right">
              Public health guidance based on real-time sensory telemetry.
              <br />
              Always consult healthcare professionals for medical conditions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
