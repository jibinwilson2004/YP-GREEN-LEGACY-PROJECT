import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { TreeCard } from '../components/tree/TreeCard'
import { fetchPublicStatsApi, fetchTrees } from '../services/api'
import { treeService } from '../services/treeService'
import type { Tree } from '../types/tree'

export function TreesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [speciesFilter, setSpeciesFilter] = useState('ALL')
  const [scopeFilter, setScopeFilter] = useState<'my' | 'all'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 12
  const currentUserId = localStorage.getItem('tree_tag_user_id') ?? ''
  const [trees, setTrees] = useState<Tree[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ verifiedTrees: 0, institutionCount: 0, averageAccuracy: null as number | null })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingTreeId, setDeletingTreeId] = useState<string | null>(null)

  const handleDeleteTree = async (tree: Tree) => {
    if (tree.verificationStatus === 'VERIFIED') return
    if (!window.confirm(`Delete unverified tree ${tree.id}? This cannot be undone.`)) return

    setDeleteError(null)
    setDeletingTreeId(tree.id)
    try {
      await treeService.deleteTree(tree.id)
      setTrees((current) => current.filter((item) => item.id !== tree.id))
      setTotal((current) => Math.max(0, current - 1))
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete the tree.')
    } finally {
      setDeletingTreeId(null)
    }
  }

  useEffect(() => {
    let active = true
    void fetchTrees({
      page,
      limit: pageSize,
      search: search.trim() || undefined,
      status: statusFilter,
      species: speciesFilter,
      userId: scopeFilter === 'my' ? currentUserId : undefined,
    }).then((response) => {
      if (!active) return
      setTrees(response.trees)
      setTotal(response.total)
      setLoadError(null)
    }).catch((error) => {
      if (active) setLoadError(error instanceof Error ? error.message : 'Failed to load tree records.')
    })
    return () => { active = false }
  }, [page, pageSize, search, statusFilter, speciesFilter, scopeFilter, currentUserId])

  useEffect(() => {
    void fetchPublicStatsApi()
      .then((result) => setStats({
        verifiedTrees: result.verifiedTrees,
        institutionCount: result.institutionCount,
        averageAccuracy: result.averageAccuracy,
      }))
      .catch((error) => console.error('[Registry statistics unavailable]', error))
  }, [])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1

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
            <div className="font-mono-metric text-2xl font-bold text-secondary mt-1">
              {total ? `${((stats.verifiedTrees / total) * 100).toFixed(1)}%` : '—'}
            </div>
            <div className="text-[11px] text-on-surface-variant mt-0.5">Bi-weekly Audited</div>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs">
            <span className="text-[11px] font-label-sm uppercase tracking-wider text-outline">Active Biomes</span>
            <div className="font-mono-metric text-2xl font-bold text-primary mt-1">{stats.institutionCount}</div>
            <div className="text-[11px] text-on-surface-variant mt-0.5">Registered institutions</div>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs">
            <span className="text-[11px] font-label-sm uppercase tracking-wider text-outline">Avg GPS Accuracy</span>
            <div className="font-mono-metric text-2xl font-bold text-primary mt-1">
              {stats.averageAccuracy === null ? '—' : `${stats.averageAccuracy.toFixed(1)} m`}
            </div>
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
              onChange={(e) => { setPage(1); setSearch(e.target.value) }}
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low text-on-surface font-body-sm text-sm rounded-lg border border-outline-variant/40 focus:ring-1 focus:ring-secondary outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {currentUserId && (
              <div className="flex rounded-lg border border-outline-variant/40 bg-surface-container-low p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setPage(1); setScopeFilter('all') }}
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
                  onClick={() => { setPage(1); setScopeFilter('my') }}
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
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}
              className="bg-surface-container-low text-xs font-label-md px-3 py-2 rounded-lg border border-outline-variant/30 text-primary focus:outline-none"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending Verification</option>
              <option value="FLAGGED">Flagged for Audit</option>
            </select>

            <select
              value={speciesFilter}
              onChange={(e) => { setPage(1); setSpeciesFilter(e.target.value) }}
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
                  setPage(1)
                }}
                className="px-3 py-2 text-xs font-label-md text-error hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loadError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            Could not load tree records: {loadError}
          </div>
        )}
        {deleteError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            Could not delete tree: {deleteError}
          </div>
        )}

        {/* Tree List Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trees.map((t) => (
            <div key={t.id}>
              <TreeCard tree={t} />
              {scopeFilter === 'my' && t.verificationStatus !== 'VERIFIED' && (
                <button
                  type="button"
                  disabled={deletingTreeId === t.id}
                  onClick={() => void handleDeleteTree(t)}
                  className="mt-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Delete unverified tree ${t.id}`}
                >
                  {deletingTreeId === t.id ? 'Deleting…' : 'Delete unverified tree'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Pagination Bar */}
        {total > pageSize && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs">
            <span className="text-xs text-on-surface-variant font-mono">
              Showing {start}–{Math.min(page * pageSize, total)} of {total} registered trees
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/50 text-xs font-semibold text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                Previous
              </button>
              <span className="text-xs font-bold text-primary px-2 font-mono">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/50 text-xs font-semibold text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors flex items-center gap-1"
              >
                Next
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}

        {trees.length === 0 && !loadError && (
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
