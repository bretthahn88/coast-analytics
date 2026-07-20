import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo.jsx';

/**
 * Sticky marketing nav. Sage background (#99C0BF, brand-sage), with charcoal
 * link text so we meet WCAG AA contrast (~5.8:1) on the sage band. Active
 * link gets a rust underline. The BOOK A CALL button stays charcoal-on-rust
 * via the .btn-nav-cta class.
 *
 * Cream link text on sage was tried and rejected, contrast ~2.0:1 falls
 * short of AA.
 */
export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const linkClass = ({ isActive }) =>
    `px-3 py-2 text-[14px] transition-colors ${
      isActive
        ? 'font-bold text-charcoal border-b-2 border-rust'
        : 'text-charcoal/80 hover:text-charcoal'
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `block px-4 py-3 text-[15px] border-b border-charcoal/15 transition-colors ${
      isActive ? 'font-bold text-charcoal bg-charcoal/5' : 'text-charcoal hover:bg-charcoal/5'
    }`;

  return (
    <header
      className="sticky top-0 z-30 border-b border-charcoal/15"
      style={{ background: '#99C0BF' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center"><Logo tone="on-sage" /></Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={linkClass} end>Home</NavLink>
          <NavLink to="/demo" className={linkClass}>Live Demo</NavLink>
          <NavLink to="/about" className={linkClass}>About</NavLink>
          <NavLink to="/pricing" className={linkClass}>Pricing</NavLink>
          <NavLink to="/blog" className={linkClass}>Blog</NavLink>
          <NavLink to="/contact" className={linkClass}>Contact</NavLink>
        </nav>

        <Link to="/contact" className="hidden md:inline-flex btn-nav-cta">
          Book a Call
        </Link>

        <button
          onClick={() => setOpen((s) => !s)}
          className="md:hidden p-2 -mr-2 text-charcoal hover:bg-charcoal/10 rounded-md transition-colors"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-charcoal/15" style={{ background: '#99C0BF' }}>
          <NavLink to="/"        className={mobileLinkClass} end>Home</NavLink>
          <NavLink to="/demo"    className={mobileLinkClass}>Live Demo</NavLink>
          <NavLink to="/about"   className={mobileLinkClass}>About</NavLink>
          <NavLink to="/pricing" className={mobileLinkClass}>Pricing</NavLink>
          <NavLink to="/blog"    className={mobileLinkClass}>Blog</NavLink>
          <NavLink to="/contact" className={mobileLinkClass}>Contact</NavLink>
          <div className="px-4 py-4 border-b border-charcoal/15">
            <Link to="/contact" className="btn-nav-cta w-full justify-center inline-flex">
              Book a Call
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
