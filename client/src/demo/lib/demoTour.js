import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../../styles/driverjs-brand.css';

/**
 * Linear six-step tour for the Coast Analytics demo, with one
 * mid-flow page navigation (Step 3 -> Step 4 routes from /demo to
 * /demo/models/acv-forecast; Step 4 -> Step 5 routes back).
 *
 *   idx 0: Welcome modal              (no anchor, /demo)
 *   idx 1: KPI strip                  [data-tour-id="kpi-strip"]   (/demo)
 *   idx 2: Model sidebar              [data-tour-id="model-sidebar"]   (/demo)
 *   idx 3: Model config panel         [data-tour-id="model-config"]    (/demo/models/acv-forecast)
 *   idx 4: Next Best Action table     [data-tour-id="nba-table"]   (/demo)
 *   idx 5: Completion modal           (no anchor)
 *
 * State (two flags):
 *
 *   localStorage   ilm_demo_tour_completed   "true" when the tour is done
 *   sessionStorage ilm_tour_resume_at        step index to start at on the
 *                                            next route mount (for mid-flow
 *                                            page navigation)
 *
 * Driver.js cannot persist across route changes, so the steps that cross a
 * page boundary (3->4, 4->5, 4->3 back, 5->4 back) tear down the current
 * driver, set the resume flag, navigate, and rely on the route mount to
 * detect the flag and re-drive at the right index.
 */

const COMPLETED_KEY = 'ilm_demo_tour_completed';
const RESUME_KEY = 'ilm_tour_resume_at';

export function isTourCompleted() {
  try { return localStorage.getItem(COMPLETED_KEY) === 'true'; }
  catch { return false; }
}
export function markTourCompleted() {
  try { localStorage.setItem(COMPLETED_KEY, 'true'); }
  catch { /* incognito */ }
}
export function clearTourCompleted() {
  try { localStorage.removeItem(COMPLETED_KEY); }
  catch { /* incognito */ }
}

export function setTourResumeAt(stepIndex) {
  try { sessionStorage.setItem(RESUME_KEY, String(stepIndex)); }
  catch { /* incognito */ }
}
export function getTourResumeAt() {
  try {
    const v = sessionStorage.getItem(RESUME_KEY);
    return v == null ? null : Number(v);
  } catch { return null; }
}
export function clearTourResumeAt() {
  try { sessionStorage.removeItem(RESUME_KEY); }
  catch { /* incognito */ }
}

/**
 * Build the driver instance. Callbacks for cross-page navigation:
 *   onBookCall              navigate to /contact (completion CTA)
 *   onSidebarOpen           open the demo's left sidebar (used for Step 3
 *                           on mobile where the sidebar is hidden by default)
 *   onSeeModel              navigate to the Revenue / Folio Forecasting page
 *                           (Step 3 forward, Step 5 back)
 *   onReturnToDashboard     navigate back to /demo/dashboard
 *                           (Step 4 forward, Step 4 back)
 */
