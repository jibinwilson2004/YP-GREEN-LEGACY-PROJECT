import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { TreeMap } from '../components/map/TreeMap'
import { TreeDetailsCard } from '../components/tree/TreeDetailsCard'
import { treeService } from '../services/treeService'
import type { Tree } from '../types/tree'

const FEATURED_NEEM_TREE: Tree = {
  id: 'YP-000001',
  species: 'Azadirachta indica',
  commonName: 'Neem',
  botanicalName: 'Azadirachta indica',
  imageUrl: '/assets/images/tree-sapling.png',
  images: [
    '/assets/images/tree-sapling.png',
    '/assets/images/hero-misty-forest.png',
    '/assets/images/pine-forest-aerial.png',
  ],
  latitude: 10.0528,
  longitude: 76.6346,
  accuracy: 4.2,
  altitude: 48.5,
  gpsSource: 'SMARTPHONE_GPS',
  locationConfidence: 96,
  locationStatus: 'HIGH',
  readingCount: 12,
  stabilityScore: 96,
  gpsStability: 'STABLE',
  capturedAt: '2026-08-31T10:30:00.000Z',
  dateOfPlanting: '31-08-2026',
  updatedAt: '31-08-2026',
  student: 'SORNA SAKTHI GANESH V',
  college: 'GOVT. ENGINEERING COLLEGE, BARTON HILL-TRV',
  cluster: 'TRV',
  institution: 'APJAKTU NSSCELL NRPF',
  userId: 'sorna-sakthi-ganesh',
  verificationStatus: 'VERIFIED',
  verifiedBy: 'IEEE YP CSTF',
  verificationDate: '31-08-2026',
  treeIdentificationConfidence: 91,
}

export function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const treeParam = searchParams.get('tree')
  const userParam = searchParams.get('user')
  const isUserFilter =
    userParam === 'sorna-sakthi-ganesh' ||
    userParam === 'jibin-wilson' ||
    treeParam === 'YP-000001' ||
    treeParam === 'TT-8841'

  const [search] = useState('')
  const [viewMode] = useState<'clusters' | 'heatmap' | 'satellite'>('clusters')
  const [selectedTree, setSelectedTree] = useState<Tree | null>(isUserFilter ? FEATURED_NEEM_TREE : null)
  const [popoverOpen, setPopoverOpen] = useState(isUserFilter)
  const [userTab, setUserTab] = useState<'all' | 'user'>(isUserFilter ? 'user' : 'all')

  const [treesVer, setTreesVer] = useState(0)

  useEffect(() => {
    const handleUpdate = () => setTreesVer((v) => v + 1)
    window.addEventListener('trees-updated', handleUpdate)
    return () => window.removeEventListener('trees-updated', handleUpdate)
  }, [])

  useEffect(() => {
    if (isUserFilter && treeService.getById('YP-000001')) {
      setSelectedTree(FEATURED_NEEM_TREE)
      setPopoverOpen(true)
      setUserTab('user')
    }
  }, [isUserFilter])

  const allTrees = useMemo(() => treeService.getAll(), [treesVer])

  // Trees displayed on map based on user tab
  const displayTrees = useMemo(() => {
    const neemExists = treeService.getById('YP-000001')
    if (userTab === 'user') {
      return neemExists ? [FEATURED_NEEM_TREE] : allTrees.slice(0, 1)
    }
    return allTrees
  }, [userTab, allTrees])

  // Pre-selected active tree
  const activeTree: Tree | null = useMemo(() => {
    if (selectedTree && allTrees.some((t) => t.id === selectedTree.id)) {
      return selectedTree
    }
    return displayTrees[0] ?? null
  }, [selectedTree, displayTrees, allTrees])

  const handleShowAll = () => {
    setSearchParams({})
    setUserTab('all')
    setSelectedTree(null)
    setPopoverOpen(false)
  }

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased flex flex-col justify-between">
      <AppHeader mapActive />

      {/* MAIN MAP INSPECTION CONSOLE */}
      <main className="w-full pt-4 bg-background flex-1 max-w-[1280px] mx-auto px-grid-margin-mobile md:px-grid-margin-desktop mb-spacing-4xl">
        <div className="flex flex-col w-full">
          {/* MAIN GEOSPATIAL MAP WORKSPACE & INTEGRATED REGISTRY DRAWER */}
          <div className="relative w-full h-[520px] sm:h-[640px] lg:h-[760px] rounded-xl overflow-hidden shadow-xl bg-[#7ec4cb] select-none border border-outline-variant/50">
            {/* Active User Planted Tree Overlay Banner */}
            {userTab === 'user' && (
              <div className="absolute top-2 left-2 right-2 sm:right-auto sm:top-4 sm:left-4 z-20 flex items-center gap-2 sm:gap-3 bg-[#002218]/95 backdrop-blur-md text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-secondary shadow-2xl animate-fade-in max-w-full sm:max-w-md">
                <div className="relative flex h-3 w-3 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </div>
                <div className="text-xs min-w-0 flex-1">
                  <div className="font-bold text-secondary-fixed truncate">
                    Showing Tree Planted by {FEATURED_NEEM_TREE.student}
                  </div>
                  <div className="font-mono text-white/80 text-[10px] sm:text-[11px] mt-0.5 truncate">
                    #{FEATURED_NEEM_TREE.id} Neem • Barton Hill-TRV
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleShowAll}
                  className="ml-auto px-2 py-1 sm:px-2.5 sm:py-1 rounded bg-secondary hover:bg-emerald-600 text-white font-bold text-[11px] sm:text-xs transition-colors cursor-pointer shadow-xs whitespace-nowrap flex-shrink-0"
                >
                  Show All
                </button>
              </div>
            )}

            {/* Real Interactive Leaflet Map with clustering & viewport loading */}
            <TreeMap
              search={search}
              selectedTree={activeTree}
              onSelectTree={(t) => {
                if (t) {
                  setSelectedTree(t)
                  setPopoverOpen(true)
                }
              }}
              viewMode={viewMode}
              className="absolute inset-0 w-full h-full"
            />

            {/* COMPACT FLOATING TREE DETAILS CARD (Positioned gracefully in corner for proper map view) */}
            {popoverOpen && activeTree && (
              <div className="absolute top-16 sm:top-4 right-2 left-2 sm:left-auto sm:right-4 z-30 max-w-full sm:w-[340px] animate-fade-in drop-shadow-2xl">
                <TreeDetailsCard
                  tree={activeTree}
                  onClose={() => setPopoverOpen(false)}
                />
              </div>
            )}

            {/* MAP FLOATING TOOLS (Bottom Right) */}
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-20 flex flex-col items-end gap-2">
              <div className="bg-surface-container-lowest/90 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full shadow-md flex items-center gap-2 text-[10px] sm:text-[11px] font-label-sm text-primary">
                <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                <span className="hidden sm:inline">YP Legacy Project GIS Engine v4.2 • Sentinel-2 Earth Observation &amp; GPS Audit</span>
                <span className="sm:hidden">GIS Engine v4.2</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
