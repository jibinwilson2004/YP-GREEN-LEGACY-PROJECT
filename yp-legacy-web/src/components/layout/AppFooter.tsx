import { Link } from 'react-router-dom'
import { SITE_NAME } from '../../constants/assets'

export function AppFooter(_props?: { dark?: boolean }) {
  return (
    <footer className="site-footer w-full bg-[#0a2118] text-white border-t border-[#184a68]/40 font-sans" id="footer">
      <div id="footer-inner">
        <div id="footer-widgets">
          <div className="footer-widgets-inner max-w-[1240px] mx-auto px-grid-margin-mobile lg:px-grid-margin-desktop pt-12 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary text-white flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[20px]">forest</span>
                  </div>
                  <span className="font-headline-sm text-xl font-bold text-white tracking-tight">{SITE_NAME}</span>
                </div>
                <p className="text-xs text-white/70 max-w-lg leading-relaxed">
                  Industrial-grade afforestation telemetry &amp; GIS registry partnered with IEEE Young Professionals Climate &amp; Sustainability Taskforce (CSTF).
                </p>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">Stay connected</h2>
                <div className="flex items-center gap-3 text-white/80">
                  <a aria-label="LinkedIn" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 hover:text-white flex items-center justify-center transition-colors" href="https://www.linkedin.com/company/ieee" target="_blank" rel="noreferrer">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                  </a>
                  <a aria-label="Twitter / X" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 hover:text-white flex items-center justify-center transition-colors" href="https://twitter.com/IEEEorg" target="_blank" rel="noreferrer">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                  <a aria-label="Facebook" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 hover:text-white flex items-center justify-center transition-colors" href="https://www.facebook.com/IEEE.org/" target="_blank" rel="noreferrer">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </a>
                  <a aria-label="YouTube" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 hover:text-white flex items-center justify-center transition-colors" href="https://www.youtube.com/user/IEEEorg" target="_blank" rel="noreferrer">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                  </a>
                </div>
              </div>
            </div>

            <section className="footer-section pt-8">
              <ul className="footer-links flex flex-wrap list-none p-0 m-0 gap-x-6 gap-y-3 text-[14px]">
                <li><Link className="text-white/90 hover:text-secondary-fixed transition-colors" to="/">Home</Link></li>
                <li><a className="text-white/90 hover:text-secondary-fixed transition-colors" href="https://yp.ieee.org/" target="_blank" rel="noreferrer">IEEE YP Home</a></li>
                <li><a className="text-white/90 hover:text-secondary-fixed transition-colors" href="https://www.ieee.org/sitemap.html" target="_blank" rel="noreferrer">Sitemap</a></li>
                <li><a className="text-white/90 hover:text-secondary-fixed transition-colors" href="https://yp.ieee.org/contact-us/" target="_blank" rel="noreferrer">Contact &amp; Support</a></li>
                <li><a className="text-white/90 hover:text-secondary-fixed transition-colors" href="https://www.ieee.org/accessibility-statement.html" target="_blank" rel="noreferrer">Accessibility</a></li>
                <li><a className="text-white/90 hover:text-secondary-fixed transition-colors" href="https://www.ieee.org/about/corporate/governance/p9-26.html" target="_blank" rel="noreferrer">Nondiscrimination Policy</a></li>
                <li><a className="text-white/90 hover:text-secondary-fixed transition-colors" href="https://secure.ethicspoint.com/domain/media/en/gui/20410/index.html" target="_blank" rel="noreferrer">IEEE Ethics Reporting</a></li>
                <li><a className="text-white/90 hover:text-secondary-fixed transition-colors" href="https://www.ieee.org/security-privacy.html" target="_blank" rel="noreferrer">IEEE Privacy Policy</a></li>
                <li><a className="text-white/90 hover:text-secondary-fixed transition-colors" href="https://www.ieee.org/about/help/site-terms-conditions.html" target="_blank" rel="noreferrer">Terms</a></li>
                <li><a className="text-white/90 hover:text-secondary-fixed transition-colors" href="https://www.ieee.org/about/feedback-ieee-site.html" target="_blank" rel="noreferrer">Feedback</a></li>
              </ul>
              <p className="footer-copyright max-w-[1000px] mt-8 text-[13px] leading-relaxed text-[#cbd5e1]">
                © Copyright {new Date().getFullYear()} IEEE – All rights reserved. A public charity, IEEE is the world’s largest technical professional organization dedicated to advancing technology for the benefit of humanity. Developed in partnership with IEEE YP Green Legacy Precision Afforestation Telemetry Engine.
              </p>
            </section>
          </div>
        </div>
      </div>
    </footer>
  )
}
