import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { IMAGES, SITE_NAME } from '../constants/assets'
import { fetchPublicStatsApi, fetchTrees } from '../services/api'
import { ActivityIdeasCanvas } from '../components/home/ActivityIdeasCanvas'

export function HomePage() {
  const [taggedTotal, setTaggedTotal] = useState(0)

  useEffect(() => {
    // Only verified trees should be labelled as tagged
    void fetchPublicStatsApi()
      .then((stats) => {
        setTaggedTotal(stats.verifiedTrees)
      })
      .catch(() => {
        void fetchTrees({ limit: 1, status: 'VERIFIED' })
          .then((response) => setTaggedTotal(response.total))
          .catch((error) => console.error('[Tree totals unavailable]', error))
      })
  }, [])

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased flex flex-col justify-between">
      <AppHeader />

      <main className="w-full flex-grow">
        {/* 2. HERO SECTION */}
        <section
          id="mission"
          className="relative w-full overflow-hidden bg-primary-container text-on-primary min-h-[640px] flex items-center justify-center"
        >
          {/* Full-Bleed Misty Canopy Background with Natural Foliage Gradient */}
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 ease-out scale-105"
            style={{ backgroundImage: `url('${IMAGES.heroForest}')` }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(3, 33, 24, 0.88) 0%, rgba(9, 48, 36, 0.74) 38%, rgba(17, 74, 55, 0.62) 68%, #f4fbf4 100%)',
            }}
          />
          <div className="absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

          {/* Hero Content Container */}
          <div className="relative z-10 max-w-[1280px] mx-auto px-grid-margin-mobile lg:px-grid-margin-desktop pt-24 pb-spacing-3xl flex flex-col items-center text-center">
            {/* Main Headline */}
            <h1 className="font-display-hero text-3xl sm:text-5xl md:text-[56px] leading-tight md:leading-[64px] text-on-primary max-w-4xl tracking-tight mb-spacing-md uppercase drop-shadow-sm font-bold">
              SEEDING THE FUTURE, ONE TREE AT A TIME.
            </h1>

            {/* Sub-headline */}
            <p className="font-headline-sm text-lg sm:text-[22px] text-surface-container-high max-w-xl mb-spacing-2xl font-normal opacity-95">
              {SITE_NAME} — nature&apos;s digital registry for verifiable tree stewardship.
            </p>

            {/* Dynamic Interactive Telemetry Action Center */}
            <div className="flex flex-col sm:flex-row items-center gap-spacing-md p-1.5 bg-surface-bright/10 backdrop-blur-xl rounded-xl shadow-xl border border-white/10">
              {/* Live Counter Pill */}
              <div className="flex items-center gap-spacing-sm px-spacing-lg py-2.5 bg-primary/60 rounded-lg">
                <span className="material-symbols-outlined text-secondary-fixed text-[20px]">forest</span>
                <span className="font-body-md text-body-md text-on-primary font-medium">Trees tagged:</span>
                <span className="font-mono-metric text-mono-metric text-secondary-fixed font-bold tracking-tight">
                  {taggedTotal.toLocaleString()}
                </span>
              </div>
              {/* CTA Buttons */}
              <Link
                to="/map"
                className="inline-flex items-center gap-2 px-spacing-lg py-2.5 bg-secondary-container hover:bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span>View Live Map</span>
              </Link>
              <Link
                to="/capture"
                className="inline-flex items-center gap-2 px-spacing-lg py-2.5 bg-primary hover:bg-secondary text-on-primary font-label-md text-label-md rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                <span>Capture Tree</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 5. SERVICES SECTION */}
        <section
          className="w-full max-w-[1280px] mx-auto px-grid-margin-mobile lg:px-grid-margin-desktop py-spacing-3xl"
          id="services"
        >
          <div className="flex flex-col items-start mb-spacing-2xl">
            <div className="section-badge inline-flex items-center gap-2.5 mb-spacing-sm">
              <span className="section-badge-bar w-1.5 h-4 bg-secondary rounded-full flex-shrink-0" />
              <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase font-semibold">
                OUR SERVICES
              </span>
            </div>
            <h2 className="font-headline-lg text-3xl sm:text-4xl text-primary tracking-tight font-bold max-w-2xl leading-snug">
              Precision telemetry meet scalable ecological restoration.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-2">
              Modular, auditable services tailored to corporate sustainability, verified registry credits, and community stewardship.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg">
            <div className="bg-surface-container-lowest p-spacing-xl rounded-xl border border-outline-variant/60 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-secondary-container/40 text-secondary flex items-center justify-center mb-spacing-md">
                  <span className="material-symbols-outlined text-[26px]">corporate_fare</span>
                </div>
                <h3 className="font-headline-sm text-xl font-bold text-primary mb-spacing-xs">Corporate Social Responsibility</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Tech-integrated, transparent CSR projects with national NGO networks and verified ecological partners.
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-spacing-xl rounded-xl border border-outline-variant/60 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-secondary-container/40 text-secondary flex items-center justify-center mb-spacing-md">
                  <span className="material-symbols-outlined text-[26px]">trending_up</span>
                </div>
                <h3 className="font-headline-sm text-xl font-bold text-primary mb-spacing-xs">Carbon Credit</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Lucrative investments in reducing carbon footprints to increase company valuation.
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-spacing-xl rounded-xl border border-outline-variant/60 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-secondary-container/40 text-secondary flex items-center justify-center mb-spacing-md">
                  <span className="material-symbols-outlined text-[26px]">architecture</span>
                </div>
                <h3 className="font-headline-sm text-xl font-bold text-primary mb-spacing-xs">Custom Models</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Creative freedom to build custom environmental projects that align with your long-term organizational goals.
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-spacing-xl rounded-xl border border-outline-variant/60 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-secondary-container/40 text-secondary flex items-center justify-center mb-spacing-md">
                  <span className="material-symbols-outlined text-[26px]">park</span>
                </div>
                <div className="flex items-center justify-between mb-spacing-xs">
                  <h3 className="font-headline-sm text-xl font-bold text-primary">Natural Economic Zones</h3>
                  <span className="text-[10px] font-label-sm uppercase tracking-wider text-outline px-2 py-0.5 bg-surface-container rounded">
                    Oxy Parks
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Designing, curating, and building exclusive green spaces like Oxy parks and workation areas.
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-spacing-xl rounded-xl border border-outline-variant/60 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-secondary-container/40 text-secondary flex items-center justify-center mb-spacing-md">
                  <span className="material-symbols-outlined text-[26px]">school</span>
                </div>
                <h3 className="font-headline-sm text-xl font-bold text-primary mb-spacing-xs">Student Engagement</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  A platform for students to participate in plantation drives, complete with evaluation tools for educators.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. PARTNERS SECTION */}
        <section className="w-full max-w-[1280px] mx-auto px-grid-margin-mobile lg:px-grid-margin-desktop py-spacing-2xl">
          <div className="bg-surface-container-low p-spacing-xl rounded-2xl border border-outline-variant/40">
            <div className="flex items-center justify-between mb-spacing-lg">
              <h3 className="font-headline-sm text-xl font-bold text-primary">Our Partners</h3>
              <span className="font-label-sm text-[11px] text-outline uppercase tracking-wider font-semibold">
                NGOS &amp; RESEARCH ALLIANCES
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-spacing-sm">
              {[
                { name: 'EcoAlliance', desc: 'Agroecology Alliance', icon: 'groups' },
                { name: 'ClimateNet', desc: 'Climate Resilience', icon: 'energy_savings_leaf' },
                { name: 'GreenEarth', desc: 'Restoration Collective', icon: 'language' },
                { name: 'EcoForest Inst.', desc: 'Taxonomy & Audit', icon: 'forest' },
              ].map((p) => (
                <div
                  key={p.name}
                  className="bg-surface-container-lowest p-spacing-md rounded-lg shadow-xs flex items-center gap-3 border border-surface-variant"
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary-container/60 text-secondary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{p.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-sm font-bold text-primary">{p.name}</span>
                    <span className="font-body-sm text-[11px] text-on-surface-variant">{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. SOCIETAL FOOTPRINT SECTION */}
        <section
          className="w-full max-w-[1280px] mx-auto px-grid-margin-mobile lg:px-grid-margin-desktop py-spacing-3xl"
          id="footprint"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-spacing-2xl items-center">
            {/* Left: Activity Ideas Canvas with Horizontal Scroll Wheel */}
            <div className="lg:col-span-6 relative w-full">
              <ActivityIdeasCanvas />
            </div>

            {/* Right: Narrative */}
            <div className="lg:col-span-6 flex flex-col items-start">
              <div className="section-badge inline-flex items-center gap-2.5 mb-spacing-sm">
                <span className="section-badge-bar w-1.5 h-4 bg-secondary rounded-full flex-shrink-0" />
                <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase font-semibold">
                  SOCIETAL FOOTPRINT
                </span>
              </div>
              <h2 className="font-headline-lg text-3xl sm:text-4xl text-primary tracking-tight font-bold leading-tight mb-spacing-md">
                Grassroots engagement empowering schools, elder-care, and care sanctuaries.
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-spacing-xl">
                {SITE_NAME} aspires to create a nature-conscious community. The publicly sponsored trees in our system
                are planted in the premises of social service institutions, like schools, colleges, old-age homes,
                orphanages, and rehabilitation centres. Through our enterprise, we aspire to help businesses and
                individuals make nature-conscious decisions.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-md w-full">
                <div className="bg-surface-container-low p-spacing-md rounded-xl border border-outline-variant/40">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <span className="material-symbols-outlined text-[20px] text-secondary">school</span>
                    <h4 className="font-label-md text-sm font-bold">Schools &amp; Colleges</h4>
                  </div>
                  <p className="font-body-sm text-[13px] text-on-surface-variant leading-snug">
                    Hands-on ecology education, student tree tracking stewardship, and micro-climate school greening.
                  </p>
                </div>
                <div className="bg-surface-container-low p-spacing-md rounded-xl border border-outline-variant/40">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <span className="material-symbols-outlined text-[20px] text-secondary">healing</span>
                    <h4 className="font-label-md text-sm font-bold">Care &amp; Rehabilitation</h4>
                  </div>
                  <p className="font-body-sm text-[13px] text-on-surface-variant leading-snug">
                    Therapeutic botanical groves for wellness, shaded leisure paths, and restorative elder-care spaces.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. AFFORESTATION REGISTRY & TELEMETRY CTA */}
        <section
          className="w-full text-white pt-28 pb-24 px-grid-margin-mobile lg:px-grid-margin-desktop relative overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, #f4fbf4 0%, #e2efe5 14%, #73b392 32%, #18543f 56%, #0b3224 78%, #041d14 100%)',
          }}
        >
          {/* Subtle Organic Canopy Sunlight Glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30 select-none z-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(162, 240, 204, 0.3) 0%, transparent 70%)',
            }}
          />

          <div className="max-w-[1280px] mx-auto flex flex-col items-center text-center relative z-10">
            <h2 className="font-display-hero text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-spacing-md text-white">
              Accelerating Global Afforestation
            </h2>
            <p className="font-headline-sm text-lg sm:text-xl text-surface-container-high max-w-2xl mb-spacing-2xl font-normal opacity-90 leading-relaxed">
              Explore tamper-evident tree audits, verify canopy biomass telemetry via Sentinel-2, or submit real-time GPS field captures today.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/map"
                className="bg-white hover:bg-surface-container-low text-primary font-label-md text-base px-8 py-3.5 rounded-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2 font-bold cursor-pointer"
              >
                <span>Explore Live Map</span>
                <span className="material-symbols-outlined text-[20px]">explore</span>
              </Link>
              <Link
                to="/capture"
                className="bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-base px-8 py-3.5 rounded-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2 font-bold cursor-pointer"
              >
                <span>Capture New Tree</span>
                <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
              </Link>
            </div>

            <div className="mt-spacing-2xl flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm text-surface-container-high font-body-sm opacity-85">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-fixed text-[16px]">check_circle</span>
                <span>Sub-meter multi-reading GNSS verification</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-fixed text-[16px]">check_circle</span>
                <span>Full regulatory &amp; ESG documentation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-fixed text-[16px]">check_circle</span>
                <span>Open telemetry &amp; public audit trail</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  )
}
