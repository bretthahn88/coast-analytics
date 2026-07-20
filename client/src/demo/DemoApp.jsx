import { Link, NavLink, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Menu, MoreVertical } from 'lucide-react';
import { Logo } from '../components/Logo.jsx';
import { DemoBadge } from './DemoBadge.jsx';
import { DemoCTABar } from './DemoCTABar.jsx';
import { DemoChromeProvider } from './DemoChromeContext.jsx';
import { DemoGate, isDemoUnlocked } from './DemoGate.jsx';
import { MODEL_SECTIONS } from './models.config.js';
import { useSEO } from '../lib/useSEO.js';
import {
  startTour,
  isTourCompleted,
  clearTourCompleted,
  getTourResumeAt,
  clearTourResumeAt,
  setTourResumeAt,
} from './lib/demoTour.js';

import Dashboard from './Dashboard.jsx';
import ModelPage from './ModelPage.jsx';
import TestAndLearn from './TestAndLearn.jsx';
import DataManager from './DataManager.jsx';

const OAI_TOOL_PAGE = 'https://oak-island-ai.vercel.app/consultation';

// Slug of the model page used for the mid-flow tour step. Matches the
// `slug` value in models.config.js for the Revenue / Folio Forecasting model.
const TOUR_MODEL_SLUG = 'acv-forecast';
const TOUR_MODEL_PATH = `/demo/models/${TOUR_MODEL_SLUG}`;
const TOUR_DASHBOARD_PATHS = new Set(['/demo', '/demo/', '/demo/dashboard']);

// Step-index buckets for the resume effect. Steps 0, 1, 2, 4, 5 anchor on
// the dashboard route; step 3 anchors on the model page. Step 0 and 5 have
// no DOM anchor and could technically resume from anywhere, but we keep the
// dashboard mapping consistent.
const DASHBOARD_RESUME_STEPS = new Set([0, 1, 2, 4, 5]);
const MODEL_RESUME_STEPS = new Set([3]);

/**
 * If the model-config panel is collapsed on mobile, click the Filters
 * toggle button to expand it before the tour anchors. No-op on desktop
 * (the toggle button is display:none there).
 */
function ensureMobileFiltersOpen() {
  const toggle = document.querySelector('[data-tour-mobile-toggle="model-config"]');
  if (!toggle) return;
  const isToggleVisible = window.getComputedStyle(toggle).display !== 'none';
  if (!isToggleVisible) return;
  const panel = document.querySelector('[data-tour-id="model-config"]');
  if (panel && window.getComputedStyle(panel).display === 'none') {
    toggle.click();
  }
}

