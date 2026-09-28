import { useRef, useState, useEffect } from 'react'
import { IMAGES } from '../../constants/assets'

export interface ActivityIdea {
  id: string
  title: string
  shortLabel: string
  subtitle: string
  category: string
  description: string
  node: string
  status: string
  image: string
  icon: string
  stats: string
  gradient: string
}

export const ACTIVITY_IDEAS: ActivityIdea[] = [
  {
    id: 'adopt-a-tree',
    title: '“Adopt a Tree” Challenge',
    shortLabel: 'Adopt a Tree',
    subtitle: 'Student Caregiver Program',
    category: 'COMMUNITY CHALLENGE',
    description: 'Students adopt individual saplings, log growth telemetry via QR badges, and track carbon absorption milestones across seasons.',
    node: 'Sector 08 Public School District',
    status: 'Active Challenge',
    image: IMAGES.activityAdoptTree,
    icon: 'emoji_events',
    stats: '1,420+ Saplings Adopted',
    gradient: 'from-emerald-900/80 via-black/40 to-transparent',
  },
  {
    id: 'tree-mapping-workshop',
    title: 'Tree Mapping Workshop',
    shortLabel: 'Mapping Workshop',
    subtitle: 'Field Telemetry & Caliper Training',
    category: 'HANDS-ON WORKSHOP',
    description: 'Outdoor training sessions where youth and community volunteers learn tree coordinates logging, canopy crown diameter, and sub-meter GNSS capture.',
    node: 'Urban Botanical Field Lab',
    status: 'Live Training',
    image: IMAGES.activityMappingWorkshop,
    icon: 'pin_drop',
    stats: '38 Sessions Completed',
    gradient: 'from-teal-950/80 via-black/40 to-transparent',
  },
  {
    id: 'organize-mapathon',
    title: 'Organize Mapathon',
    shortLabel: 'Organize Mapathon',
    subtitle: 'Crowdsourced Urban Canopy Sprints',
    category: 'CIVIC SPRINT EVENT',
    description: 'Collaborative hackathons bringing students and tech volunteers together with satellite imagery to detect urban heat islands and register tree voids.',
    node: 'Metropolitan Civic Eco-Hub',
    status: 'Collaborative Sprint',
    image: IMAGES.activityOrganizeMapathon,
    icon: 'travel_explore',
    stats: '12,800+ Canopy Points',
    gradient: 'from-sky-950/80 via-black/40 to-transparent',
  },
  {
    id: 'community-plantation-pledge',
    title: 'Community Plantation + Stewardship Pledge',
    shortLabel: 'Plantation & Pledge',
    subtitle: 'Intergenerational Eco Covenant',
    category: 'STEWARDSHIP DRIVE',
    description: 'United planting drives pairing school children with senior citizens to plant native trees and sign multi-year caretaking covenants.',
    node: 'Heritage Community Sanctuary',
    status: 'Pledge Signed',
    image: IMAGES.activityCommunityPledge,
    icon: 'volunteer_activism',
    stats: '95% Multi-Year Survival',
    gradient: 'from-green-950/80 via-black/40 to-transparent',
  },
  {
    id: 'endangered-species-discovery',
    title: 'Endangered Species Discovery',
    shortLabel: 'Species Discovery',
    subtitle: 'Rare Native Flora Expeditions',
    category: 'BIODIVERSITY RESCUE',
    description: 'Guided wilderness field expeditions identifying endangered indigenous tree varieties, cataloging micro-habitats, and establishing verified GPS zones.',
    node: 'Bio-Reserve Ridge Sector',
    status: 'Protected Flora',
    image: IMAGES.activityEndangeredSpecies,
    icon: 'nature_people',
    stats: '47 Rare Species Mapped',
    gradient: 'from-stone-950/80 via-black/40 to-transparent',
  },
]

