import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { IMAGES } from '../constants/assets'


export function ContestPage() {
  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased flex flex-col justify-between">
      <AppHeader />

      <main className="w-full flex-grow">
        {/* ── HERO BANNER ── */}
        <section className="relative w-full overflow-hidden bg-primary-container text-on-primary py-16 sm:py-24 flex items-center justify-center">
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url('${IMAGES.pineForestAerial}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary-container/85 to-background" />

          <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-12 flex flex-col items-center text-center">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-5">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse flex-shrink-0" />
              <span className="font-label-sm text-xs uppercase tracking-widest text-primary-fixed font-semibold">
                IEEE CSTF Environmental Contests 2026
              </span>
            </div>

            <h1 className="font-display-hero text-3xl sm:text-5xl md:text-6xl leading-tight font-extrabold text-white max-w-4xl tracking-tight mb-4 uppercase drop-shadow-sm">
              IEEE YP Green Legacy Photo Contest
            </h1>

            <p className="font-headline-sm text-base sm:text-xl text-surface-container-high max-w-2xl mb-8 font-normal opacity-95 leading-relaxed">
              Capture the beauty of trees, forests, and green spaces around you. Submit geotagged photographs and earn
              IEEE-certified recognition for your ecological documentation.
            </p>

            {/* CTA Button */}
            <button
              type="button"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-secondary-container text-on-secondary-container font-label-md text-base font-extrabold shadow-xl cursor-not-allowed opacity-90 select-none"
              disabled
            >
              <span className="material-symbols-outlined text-[22px]">hourglass_top</span>
              <span>Applications Opening Soon</span>
            </button>
            <p className="mt-3 text-xs text-white/60 font-mono tracking-wide">
              Registration portal will open shortly — stay tuned
            </p>
          </div>
        </section>

        {/* ── ABOUT THE CONTEST ── */}
        <section className="w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-14">
          <div className="flex flex-col items-start mb-8">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <span className="w-1.5 h-4 bg-secondary rounded-full flex-shrink-0" />
              <span className="font-label-sm text-xs text-secondary tracking-widest uppercase font-semibold">
                ABOUT THE CONTEST
              </span>
            </div>
            <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary tracking-tight mb-3">
              Eco-Photography for a Verified Green Future
            </h2>
            <p className="font-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
              The IEEE YP Green Legacy Photo Contest invites students, researchers, and environmental enthusiasts to photograph and
              geolocate trees, forests, urban green corridors, and endangered botanical sites. Every accepted entry
              contributes to the IEEE YP Green Legacy public registry — a tamper-evident, satellite-verifiable ecological database
              backed by IEEE Young Professionals Climate &amp; Sustainability Taskforce (CSTF).
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { icon: 'photo_camera', label: 'Photography', value: 'Open to All' },
              { icon: 'gps_fixed', label: 'Geotagged', value: 'EXIF Verified' },
              { icon: 'workspace_premium', label: 'Prize', value: 'IEEE Certificate' },
              { icon: 'groups', label: 'Eligibility', value: 'All Members' },
            ].map((feat) => (
              <div
                key={feat.label}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-4 flex flex-col items-center text-center shadow-xs"
              >
                <span className="material-symbols-outlined text-secondary text-[28px] mb-2">{feat.icon}</span>
                <span className="text-[10px] uppercase tracking-wider text-outline font-semibold">{feat.label}</span>
                <span className="text-sm font-bold text-primary mt-0.5">{feat.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── CONTEST INSTRUCTIONS ── */}
        <section className="w-full max-w-[1280px] mx-auto px-6 lg:px-12 pb-14">
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant/40 p-6 sm:p-10">
            <div className="flex flex-col items-start mb-8">
              <div className="inline-flex items-center gap-2.5 mb-3">
                <span className="w-1.5 h-4 bg-secondary rounded-full flex-shrink-0" />
                <span className="font-label-sm text-xs text-secondary tracking-widest uppercase font-semibold">
                  HOW TO PARTICIPATE
                </span>
              </div>
              <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                Contest Instructions &amp; Rules
              </h2>
            </div>

            <ol className="space-y-4 list-none">
              {[
                { num: '1', title: 'Original Photography Only', body: 'Photographs must be your own originals — no stock images, AI-generated visuals, or heavy edits.' },
                { num: '2', title: 'GNSS Geotagging Required', body: 'Every photo must carry embedded EXIF GPS data accurate to within 5.0 m, corresponding to a real tree or green space.' },
                { num: '3', title: 'Submission Limit', body: 'Up to 5 photographs per participant per contest cycle, submitted through the IEEE YP Green Legacy portal once open.' },
                { num: '4', title: 'Verification & Judging', body: 'Entries are reviewed by the IEEE YP CSTF panel for authenticity, ecological relevance, and photographic quality.' },
                { num: '5', title: 'Awards & Recognition', body: 'Winners receive IEEE-signed digital certificates and are featured in the IEEE YP Green Legacy global registry.' },
                { num: '6', title: 'Eligibility', body: 'Open to all registered IEEE YP Green Legacy users. IEEE student and Young Professional members receive priority recognition.' },
              ].map((rule) => (
                <li key={rule.num} className="flex items-start gap-4 py-3 border-b border-outline-variant/30 last:border-0">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary text-white text-xs font-extrabold flex items-center justify-center mt-0.5">
                    {rule.num}
                  </span>
                  <div>
                    <span className="font-bold text-sm text-primary">{rule.title}</span>
                    <span className="text-on-surface-variant text-sm"> — {rule.body}</span>
                  </div>
                </li>
              ))}
            </ol>

            {/* Apply button */}
            <div className="mt-10 flex flex-col items-center text-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2.5 px-10 py-4 rounded-xl bg-primary text-white font-label-md text-base font-extrabold shadow-xl cursor-not-allowed opacity-75 select-none"
                disabled
              >
                <span className="material-symbols-outlined text-[22px]">lock_clock</span>
                <span>Applications Open Soon</span>
              </button>
              <p className="text-xs text-on-surface-variant font-mono">
                The submission portal will go live when contest applications open. Check back here for updates.
              </p>
            </div>
          </div>
        </section>

        {/* ── MORE CONTESTS COMING SOON ── */}
        <section className="w-full max-w-[1280px] mx-auto px-6 lg:px-12 pb-20">
          <div className="flex flex-col items-start mb-8">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <span className="w-1.5 h-4 bg-secondary rounded-full flex-shrink-0" />
              <span className="font-label-sm text-xs text-secondary tracking-widest uppercase font-semibold">
                UPCOMING CHALLENGES
              </span>
            </div>
            <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary tracking-tight mb-2">
              More Contests Coming
            </h2>
            <p className="font-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              This is just the beginning. More exciting contests and community challenges are being planned by the IEEE
              CSTF team. Stay tuned and register early to be the first to know.
            </p>
          </div>

          <ul className="space-y-2 text-sm text-on-surface-variant">
            {[
              { title: 'Adopt-a-Tree Caregiver Challenge', when: 'Coming Q1 2027' },
              { title: 'Urban Campus Mapathon Sprint', when: 'Coming Q2 2027' },
              { title: 'Endangered Flora Discovery Expedition', when: 'Coming Q2 2027' },
              { title: 'Community Plantation & Stewardship Cup', when: 'Coming Q3 2027' },
            ].map((c) => (
              <li key={c.title} className="flex items-center gap-3 py-2 border-b border-outline-variant/20 last:border-0">
                <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                <span className="font-semibold text-primary">{c.title}</span>
                <span className="ml-auto text-[11px] font-mono text-outline flex-shrink-0">{c.when}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <AppFooter />
    </div>
  )
}