export function buildTour({ onBookCall, onSidebarOpen, onSeeModel, onReturnToDashboard }) {
  let driverObj;
  // When set, the onDestroyed hook will NOT mark the tour completed,
  // because this destroy is a mid-flow handoff to the next page.
  let isNavigating = false;

  const navigateAndResume = (resumeStepIndex, navigateFn) => {
    isNavigating = true;
    setTourResumeAt(resumeStepIndex);
    if (driverObj) driverObj.destroy();
    if (typeof navigateFn === 'function') navigateFn();
  };

  const endTour = () => {
    if (driverObj) driverObj.destroy();
  };

  // Append a secondary action button to the popover footer. Idempotent
  // because Driver.js can re-fire onPopoverRender on reposition.
  const injectSecondaryButton = (popover, label) => {
    if (!popover || !popover.footerButtons) return;
    if (popover.footerButtons.querySelector('.driver-skip-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.className = 'driver-popover-prev-btn driver-skip-btn';
    btn.addEventListener('click', endTour);
    popover.footerButtons.insertBefore(btn, popover.footerButtons.firstChild);
  };
  const injectSkipButton = (popover) => injectSecondaryButton(popover, 'Skip tour');

  driverObj = driver({
    overlayColor: 'rgba(58, 54, 53, 0.65)',
    smoothScroll: true,
    allowClose: true,
    showProgress: false,
    stagePadding: 6,
    stageRadius: 8,
    disableActiveInteraction: false,

    onDestroyed: () => {
      // Mid-flow page handoffs skip the completion mark; any other dismissal
      // path (Skip, X, overlay, Finish + Completion buttons) marks completed.
      if (!isNavigating) markTourCompleted();
    },

    steps: [
      // ─── Step 1 (idx 0): Welcome ───────────────────────────────────────
      {
        popover: {
          title: 'Welcome to Coast Analytics.',
          description:
            "You're looking at synthetic data for Cape Fear Hospitality Group, a fictional 9-property coastal North Carolina operator. The platform itself is real. Take a quick tour, or jump in and explore on your own.",
          showButtons: ['next', 'close'],
          nextBtnText: 'Take the tour',
          onPopoverRender: (popover) => injectSecondaryButton(popover, 'Skip and explore'),
        },
      },

      // ─── Step 2 (idx 1): KPI strip ─────────────────────────────────────
      {
        element: '[data-tour-id="kpi-strip"]',
        popover: {
          title: 'Your portfolio at a glance.',
          description:
            'Total guests, avg folio value, active loyalty members, at-risk count. Refreshed nightly across all 9 properties.',
          showButtons: ['next', 'close'],
          nextBtnText: 'Next',
          onPopoverRender: injectSkipButton,
        },
      },

      // ─── Step 3 (idx 2): Model sidebar ─────────────────────────────────
      // "See a model" hands off to the Revenue / Folio Forecasting page;
      // the resume flag tells the new page to start the tour at idx 3.
      {
        element: '[data-tour-id="model-sidebar"]',
        onHighlightStarted: () => {
          if (typeof onSidebarOpen === 'function') onSidebarOpen();
        },
        popover: {
          title: 'Thirteen predictive models, calibrated to your data.',
          description:
            'Churn risk, lifetime value, next best action, basket recommendations. Each model scores every guest in your portfolio, refreshed nightly.',
          showButtons: ['previous', 'next', 'close'],
          nextBtnText: 'See a model',
          prevBtnText: 'Back',
          onNextClick: () => navigateAndResume(3, onSeeModel),
          onPopoverRender: injectSkipButton,
        },
      },

      // ─── Step 4 (idx 3): Model config panel (model page) ───────────────
      // "Next" routes back to the dashboard and resumes at idx 4 (NBA).
      // "Back" routes back to the dashboard and resumes at idx 2 (sidebar).
      {
        element: '[data-tour-id="model-config"]',
        popover: {
          title: 'Configure and run a model.',
          description:
            'Every model has a configuration panel. Filter by property, loyalty tier, date range, or visit history. Run the model and see live predictions calibrated to your portfolio.',
          showButtons: ['previous', 'next', 'close'],
          nextBtnText: 'Next',
          prevBtnText: 'Back',
          onNextClick: () => navigateAndResume(4, onReturnToDashboard),
          onPrevClick: () => navigateAndResume(2, onReturnToDashboard),
          onPopoverRender: injectSkipButton,
        },
      },

      // ─── Step 5 (idx 4): Next Best Action ──────────────────────────────
      // "Back" routes back to the model page and resumes at idx 3.
      // "Finish tour" advances normally to the completion modal (idx 5).
      {
        element: '[data-tour-id="nba-table"]',
        popover: {
          title: 'What your team works on Monday.',
          description:
            'Every guest, ranked by next best action. Win-back, suite upgrade, spa cross-sell, VIP concierge invite. This is the list your CRM team executes against.',
          showButtons: ['previous', 'next', 'close'],
          nextBtnText: 'Finish tour',
          prevBtnText: 'Back',
          onPrevClick: () => navigateAndResume(3, onSeeModel),
        },
      },

      // ─── Step 6 (idx 5): Completion ────────────────────────────────────
      {
        popover: {
          title: "You've seen the basics.",
          description:
            "Click around freely. When you're ready to talk about your portfolio, book a call. We'll walk through your data together.",
          showButtons: ['next', 'close'],
          nextBtnText: 'Book a call',
          onNextClick: () => {
            markTourCompleted();
            if (driverObj) driverObj.destroy();
            if (typeof onBookCall === 'function') onBookCall();
          },
          onPopoverRender: (popover) => injectSecondaryButton(popover, 'Keep exploring'),
        },
      },
    ],
  });

  return driverObj;
}

/**
 * Build + drive, optionally starting at a step other than 0. Use cases:
 *   - Initial first-visit auto-start: startStep omitted (= 0)
 *   - Manual restart from the Tour nav item: startStep omitted (= 0)
 *   - Mid-flow resume after a route change: startStep = the resumed index
 */
export function startTour({ onBookCall, onSidebarOpen, onSeeModel, onReturnToDashboard, startStep = 0 }) {
  const t = buildTour({ onBookCall, onSidebarOpen, onSeeModel, onReturnToDashboard });
  // Defer to the next frame so any prior destroy() settles before drive().
  requestAnimationFrame(() => t.drive(startStep));
  return t;
}