export function ActivityIdeasCanvas() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Automatic carousel rotation within container only (never scrolling window)
  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      const el = scrollRef.current
      if (!el) return

      setActiveIndex((prev) => {
        const next = (prev + 1) % ACTIVITY_IDEAS.length
        const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).clientWidth + 16 : el.clientWidth
        el.scrollTo({ left: next * cardWidth, behavior: 'smooth' })
        return next
      })
    }, 6000)

    return () => clearInterval(timer)
  }, [isPaused])

  // Sync activeIndex with manual scroll position
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).clientWidth + 16 : el.clientWidth
    const index = Math.round(el.scrollLeft / cardWidth)
    if (index >= 0 && index < ACTIVITY_IDEAS.length) {
      setActiveIndex(index)
    }
  }

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).clientWidth + 16 : el.clientWidth
    el.scrollTo({ left: index * cardWidth, behavior: 'smooth' })
    setActiveIndex(index)
  }

  return (
    <div
      className="relative w-full rounded-2xl bg-surface-container-lowest/80 border border-outline-variant/60 shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Clean Top Header Bar */}
      <div className="mb-4 pb-3 border-b border-outline-variant/40 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-sm text-[11px] uppercase tracking-widest text-secondary font-bold">
              ENGAGEMENT IN ACTION
            </span>
          </div>
          <h3 className="font-headline-sm text-lg sm:text-xl font-extrabold text-primary tracking-tight">
            Activity Ideas
          </h3>
        </div>
      </div>

      {/* Horizontal Scroll Canvas Track */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {ACTIVITY_IDEAS.map((idea) => (
          <div
            key={idea.id}
            className="flex-shrink-0 w-full snap-center relative rounded-2xl overflow-hidden shadow-lg border border-outline-variant/60 group bg-surface-container"
          >
            {/* Image Container with smooth zoom */}
            <div className="relative h-[340px] sm:h-[380px] w-full overflow-hidden">
              <img
                src={idea.image}
                alt={idea.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t ${idea.gradient} pointer-events-none`}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

              {/* Top Idea Category Badge */}
              <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/85 backdrop-blur-md text-white font-label-sm text-[11px] uppercase tracking-wider border border-white/20 shadow-md">
                  <span className="material-symbols-outlined text-[15px] text-secondary-fixed">
                    {idea.icon}
                  </span>
                  <span>{idea.category}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-[10px] uppercase tracking-wider border border-white/10">
                  {idea.stats}
                </span>
              </div>

              {/* Middle Title Overlay */}
              <div className="absolute bottom-24 left-4 right-4 z-10 pointer-events-none">
                <span className="text-[11px] font-mono uppercase tracking-wider text-secondary-fixed drop-shadow-sm font-semibold">
                  {idea.subtitle}
                </span>
                <h4 className="font-headline-sm text-xl sm:text-2xl font-black text-white drop-shadow-md leading-tight mt-0.5">
                  {idea.title}
                </h4>
                <p className="text-white/90 text-xs sm:text-[13px] line-clamp-2 mt-1 leading-snug drop-shadow-sm max-w-md">
                  {idea.description}
                </p>
              </div>

              {/* Bottom Deployment Node Card Bar */}
              <div className="absolute bottom-3 left-3 right-3 z-10 bg-surface-container-lowest/95 backdrop-blur-md p-3 rounded-xl flex items-center justify-between shadow-xl border border-white/30">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-label-sm text-[9px] uppercase tracking-wider text-outline">
                    DEPLOYMENT NODE
                  </span>
                  <span className="font-headline-sm text-[13px] font-bold text-primary truncate">
                    {idea.node}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>{idea.status}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Progress Dots Indicator */}
      <div className="mt-3 flex items-center justify-center gap-2 pt-2 border-t border-outline-variant/30">
        {ACTIVITY_IDEAS.map((_, dotIdx) => (
          <button
            key={dotIdx}
            onClick={() => scrollToIndex(dotIdx)}
            aria-label={`Jump to activity ${dotIdx + 1}`}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              dotIdx === activeIndex ? 'w-8 bg-secondary' : 'w-2 bg-outline/30 hover:bg-outline/60'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
