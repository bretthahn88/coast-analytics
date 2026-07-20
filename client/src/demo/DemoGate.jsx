import { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { Logo } from '../components/Logo.jsx';

/**
 * Full-screen, non-dismissible gate that runs in front of the demo.
 *
 *   - First Name + Email required, Company optional
 *   - On submit, POST /api/gate/subscribe (Klaviyo + SQLite fallback)
 *   - The route always returns success unless validation fails, so a flaky
 *     third-party never locks the user out of the demo
 *   - On success, parent sets ilp_demo_unlocked=true and unmounts the gate
 *   - There is no X, no skip, no escape (by design)
 */
export const ILP_DEMO_UNLOCKED_KEY = 'ilp_demo_unlocked';

export function DemoGate({ onUnlocked }) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const firstFieldRef = useRef(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!firstName.trim()) { setErrorMsg('First name is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/gate/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim().toLowerCase(),
          companyName: companyName.trim(),
        }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok || body?.success === false) {
        setErrorMsg(body?.error || 'Something went wrong. Please try again.');
        setBusy(false);
        return;
      }
      try { localStorage.setItem(ILP_DEMO_UNLOCKED_KEY, 'true'); } catch { /* incognito */ }
      onUnlocked?.();
    } catch (e2) {
      console.error('[gate] submit failed:', e2);
      try { localStorage.setItem(ILP_DEMO_UNLOCKED_KEY, 'true'); } catch { /* incognito */ }
      onUnlocked?.();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ilp-gate-headline"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 dark-section"
      style={{
        background: '#1a1a1a',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        className="w-full max-w-[480px] rounded-[12px] relative"
        style={{
          background: '#238287',
          borderTop: '3px solid #BC7526',
          padding: '48px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        }}
      >
        <div className="flex justify-center mb-6">
          <Logo tone="on-dark" withWordmark={false} size={56} />
        </div>

        <div
          className="text-center mb-2"
          style={{
            color: '#BC7526',
            fontSize: 10,
            letterSpacing: '0.15em',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          Coast Analytics
        </div>

        <h1
          id="ilp-gate-headline"
          className="text-center"
          style={{
            color: '#E9DDD5',
            fontFamily: 'Poppins, system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 34,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            marginBottom: 14,
          }}
        >
          See it before you book a call.
        </h1>

        <p
          className="text-center"
          style={{
            color: '#BC7526',
            fontFamily: 'Poppins, system-ui, sans-serif',
            fontStyle: 'italic',
            fontSize: 17,
            lineHeight: 1.45,
            marginBottom: 32,
          }}
        >
          Live demo. Realistic hospitality data. No sales pitch required.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <Field
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Your first name"
            inputRef={firstFieldRef}
            required
          />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourcompany.com"
            required
          />
          <Field
            label="Company"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Where do you work?"
          />

          {errorMsg && (
            <div
              role="alert"
              style={{
                color: '#E9DDD5',
                background: 'rgba(168,50,50,0.20)',
                border: '1px solid rgba(168,50,50,0.5)',
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 14,
              }}
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full"
            style={{
              background: busy ? '#99C0BF' : '#BC7526',
              color: '#E9DDD5',
              fontFamily: 'Poppins, system-ui, sans-serif',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              fontSize: 13,
              borderRadius: 6,
              padding: '14px 24px',
              transition: 'background 0.2s ease',
              cursor: busy ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 8,
            }}
          >
            {busy ? (
              <>
                <span
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid currentColor',
                    borderRightColor: 'transparent',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Unlocking demo...
              </>
            ) : (
              <>
                <Lock size={14} />
                Access the Demo
              </>
            )}
          </button>

          <p
            className="text-center"
            style={{
              color: 'rgba(245,240,232,0.45)',
              fontSize: 12,
              lineHeight: 1.5,
              marginTop: 16,
            }}
          >
            Your information is shared only with Oak Island AI.
            <br />
            No spam, ever.
          </p>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Field({ label, inputRef, required, type = 'text', value, onChange, placeholder }) {
  return (
    <label className="block">
      <span
        className="block"
        style={{
          color: '#E9DDD5',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}{required && <span style={{ color: '#BC7526' }}> *</span>}
      </span>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={type === 'email' ? 'email' : 'off'}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(188,117,38,0.35)',
          color: '#E9DDD5',
          borderRadius: 6,
          padding: '12px 14px',
          fontFamily: 'Poppins, system-ui, sans-serif',
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.2s ease',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#BC7526'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(188,117,38,0.35)'; }}
      />
    </label>
  );
}

export function isDemoUnlocked() {
  try { return localStorage.getItem(ILP_DEMO_UNLOCKED_KEY) === 'true'; }
  catch { return false; }
}