export default function DemoApp() {
  useSEO({
    title: 'Live Demo | Coast Analytics',
    description:
      'Explore a live predictive CRM platform built for multi-property hospitality operators. Churn prediction, CLV, tier migration, campaign response, and more.',
  });

  const navigate = useNavigate();
  const location = useLocation();

  const [unlocked, setUnlocked] = useState(false);
  const [gateChecked, setGateChecked] = useState(false);
  useEffect(() => {
    setUnlocked(isDemoUnlocked());
    setGateChecked(true);
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Tour callbacks. These are stable closures over the navigate/state
  // setters and get passed into each tour invocation.
  const onBookCall = () => navigate('/contact');
  const onSidebarOpen = () => setSidebarOpen(true);
  const onSeeModel = () => navigate(TOUR_MODEL_PATH);
  const onReturnToDashboard = () => navigate('/demo/dashboard');

  const launchTour = (startStep = 0) => {
    startTour({
      onBookCall,
      onSidebarOpen,
      onSeeModel,
      onReturnToDashboard,
      startStep,
    });
  };

  const handleManualTour = () => {
    clearTourCompleted();
    clearTourResumeAt();
    // If the user clicks Tour from a model page, hop back to the dashboard
    // first so Step 1 (Welcome) and Step 2 (KPIs) anchor correctly.
    if (!TOUR_DASHBOARD_PATHS.has(location.pathname)) {
      setTourResumeAt(0);
      navigate('/demo/dashboard');
    } else {
      launchTour(0);
    }
  };

  // Single resume effect. Handles BOTH the first-visit auto-start and the
  // mid-flow page-change handoff. Runs on every unlock change or pathname
  // change.
  useEffect(() => {
    if (!unlocked) return;

    const path = location.pathname;
    const isDashboard = TOUR_DASHBOARD_PATHS.has(path);
    const isModelPage = path.startsWith(TOUR_MODEL_PATH);
    const resumeAt = getTourResumeAt();

    // Mid-flow resume after a navigateAndResume() handoff.
    if (resumeAt != null) {
      const shouldResume =
        (MODEL_RESUME_STEPS.has(resumeAt) && isModelPage) ||
        (DASHBOARD_RESUME_STEPS.has(resumeAt) && isDashboard);
      if (!shouldResume) return; // wait for the right route to mount
      clearTourResumeAt();
      // Give the resumed page time to mount + fetch data + render anchors.
      const t = window.setTimeout(() => {
        if (resumeAt === 3) ensureMobileFiltersOpen();
        // Scroll to top so a centered no-anchor popover (steps 0 + 5) lands
        // in the visible viewport on mobile rather than wherever the user
        // happens to have scrolled.
        window.scrollTo(0, 0);
        launchTour(resumeAt);
      }, 1500);
      return () => window.clearTimeout(t);
    }

    // First-visit auto-start. Only when we are on the dashboard and the
    // user has never completed the tour.
    if (!isDashboard) return;
    if (isTourCompleted()) return;
    const t = window.setTimeout(() => {
      window.scrollTo(0, 0);
      launchTour(0);
    }, 1200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, location.pathname]);

  if (!gateChecked) return <div className="min-h-screen bg-dark" />;
  if (!unlocked) return <DemoGate onUnlocked={() => setUnlocked(true)} />;

  return (
    <DemoChromeProvider>
      <div className="min-h-screen flex flex-col bg-dark">
        <TopBar onToggle={() => setSidebarOpen((s) => !s)} onTour={handleManualTour} />
        <div className="flex-1 flex">
          <Sidebar open={sidebarOpen} />
          <main className="flex-1 min-w-0 max-w-full bg-dark dark-section dark-scroll">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="models/:slug" element={<ModelPage />} />
                <Route path="test-and-learn/*" element={<TestAndLearn />} />
                <Route path="data" element={<DataManager />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </div>
          </main>
        </div>
        <DemoBadge />
        <DemoCTABar />
      </div>
    </DemoChromeProvider>
  );
}

function TopBar({ onToggle, onTour }) {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);

  // Close the dropdown on route change so it doesn't linger between pages.
  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!navOpen) return;
    const onDocMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setNavOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setNavOpen(false); };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [navOpen]);

  return (
    <header className="sticky top-0 z-30" style={{ background: '#E9DDD5', borderBottom: '1px solid rgba(58,54,53,0.10)' }}>
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onToggle}
            className="md:hidden p-2 rounded-md text-dark hover:bg-dark/10 transition-colors flex-none"
            aria-label="Toggle model sidebar"
          >
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center min-w-0"><Logo tone="on-light" /></Link>
          <span
            className="hidden sm:inline-flex items-center gap-2 ml-3 px-2.5 py-1 rounded-md font-bold uppercase tracking-[0.12em]"
            style={{ background: '#1a1a1a', color: '#BC7526', fontSize: 10 }}
          >
            Demo Mode
          </span>
          <span className="hidden md:inline text-dark/70 text-sm ml-2">
            Cape Fear Hospitality Group
          </span>
        </div>

        {/* Desktop nav (md+). Inline buttons / links. */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={onTour}
            className="text-dark hover:underline text-[14px] px-3 py-1.5"
          >
            Tour
          </button>
          <Link to="/about" className="text-dark hover:underline text-[14px] px-3 py-1.5">About</Link>
          <a href={OAI_TOOL_PAGE} className="text-dark hover:underline text-[14px] px-3 py-1.5">
            Exit Demo
          </a>
        </div>

        {/* Mobile nav (< md). Dropdown menu so Tour / About / Exit Demo stay
            accessible at 375-390px viewports where inline items would
            overflow the top bar. */}
        <div ref={menuRef} className="md:hidden relative">
          <button
            type="button"
            onClick={() => setNavOpen((o) => !o)}
            aria-expanded={navOpen}
            aria-label="Open menu"
            className="p-2 rounded-md text-dark hover:bg-dark/10 transition-colors"
          >
            <MoreVertical size={20} />
          </button>
          {navOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-44 rounded-md overflow-hidden"
              style={{
                background: '#E9DDD5',
                border: '1px solid rgba(58,54,53,0.15)',
                boxShadow: '0 8px 24px rgba(58,54,53,0.18)',
                zIndex: 40,
              }}
            >
              <button
                role="menuitem"
                type="button"
                onClick={() => { setNavOpen(false); onTour(); }}
                className="block w-full text-left px-4 py-3 text-dark text-[15px] hover:bg-dark/5 transition-colors"
              >
                Tour
              </button>
              <Link
                role="menuitem"
                to="/about"
                onClick={() => setNavOpen(false)}
                className="block px-4 py-3 text-dark text-[15px] hover:bg-dark/5 transition-colors"
                style={{ borderTop: '1px solid rgba(58,54,53,0.10)' }}
              >
                About
              </Link>
              <a
                role="menuitem"
                href={OAI_TOOL_PAGE}
                onClick={() => setNavOpen(false)}
                className="block px-4 py-3 text-dark text-[15px] hover:bg-dark/5 transition-colors"
                style={{ borderTop: '1px solid rgba(58,54,53,0.10)' }}
              >
                Exit Demo
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Sidebar({ open }) {
  const linkClass = ({ isActive }) =>
    `flex items-center justify-between px-3 py-2 rounded-md text-[13px] transition-colors ${
      isActive
        ? 'bg-mid-olive text-gold font-bold'
        : 'text-cream/70 hover:text-cream hover:bg-mid-olive/40'
    }`;
  const groupLabel = 'eyebrow mb-2';
  return (
    <aside
      data-tour-id="model-sidebar"
      className={`${open ? 'block' : 'hidden'} md:block w-64 bg-dark dark-section
                  flex-none md:sticky md:top-16 md:h-[calc(100vh-4rem)] overflow-y-auto dark-scroll
                  border-r border-gold/15`}
    >
      <nav className="p-4 space-y-6">
        <div>
          <div className={groupLabel}>Workspace</div>
          <NavLink to="/demo/dashboard" className={linkClass} end>Dashboard</NavLink>
        </div>
        {MODEL_SECTIONS.map((s) => (
          <div key={s.title}>
            <div className={groupLabel}>{s.title}</div>
            <div className="space-y-1">
              {s.models.map((m) => (
                <NavLink key={m.id} to={`/demo/models/${m.slug}`} className={linkClass}>
                  <span className="truncate">{m.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className={groupLabel}>Test &amp; Learn</div>
          <div className="space-y-1">
            <NavLink to="/demo/test-and-learn/builder" className={linkClass}>A/B Test Builder</NavLink>
            <NavLink to="/demo/test-and-learn/tracker" className={linkClass}>Experiment Tracker</NavLink>
            <NavLink to="/demo/test-and-learn/holdouts" className={linkClass}>Holdout Manager</NavLink>
          </div>
        </div>
        <div>
          <div className={groupLabel}>Data</div>
          <NavLink to="/demo/data" className={linkClass}>Data Manager</NavLink>
        </div>
      </nav>
    </aside>
  );
}
