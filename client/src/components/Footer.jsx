import { Link } from 'react-router-dom';

const OAI_SITE = 'https://oak-island-ai.vercel.app/consultation';
const OAI_TOOL_PAGE = 'https://oak-island-ai.vercel.app/consultation';
export function Footer() {
  return (
    <footer className="bg-dark dark-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-start gap-4">
            <img
              src="/images/OAI_logo_footer.png"
              alt="Oak Island AI"
              style={{ width: 96, height: 'auto', display: 'block', flex: 'none' }}
            />
            <div className="pt-1">
              <div
                style={{
                  color: '#E9DDD5',
                  fontFamily: 'Poppins, system-ui, sans-serif',
                  fontWeight: 600,
                  fontSize: 18,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.15,
                }}
              >
                Coast
                <br />
                Analytics
              </div>
            </div>
          </div>
          <p className="mt-5 text-on-dark text-[15px] leading-[1.7] max-w-sm">
            Predictive intelligence and test/learn infrastructure for multi-property hospitality groups,
            built and operated by Oak Island AI.
          </p>
        </div>

        <div className="md:flex md:justify-center">
          <div>
            <div className="eyebrow mb-3">Platform</div>
            <ul className="space-y-2 text-[14px]">
              <li><Link to="/" className="text-cream/70 hover:text-gold transition-colors">Home</Link></li>
              <li><Link to="/demo" className="text-cream/70 hover:text-gold transition-colors">Live Demo</Link></li>
              <li><Link to="/about" className="text-cream/70 hover:text-gold transition-colors">About</Link></li>
              <li><Link to="/pricing" className="text-cream/70 hover:text-gold transition-colors">Pricing</Link></li>
              <li><Link to="/blog" className="text-cream/70 hover:text-gold transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="text-cream/70 hover:text-gold transition-colors">Contact</Link></li>
            </ul>
            <div className="mt-5 text-[14px]" style={{ color: 'rgba(245,240,232,0.7)' }}>
              <Link to="/contact" className="hover:text-gold transition-colors">
                Book a consultation
              </Link>
            </div>
          </div>
        </div>

        <div className="md:text-right">
          <div className="eyebrow mb-3">Built by</div>
          <p className="text-cream font-bold text-lg leading-tight mb-1">Oak Island AI</p>
          <p className="text-on-dark text-[15px] mb-3">
            Strategic marketing for hospitality, retail, and small business operators.
          </p>
          <a
            href={OAI_SITE}
            target="_blank"
            rel="noreferrer noopener"
            className="text-gold hover:text-cream transition-colors text-[15px]"
          >
            oakislandmarketing.com
          </a>
          <div className="mt-2">
            <a
              href={OAI_TOOL_PAGE}
              target="_blank"
              rel="noreferrer noopener"
              className="text-cream/70 hover:text-gold transition-colors text-[13px]"
            >
              About this tool on OAI
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-center"
             style={{ color: 'rgba(245,240,232,0.45)', fontSize: 13 }}>
          © {new Date().getFullYear()} Oak Island AI. Cape Fear Hospitality Group is a fictional demo client. All demo data is synthetic.
        </div>
      </div>
    </footer>
  );
}
