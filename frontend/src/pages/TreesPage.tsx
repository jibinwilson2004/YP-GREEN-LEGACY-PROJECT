import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { TreeCard } from '../components/tree/TreeCard'
import { fetchPublicStatsApi, fetchTrees } from '../services/api'
import { treeService } from '../services/treeService'
import { authService } from '../services/authService'
import type { Tree } from '../types/tree'

export function TreesPage() {
  const authUser = authService.getCurrentUser()
  const isAdmin = authUser?.role === 'admin'
  const isRegularUser = !!authUser && !isAdmin
  const currentUserId = authUser?.email || ''

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [speciesFilter, setSpeciesFilter] = useState('ALL')
  const [scopeFilter, setScopeFilter] = useState<'my' | 'all'>('my')
  const [page, setPage] = useState(1)
  const pageSize = 12
  const [trees, setTrees] = useState<Tree[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ verifiedTrees: 0, institutionCount: 0, averageAccuracy: null as number | null })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingTreeId, setDeletingTreeId] = useState<string | null>(null)

  const handleDeleteTree = async (tree: Tree) => {
    if (!isAdmin && tree.verificationStatus === 'VERIFIED') return
    if (!window.confirm(`Are you sure you want to delete tree record #${tree.id}? This action cannot be undone.`)) return

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
    if (!authUser) return
    let active = true
    const effectiveUserId = isRegularUser || scopeFilter === 'my' ? currentUserId : undefined
    void fetchTrees({
      page,
      limit: pageSize,
      search: search.trim() || undefined,
      status: statusFilter,
      species: speciesFilter,
      userId: effectiveUserId,
    }).then((response) => {
      if (!active) return
      if (response.trees.length > 0 || !effectiveUserId) {
        setTrees(response.trees)
        setTotal(response.total)
      } else {
        const local = treeService.getByUser(effectiveUserId)
        if (local.length > 0) {
          setTrees(local)
          setTotal(local.length)
        } else {
          setTrees([])
          setTotal(0)
        }
      }
      setLoadError(null)
    }).catch((error) => {
      if (!active) return
      if (effectiveUserId) {
        const local = treeService.getByUser(effectiveUserId)
        if (local.length > 0) {
          setTrees(local)
          setTotal(local.length)
          setLoadError(null)
          return
        }
      }
      setLoadError(error instanceof Error ? error.message : 'Failed to load tree records.')
    })
    return () => { active = false }
  }, [page, pageSize, search, statusFilter, speciesFilter, scopeFilter, currentUserId, isRegularUser, authUser])

  useEffect(() => {
    void fetchPublicStatsApi()
      .then((result) => setStats({
        verifiedTrees: result.verifiedTrees,
        institutionCount: result.institutionCount,
        averageAccuracy: result.averageAccuracy,
      }))
      .catch((error) => console.error('[Registry statistics unavailable]', error))
  }, [])

  // If user is not logged in, display sign-in prompt as required
  if (!authUser) {
    return (
      <div className="min-h-screen bg-background font-body-md text-on-surface antialiased flex flex-col justify-between">
        <AppHeader />

        <main className="max-w-xl mx-auto w-full px-4 py-20 flex-1 flex items-center justify-center">
          <div className="bg-surface-container-lowest rounded-2xl p-8 sm:p-10 border border-outline-variant/50 shadow-xl text-center w-full animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-secondary-container/80 text-secondary flex items-center justify-center mx-auto mb-5 shadow-xs">
              <span className="material-symbols-outlined text-[36px]">lock</span>
            </div>
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Sign In Required
            </h1>
            <p className="text-body-md text-on-surface-variant mt-3 mb-8 max-w-md mx-auto leading-relaxed">
              The <strong>My Trees</strong> registry is accessible only to authenticated users. Sign in to view, monitor, and manage your tagged saplings.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-on-primary font-label-md px-6 py-3 rounded-xl shadow-sm transition-colors text-sm font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Sign In to Account</span>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary/5 font-label-md px-6 py-3 rounded-xl transition-colors text-sm font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Create an Account</span>
              </Link>
            </div>
          </div>
        </main>

        <AppFooter />
      </div>
    )
  }

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
            <h1 className="font-headline-lg text-3xl font-bold text-primary tracking-tight">
              {isRegularUser ? 'My Trees' : 'Tree Registry'}
            </h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              {isRegularUser
                ? 'View your registered trees and verification telemetry. Only verified trees are labeled as Tagged.'
                : 'Browse cryptographically logged sapling verification records and multi-reading geospatial audits.'}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
          <div className="bg-gradient-to-b from-white to-[#f7fbf8] p-4 rounded-xl border border-outline-variant/40 shadow-xs border-l-4 border-l-emerald-600">
            <span className="text-[11px] font-label-sm uppercase tracking-wider text-outline flex items-center justify-between">
              <span>Total Tagged</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </span>
            <div className="font-mono-metric text-2xl font-bold text-emerald-800 mt-1">
              {(isRegularUser || scopeFilter === 'my'
                ? trees.filter((t) => t.verificationStatus === 'VERIFIED').length
                : stats.verifiedTrees
              ).toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span>Verified &amp; Proven</span>
            </div>
          </div>
          <div className="bg-gradient-to-b from-white to-[#f7fbf8] p-4 rounded-xl border border-outline-variant/40 shadow-xs border-l-4 border-l-amber-500">
            <span className="text-[11px] font-label-sm uppercase tracking-wider text-outline flex items-center justify-between">
              <span>Pending Review</span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </span>
            <div className="font-mono-metric text-2xl font-bold text-amber-700 mt-1">
              {(isRegularUser || scopeFilter === 'my'
                ? trees.filter((t) => t.verificationStatus !== 'VERIFIED').length
                : Math.max(0, total - stats.verifiedTrees)
              ).toLocaleString()}
            </div>
            <div className="text-[11px] text-amber-800 font-medium mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
              <span>Awaiting Audit</span>
            </div>
          </div>
          <div className="bg-gradient-to-b from-white to-[#f7fbf8] p-4 rounded-xl border border-outline-variant/40 shadow-xs border-l-4 border-l-secondary">
            <span className="text-[11px] font-label-sm uppercase tracking-wider text-outline flex items-center justify-between">
              <span>Active Biomes</span>
              <span className="material-symbols-outlined text-[14px] text-secondary">domain</span>
            </span>
            <div className="font-mono-metric text-2xl font-bold text-primary mt-1">{stats.institutionCount}</div>
            <div className="text-[11px] text-on-surface-variant mt-0.5">Institutions logged</div>
          </div>
          <div className="bg-gradient-to-b from-white to-[#f7fbf8] p-4 rounded-xl border border-outline-variant/40 shadow-xs border-l-4 border-l-[#1f5d82]">
            <span className="text-[11px] font-label-sm uppercase tracking-wider text-outline flex items-center justify-between">
              <span>Avg Accuracy</span>
              <span className="material-symbols-outlined text-[14px] text-[#1f5d82]">gps_fixed</span>
            </span>
            <div className="font-mono-metric text-2xl font-bold text-primary mt-1">
              {stats.averageAccuracy === null ? '—' : `${stats.averageAccuracy.toFixed(1)} m`}
            </div>
            <div className="text-[11px] text-[#1f5d82] font-medium mt-0.5">High Precision Tier</div>
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
            {isAdmin && (
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
                  My Trees
                </button>
              </div>
            )}
            {isRegularUser && (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">person</span>
                <span>My Trees</span>
              </div>
            )}

            <select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}
              className="bg-surface-container-low text-xs font-label-md px-3 py-2 rounded-lg border border-outline-variant/30 text-primary focus:outline-none"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="VERIFIED">Tagged (Verified)</option>
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
              {((scopeFilter === 'my' && t.verificationStatus !== 'VERIFIED') || isAdmin) && (
                <button
                  type="button"
                  disabled={deletingTreeId === t.id}
                  onClick={() => void handleDeleteTree(t)}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
                  aria-label={`Delete tree ${t.id}`}
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  <span>{deletingTreeId === t.id ? 'Deleting…' : isAdmin ? `Delete Tree Record #${t.id}` : 'Delete Unverified Tree'}</span>
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
