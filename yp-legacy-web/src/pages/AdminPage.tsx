import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { authService, formatDisplayName } from '../services/authService'
import { treeService } from '../services/treeService'
import type { Tree } from '../types/tree'

type AdminTab = 'overview' | 'pending' | 'participants' | 'all'


interface Participant {
  userId: string
  treeCount: number
  pendingCount: number
  verifiedCount: number
}

// CSV helper
function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function AdminPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [pendingTrees, setPendingTrees] = useState<Tree[]>([])
  const [allTrees, setAllTrees] = useState<Tree[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [actionNote, setActionNote] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null) // tree id to confirm
  const [search, setSearch] = useState('')

  // Auth guard
  useEffect(() => {
    if (!authService.isAdmin()) {
      navigate('/login')
    }
  }, [navigate])

  const refresh = useCallback(() => {
    setPendingTrees(treeService.getPending())
    setAllTrees(treeService.getAll())
    setParticipants(treeService.getAllParticipants())

    // Asynchronously fetch latest from Neon DB to pick up new user tags instantly
    treeService.fetchLatestFromDb().then(() => {
      setPendingTrees(treeService.getPending())
      setAllTrees(treeService.getAll())
      setParticipants(treeService.getAllParticipants())
    }).catch(() => { /* ignore */ })
  }, [])

  useEffect(() => {
    refresh()
    // Poll Neon DB every 5 seconds for new tree requests submitted from any phone/laptop
    const timer = setInterval(refresh, 5000)
    const handleUpdate = () => refresh()
    window.addEventListener('trees-updated', handleUpdate)
    return () => {
      clearInterval(timer)
      window.removeEventListener('trees-updated', handleUpdate)
    }
  }, [refresh])


  function handleApprove(id: string) {
    treeService.approveTree(id, actionNote[id])
    setSuccessMsg(`Tree ${id} approved ✓`)
    setActionNote((prev) => { const n = { ...prev }; delete n[id]; return n })
    refresh()
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  function handleReject(id: string) {
    treeService.rejectTree(id, actionNote[id])
    setSuccessMsg(`Tree ${id} rejected.`)
    setActionNote((prev) => { const n = { ...prev }; delete n[id]; return n })
    refresh()
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  function handleDelete(id: string) {
    treeService.deleteTree(id)
    setSuccessMsg(`Tree ${id} permanently deleted.`)
    setConfirmDelete(null)
    refresh()
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  const filteredPending = pendingTrees.filter(
    (t) =>
      search === '' ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.species.toLowerCase().includes(search.toLowerCase()) ||
      (t.userId ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  const pendingCount = pendingTrees.length
  const totalCount = allTrees.length
  const verifiedCount = allTrees.filter((t) => t.verificationStatus === 'VERIFIED').length

  const TABS: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'dashboard' },
    { key: 'pending', label: `Pending Approval (${pendingCount})`, icon: 'pending_actions' },
    { key: 'participants', label: 'Participants', icon: 'group' },
    { key: 'all', label: 'All Trees', icon: 'forest' },
  ]

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased flex flex-col">
      <AppHeader />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-8">

        {/* Delete confirmation modal */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-red-200 p-7 max-w-md w-full text-center">
              <span className="material-symbols-outlined text-[48px] text-red-500 mb-2">delete_forever</span>
              <h2 className="font-bold text-xl text-gray-900 mb-1">Delete Tree {confirmDelete}?</h2>
              <p className="text-sm text-gray-500 mb-6">
                This action is <strong>permanent</strong> and cannot be undone. The tree record will be removed from the registry.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => handleDelete(confirmDelete)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Yes, Delete Permanently
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-xs font-bold text-red-700 uppercase tracking-widest">Admin Panel</span>
            </div>
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              IEEE YP Green Legacy Admin Dashboard
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              IEEE YP CSTF — Verification &amp; Registry Management
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const rows = [
                ['#', 'Email / User ID', 'Display Name', 'Total Trees', 'Verified', 'Pending', 'Verification %'],
                ...participants.map((p, i) => [
                  String(i + 1), p.userId, formatDisplayName(p.userId),
                  String(p.treeCount), String(p.verifiedCount), String(p.pendingCount),
                  p.treeCount > 0 ? `${Math.round((p.verifiedCount / p.treeCount) * 100)}%` : '0%',
                ]),
              ]
              downloadCsv(`tree-tag-participants-${new Date().toISOString().slice(0,10)}.csv`, rows)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Participants CSV
          </button>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-secondary-container/60 border border-secondary/30 text-secondary text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            {successMsg}
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 mb-8 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                tab === t.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-8">
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Trees', value: totalCount, icon: 'forest', color: 'text-primary' },
                { label: 'Pending Approval', value: pendingCount, icon: 'pending_actions', color: 'text-amber-600' },
                { label: 'Verified', value: verifiedCount, icon: 'verified', color: 'text-emerald-600' },
                { label: 'Participants', value: participants.length, icon: 'group', color: 'text-secondary' },
              ].map((s) => (
                <div key={s.label} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-5 shadow-xs">
                  <span className={`material-symbols-outlined text-[28px] ${s.color}`}>{s.icon}</span>
                  <div className={`text-3xl font-extrabold mt-2 ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-outline uppercase tracking-wide mt-1 font-semibold">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 shadow-xs">
              <h2 className="font-headline-sm text-lg font-bold text-primary mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setTab('pending')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-white font-semibold text-sm shadow-sm hover:bg-amber-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                  Review {pendingCount} Pending Trees
                </button>
                <button
                  type="button"
                  onClick={() => setTab('participants')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm shadow-sm hover:bg-secondary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  View All Participants
                </button>
              </div>
            </div>

            {/* Recent pending */}
            {pendingCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-amber-600">warning</span>
                  <h2 className="font-bold text-amber-800 text-base">
                    {pendingCount} tree{pendingCount !== 1 ? 's' : ''} awaiting verification
                  </h2>
                </div>
                <div className="space-y-2">
                  {pendingTrees.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-amber-100 text-sm">
                      <div>
                        <span className="font-bold text-primary">{t.id}</span>
                        <span className="text-on-surface-variant ml-2">{t.species}</span>
                        <span className="text-xs text-outline ml-2">by {t.userId ?? 'unknown'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTab('pending')}
                        className="text-xs text-amber-700 font-bold hover:underline"
                      >
                        Review →
                      </button>
                    </div>
                  ))}
                  {pendingCount > 3 && (
                    <p className="text-xs text-amber-700 font-semibold pl-1">
                      + {pendingCount - 3} more pending…
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PENDING APPROVAL ── */}
        {tab === 'pending' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="font-headline-sm text-xl font-bold text-primary">
                Pending Tree Approvals
              </h2>
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Search by ID, species or user…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg border border-outline-variant/40 focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
            </div>

            {filteredPending.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-16 text-center">
                <span className="material-symbols-outlined text-[56px] text-emerald-500">verified</span>
                <h3 className="font-headline-sm text-xl font-bold text-primary mt-3">All clear!</h3>
                <p className="text-on-surface-variant mt-1">No trees pending approval.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPending.map((tree) => (
                  <div key={tree.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-5 sm:p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Tree photo */}
                      {tree.imageUrl ? (
                        <img
                          src={tree.imageUrl}
                          alt={tree.species}
                          className="w-full sm:w-28 h-28 object-cover rounded-xl flex-shrink-0"
                        />
                      ) : (
                        <div className="w-full sm:w-28 h-28 bg-surface-container-high rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-[36px] text-outline">eco</span>
                        </div>
                      )}

                      {/* Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                              PENDING
                            </span>
                            <h3 className="font-bold text-lg text-primary leading-tight">{tree.id}</h3>
                            <p className="text-sm text-on-surface-variant italic">{tree.species}</p>
                          </div>
                          <Link
                            to={`/trees/${tree.id}`}
                            className="text-xs text-secondary font-semibold hover:underline"
                          >
                            View Full Details →
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                          <span><strong className="text-primary">Submitted by:</strong> {tree.userId ?? 'Unknown'}</span>
                          <span><strong className="text-primary">GPS:</strong> {tree.latitude.toFixed(5)}, {tree.longitude.toFixed(5)}</span>
                          <span><strong className="text-primary">Accuracy:</strong> ±{tree.accuracy?.toFixed(1)} m</span>
                          <span><strong className="text-primary">Captured:</strong> {new Date(tree.capturedAt).toLocaleString('en-IN')}</span>
                          <span><strong className="text-primary">Confidence:</strong> {tree.locationConfidence}%</span>
                          {tree.student && <span><strong className="text-primary">Student:</strong> {tree.student}</span>}
                        </div>

                        {/* Admin note */}
                        <textarea
                          placeholder="Add a review note (optional)…"
                          value={actionNote[tree.id] ?? ''}
                          onChange={(e) => setActionNote((prev) => ({ ...prev, [tree.id]: e.target.value }))}
                          rows={2}
                          className="w-full text-xs rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 outline-none focus:ring-1 focus:ring-secondary resize-none mt-1"
                        />

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => handleApprove(tree.id)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            Approve &amp; Verify
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(tree.id)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-sm font-bold transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">block</span>
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(tree.id)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-bold transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PARTICIPANTS ── */}
        {tab === 'participants' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="font-headline-sm text-xl font-bold text-primary">
                Registered Participants ({participants.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  const rows = [
                    ['#', 'Email / User ID', 'Display Name', 'Total Trees', 'Verified', 'Pending', 'Verification %'],
                    ...participants.map((p, i) => [
                      String(i + 1), p.userId, formatDisplayName(p.userId),
                      String(p.treeCount), String(p.verifiedCount), String(p.pendingCount),
                      p.treeCount > 0 ? `${Math.round((p.verifiedCount / p.treeCount) * 100)}%` : '0%',
                    ]),
                  ]
                  downloadCsv(`tree-tag-participants-${new Date().toISOString().slice(0,10)}.csv`, rows)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download Participants CSV
              </button>
            </div>
            {participants.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-12 text-center">
                <span className="material-symbols-outlined text-[48px] text-outline">group_off</span>
                <p className="text-on-surface-variant mt-2">No participants have registered trees yet.</p>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 overflow-x-auto shadow-xs">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-outline-variant/40 bg-surface-container-low text-[11px] uppercase tracking-wider text-outline font-semibold">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">User / Email</th>
                      <th className="py-3 px-4 text-center">Total Trees</th>
                      <th className="py-3 px-4 text-center">Verified</th>
                      <th className="py-3 px-4 text-center">Pending</th>
                      <th className="py-3 px-4 text-center">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {participants.map((p, i) => {
                      const pct = p.treeCount > 0 ? Math.round((p.verifiedCount / p.treeCount) * 100) : 0
                      const name = formatDisplayName(p.userId)
                      return (
                        <tr key={p.userId} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-outline text-xs">#{i + 1}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-secondary font-bold text-xs flex-shrink-0">
                                {name[0]?.toUpperCase() ?? 'U'}
                              </div>
                              <div>
                                <div className="font-semibold text-primary text-sm">{name}</div>
                                <div className="text-[11px] text-outline font-mono">{p.userId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-primary">{p.treeCount}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <span className="material-symbols-outlined text-[14px]">verified</span>
                              {p.verifiedCount}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {p.pendingCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                                <span className="material-symbols-outlined text-[14px]">pending</span>
                                {p.pendingCount}
                              </span>
                            ) : (
                              <span className="text-outline">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-outline">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ALL TREES ── */}
        {tab === 'all' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="font-headline-sm text-xl font-bold text-primary">
                All Registered Trees ({allTrees.length})
              </h2>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 overflow-x-auto shadow-xs">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-outline-variant/40 bg-surface-container-low text-[11px] uppercase tracking-wider text-outline font-semibold">
                    <th className="py-3 px-4">Tree ID</th>
                    <th className="py-3 px-4">Species</th>
                    <th className="py-3 px-4">Submitted By</th>
                    <th className="py-3 px-4">Captured</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {allTrees.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary text-xs">{t.id}</td>
                      <td className="py-3 px-4 text-on-surface-variant text-xs italic">{t.species}</td>
                      <td className="py-3 px-4 text-xs text-outline font-mono">{t.userId ?? '—'}</td>
                      <td className="py-3 px-4 text-xs text-outline">{new Date(t.capturedAt).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.verificationStatus === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {t.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/trees/${t.id}`}
                            className="text-xs text-secondary font-semibold hover:underline"
                          >
                            View
                          </Link>
                          {t.verificationStatus === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(t.id)}
                              className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {(t.verificationStatus === 'PENDING' || t.verificationStatus === 'VERIFIED') && (
                            <button
                              type="button"
                              onClick={() => handleReject(t.id)}
                              className="text-xs text-orange-600 font-bold hover:underline cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(t.id)}
                            className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  )
}
