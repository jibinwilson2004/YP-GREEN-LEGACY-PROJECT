import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { TreeCard } from '../components/tree/TreeCard'
import { treeService } from '../services/treeService'

export function TreesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [speciesFilter, setSpeciesFilter] = useState('ALL')
  const [scopeFilter, setScopeFilter] = useState<'my' | 'all'>('all')
  const [treesVer, setTreesVer] = useState(0)

  const currentUserId = localStorage.getItem('tree_tag_user_id') ?? ''

  useEffect(() => {
    treeService.fetchLatestFromDb().then(() => setTreesVer((v) => v + 1)).catch(() => {})
    const handleUpdate = () => setTreesVer((v) => v + 1)
    window.addEventListener('trees-updated', handleUpdate)
    return () => window.removeEventListener('trees-updated', handleUpdate)
  }, [])

  const trees = useMemo(() => {
    if (scopeFilter === 'my' && currentUserId) {
      return treeService.getByUser(currentUserId)
    }
    return treeService.getAll()
  }, [scopeFilter, currentUserId, treesVer])

  const total = trees.length

  const filteredTrees = useMemo(() => {
    return trees.filter((tree) => {
      const matchSearch =
        search === '' ||
        tree.id.toLowerCase().includes(search.toLowerCase()) ||
        tree.species.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'ALL' || tree.verificationStatus === statusFilter
      const matchSpecies =
        speciesFilter === 'ALL' || tree.species.toLowerCase().includes(speciesFilter.toLowerCase())
      return matchSearch && matchStatus && matchSpecies
    })
  }, [trees, search, statusFilter, speciesFilter])

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased flex flex-col justify-between">
      <AppHeader />

      <main className="max-w-[1280px] mx-auto w-full px-grid-margin-mobile lg:px-grid-margin-desktop py-8 flex-1">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-variant">
          <div>
            <div className="flex items-center gap-2 text-xs font-label-sm text-secondary uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>IEEE CSTF Precision Registry</span>
            </div>
            <h1 className="font-headline-lg text-3xl font-bold text-primary tracking-tight">Tree Registry</h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Browse cryptographically logged sapling verification records and multi-reading geospatial audits.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/capture"
              className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-on-primary font-label-md px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
              <span>Register New Tree</span>
            </Link>
            <Link
              to="/map"
              className="inline-flex items-center gap-2 bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-label-md px-4 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">map</span>
              <span>Map View</span>
            </Link>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs">
            <span className="text-[11px] font-label-sm uppercase tracking-wider text-outline">Total Tagged</span>
            <div className="font-mono-metric text-2xl font-bold text-primary mt-1">{total.toLocaleString()}</div>
            <div className="text-[11px] text-secondary mt-0.5">Global Cluster</div>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs">
            <span className="text-[11px] font-label-sm uppercase tracking-wider text-outline">Verified Ratio</span>
            <div className="font-mono-metric text-2xl font-bold text-secondary mt-1">99.8%</div>
            <div className="text-[11px] text-on-surface-variant mt-0.5">Bi-weekly Audited</div>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs">
            <span className="text-[11px] font-label-sm uppercase tracking-wider text-outline">Active Biomes</span>
            <div className="font-mono-metric text-2xl font-bold text-primary mt-1">24</div>
            <div className="text-[11px] text-on-surface-variant mt-0.5">South Peninsular India</div>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs">
            <span className="text-[11px] font-label-sm uppercase tracking-wider text-outline">Avg GPS Accuracy</span>
            <div className="font-mono-metric text-2xl font-bold text-primary mt-1">3.4 m</div>
            <div className="text-[11px] text-secondary mt-0.5">High Precision Tier</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search tag ID or species (e.g. TT-001 or Mango)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low text-on-surface font-body-sm text-sm rounded-lg border border-outline-variant/40 focus:ring-1 focus:ring-secondary outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {currentUserId && (
              <div className="flex rounded-lg border border-outline-variant/40 bg-surface-container-low p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setScopeFilter('all')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    scopeFilter === 'all'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  All Trees
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter('my')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    scopeFilter === 'my'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  My Tagged Trees
                </button>
              </div>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-container-low text-xs font-label-md px-3 py-2 rounded-lg border border-outline-variant/30 text-primary focus:outline-none"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending Verification</option>
              <option value="FLAGGED">Flagged for Audit</option>
            </select>

            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="bg-surface-container-low text-xs font-label-md px-3 py-2 rounded-lg border border-outline-variant/30 text-primary focus:outline-none"
            >
              <option value="ALL">All Species</option>
              <option value="teak">Teak</option>
              <option value="rosewood">Rosewood</option>
              <option value="neem">Neem</option>
              <option value="jackfruit">Jackfruit</option>
              <option value="mango">Mango</option>
            </select>

            {(search || statusFilter !== 'ALL' || speciesFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('ALL')
                  setSpeciesFilter('ALL')
                }}
                className="px-3 py-2 text-xs font-label-md text-error hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tree List Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrees.map((t) => (
            <TreeCard key={t.id} tree={t} />
          ))}
        </div>

        {filteredTrees.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant/40 mt-6">
            <span className="material-symbols-outlined text-[48px] text-outline">park</span>
            <h3 className="font-headline-sm text-primary mt-2">No trees registered yet</h3>
            <p className="text-body-sm text-on-surface-variant mt-1">
              {currentUserId
                ? "You haven't registered any trees yet. Use Capture Tree to get started."
                : 'No tree records match your criteria. Try resetting your filters.'}
            </p>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  )
}
