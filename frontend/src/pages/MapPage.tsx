import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { TreeMap } from '../components/map/TreeMap'
import { TreeDetailsCard } from '../components/tree/TreeDetailsCard'
import { fetchTreeById } from '../services/api'
import { authService } from '../services/authService'
import type { Tree } from '../types/tree'

export function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const treeParam = searchParams.get('tree')
  const userParam = searchParams.get('user')

  const isUserFilter = !!treeParam || !!userParam

  const [search] = useState('')
  const [viewMode] = useState<'clusters' | 'heatmap' | 'satellite'>('clusters')
  const [institutionFilter, setInstitutionFilter] = useState('')
  const [clusterFilter, setClusterFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [mapError, setMapError] = useState<string | null>(null)
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(isUserFilter)
  const [userTab, setUserTab] = useState<'all' | 'user'>(isUserFilter ? 'user' : 'all')
  const mapFilters = useMemo(() => ({
    institution: institutionFilter.trim() || undefined,
    cluster: clusterFilter.trim() || undefined,
    status: statusFilter || undefined,
    userId: userParam || (userTab === 'user' ? authService.getCurrentUser()?.email : undefined),
  }), [institutionFilter, clusterFilter, statusFilter, userParam, userTab])

  useEffect(() => {
    if (!treeParam) return
    void fetchTreeById(treeParam).then(setSelectedTree).catch((error) => console.error('[Tree details unavailable]', error))
  }, [treeParam])

  const activeTree = selectedTree

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
          <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-3">
            <label className="text-xs font-semibold text-on-surface-variant">
              Institution
              <input
                className="mt-1 w-full rounded-md border border-outline-variant/50 bg-white px-2.5 py-2 text-sm text-on-surface"
                value={institutionFilter}
                onChange={(event) => setInstitutionFilter(event.target.value)}
                placeholder="All institutions"
              />
            </label>
            <label className="text-xs font-semibold text-on-surface-variant">
              Cluster
              <input
                className="mt-1 w-full rounded-md border border-outline-variant/50 bg-white px-2.5 py-2 text-sm text-on-surface"
                value={clusterFilter}
                onChange={(event) => setClusterFilter(event.target.value)}
                placeholder="All clusters"
              />
            </label>
            <label className="text-xs font-semibold text-on-surface-variant">
              Verification status
              <select
                className="mt-1 w-full rounded-md border border-outline-variant/50 bg-white px-2.5 py-2 text-sm text-on-surface"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All visible statuses</option>
                <option value="VERIFIED">Verified</option>
                {authService.isAdmin() && (
                  <>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="FLAGGED">Flagged</option>
                  </>
                )}
              </select>
            </label>
          </div>
          {mapError && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              Could not load map records: {mapError}
            </p>
          )}
          {/* MAIN GEOSPATIAL MAP WORKSPACE & INTEGRATED REGISTRY DRAWER */}
          <div className="relative w-full h-[520px] sm:h-[640px] lg:h-[760px] rounded-xl overflow-hidden shadow-xl bg-[#7ec4cb] select-none border border-outline-variant/50">
            {/* Active User Planted Tree Overlay Banner */}
            {userTab === 'user' && activeTree && (
              <div className="absolute top-2 left-2 right-2 sm:right-auto sm:top-4 sm:left-4 z-20 flex items-center gap-2 sm:gap-3 bg-[#002218]/95 backdrop-blur-md text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-secondary shadow-2xl animate-fade-in max-w-full sm:max-w-md">
                <div className="relative flex h-3 w-3 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </div>
                <div className="text-xs min-w-0 flex-1">
                  <div className="font-bold text-secondary-fixed truncate">
                    Showing a registered tree planted by {activeTree.student || 'a community member'}
                  </div>
                  <div className="font-mono text-white/80 text-[10px] sm:text-[11px] mt-0.5 truncate">
                    #{activeTree.id} • {activeTree.species}
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
              filters={mapFilters}
              onLoadError={setMapError}
              onSelectTree={(t) => {
                if (t) {
                  setSelectedTree(t)
                  setPopoverOpen(true)
                  void fetchTreeById(t.id).then((details) => {
                    if (details) setSelectedTree(details)
                  }).catch((error) => console.error('[Tree photos unavailable]', error))
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
