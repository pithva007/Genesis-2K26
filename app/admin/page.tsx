'use client';

import { useState, useEffect, useCallback } from 'react';
import { SPORTS_CONFIG } from '@/config/sports.config';
import toast, { Toaster } from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  name: string;
  phone: string;
  year: string;
  dept: string;
}

interface TeamData {
  teamCode: string;
  teamName: string;
  sport: string;
  category: string;
  captain: Member;
  members: Member[];
  memberCount: number;
  maxMembers: number;
  status: string;
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Intern', 'SR', 'HOD', 'Associate Professor', 'Assistant Professor'];
const DEPARTMENTS = [
  'UG student',
  'Anatomy', 'Physiology', 'Biochemistry', 'PSM', 'Pharmacology',
  'Pathology', 'Microbiology', 'Medicine', 'Surgery', 'Obs-Gyne',
  'Ophthalmology', 'Pediatrics', 'ENT', 'Radiology', 'Forensic',
  'Orthopedics', 'Psychiatry', 'Dermatology', 'Anesthesia',
];

// ── Shared styles (consistent with the rest of the site) ──────────────────────

const inputCls =
  'w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none focus:border-yellow-400/60 focus:bg-white/10 transition';
const selectCls =
  'w-full bg-[#0d1530] border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition appearance-none';
const labelCls = 'block text-xs font-medium text-white/60 mb-1';

// ── CSV helpers ───────────────────────────────────────────────────────────────

function escapeCsv(v: string): string {
  return /["\n,]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function buildCsv(teams: TeamData[], maxMembers: number): string {
  const headers = [
    'Team Code', 'Team Name', 'Category', 'Status',
    'Captain Name', 'Captain Phone', 'Captain Year', 'Captain Dept',
  ];
  for (let i = 1; i <= maxMembers - 1; i++) {
    headers.push(`Member ${i} Name`, `Member ${i} Phone`, `Member ${i} Year`, `Member ${i} Dept`);
  }
  headers.push('Created At');

  const rows = teams.map((t) => {
    const row: string[] = [
      t.teamCode, t.teamName, t.category, t.status,
      t.captain.name, t.captain.phone, t.captain.year, t.captain.dept,
    ];
    for (let i = 0; i < maxMembers - 1; i++) {
      const m = t.members[i];
      row.push(m?.name ?? '', m?.phone ?? '', m?.year ?? '', m?.dept ?? '');
    }
    row.push(t.createdAt);
    return row;
  });

  return [headers, ...rows]
    .map((row) => row.map((v) => escapeCsv(v)).join(','))
    .join('\n');
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'open'
      ? 'bg-green-400/20 text-green-400'
      : status === 'full'
      ? 'bg-yellow-400/20 text-yellow-400'
      : 'bg-red-400/20 text-red-400';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>
      {status}
    </span>
  );
}

// ── Edit Panel ────────────────────────────────────────────────────────────────

interface EditPanelProps {
  team: TeamData;
  password: string;
  categories: string[];
  onClose: () => void;
  onSaved: (updated: TeamData) => void;
  onDeleted: (code: string) => void;
}

function EditPanel({ team, password, categories, onClose, onSaved, onDeleted }: EditPanelProps) {
  const [teamName, setTeamName] = useState(team.teamName);
  const [category, setCategory] = useState(team.category);
  const [status, setStatus] = useState(team.status);
  const [captain, setCaptain] = useState<Member>({ ...team.captain });
  const [members, setMembers] = useState<Member[]>(team.members.map((m) => ({ ...m })));
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState<Member>({ name: '', phone: '', year: '', dept: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startEditMember = (idx: number) => {
    setEditingIdx(idx);
    setEditingMember({ ...members[idx] });
  };

  const saveMemberEdit = () => {
    if (editingIdx === null || !editingMember) return;
    setMembers((prev) => prev.map((m, i) => (i === editingIdx ? editingMember : m)));
    setEditingIdx(null);
    setEditingMember(null);
  };

  const cancelMemberEdit = () => {
    setEditingIdx(null);
    setEditingMember(null);
  };

  const deleteMember = (idx: number) => {
    if (!confirm(`Remove ${members[idx].name} from team?`)) return;
    setMembers((prev) => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) cancelMemberEdit();
  };

  const addMember = () => {
    if (!newMember.name.trim()) { toast.error('Name is required'); return; }
    if (!newMember.year) { toast.error('Year is required'); return; }
    if (!newMember.dept) { toast.error('Department is required'); return; }
    setMembers((prev) => [...prev, { ...newMember }]);
    setNewMember({ name: '', phone: '', year: '', dept: '' });
    setAddingMember(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/teams/${team.teamCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ teamName, category, status, captain, members }),
      });
      const data = (await res.json()) as { team?: TeamData; error?: string };
      if (res.ok && data.team) {
        toast.success('Team updated successfully!');
        onSaved(data.team);
      } else {
        toast.error(data.error ?? 'Failed to update team');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${team.teamName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/teams/${team.teamCode}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });
      if (res.ok) {
        toast.success('Team deleted');
        onDeleted(team.teamCode);
      } else {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? 'Failed to delete team');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-2 bg-white/[0.06] border border-yellow-400/20 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold">Editing: {team.teamName}</h3>
        <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">✕</button>
      </div>

      {/* Team fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Team Name</label>
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
            <option value="open">Open</option>
            <option value="full">Full</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Captain */}
      <div>
        <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">👑 Captain</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Name</label>
            <input value={captain.name} onChange={(e) => setCaptain({ ...captain, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input value={captain.phone} onChange={(e) => setCaptain({ ...captain, phone: e.target.value })} type="tel" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Year</label>
            <select value={captain.year} onChange={(e) => setCaptain({ ...captain, year: e.target.value })} className={selectCls}>
              <option value="">Select...</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Department</label>
            <select value={captain.dept} onChange={(e) => setCaptain({ ...captain, dept: e.target.value })} className={selectCls}>
              <option value="">Select...</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Members */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            👥 Members ({members.length})
          </p>
          <button
            onClick={() => setAddingMember((v) => !v)}
            className="text-yellow-400 text-xs border border-yellow-400/40 px-3 py-1 rounded-lg hover:bg-yellow-400/10 transition"
          >
            + Add Member
          </button>
        </div>

        {/* Member list */}
        <div className="space-y-2">
          {members.length === 0 && (
            <p className="text-white/30 text-sm text-center py-3">No members added</p>
          )}
          {members.map((m, idx) => (
            <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/5">
              {editingIdx === idx ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className={labelCls}>Name</label>
                      <input
                        value={editingMember?.name ?? ''}
                        onChange={(e) => setEditingMember((prev) => prev ? { ...prev, name: e.target.value } : null)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input
                        value={editingMember?.phone ?? ''}
                        onChange={(e) => setEditingMember((prev) => prev ? { ...prev, phone: e.target.value } : null)}
                        type="tel"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Year</label>
                      <select
                        value={editingMember?.year ?? ''}
                        onChange={(e) => setEditingMember((prev) => prev ? { ...prev, year: e.target.value } : null)}
                        className={selectCls}
                      >
                        <option value="">Select...</option>
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Dept</label>
                      <select
                        value={editingMember?.dept ?? ''}
                        onChange={(e) => setEditingMember((prev) => prev ? { ...prev, dept: e.target.value } : null)}
                        className={selectCls}
                      >
                        <option value="">Select...</option>
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveMemberEdit} className="text-xs bg-yellow-400 text-black font-bold px-4 py-1.5 rounded-lg">
                      ✓ Save
                    </button>
                    <button onClick={cancelMemberEdit} className="text-xs text-white/50 border border-white/20 px-4 py-1.5 rounded-lg hover:bg-white/5">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-white/40 text-xs mr-2">{idx + 1}.</span>
                    <span className="text-white text-sm font-medium">{m.name}</span>
                    <span className="text-white/50 text-xs ml-2">{m.year} • {m.dept}</span>
                    {m.phone && <span className="text-white/35 text-xs ml-2">{m.phone}</span>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEditMember(idx)} className="text-yellow-400 hover:text-yellow-300 text-sm px-2 py-0.5 rounded hover:bg-yellow-400/10">
                      ✏️
                    </button>
                    <button onClick={() => deleteMember(idx)} className="text-red-400 hover:text-red-300 text-sm px-2 py-0.5 rounded hover:bg-red-400/10">
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add member form */}
        {addingMember && (
          <div className="mt-3 bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <p className="text-white/70 text-sm font-semibold">New Member</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Name *</label>
                <input
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Full name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  placeholder="Optional"
                  type="tel"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Year *</label>
                <select value={newMember.year} onChange={(e) => setNewMember({ ...newMember, year: e.target.value })} className={selectCls}>
                  <option value="">Select...</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Dept *</label>
                <select value={newMember.dept} onChange={(e) => setNewMember({ ...newMember, dept: e.target.value })} className={selectCls}>
                  <option value="">Select...</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addMember} className="text-xs bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-1.5 rounded-lg transition">
                Add
              </button>
              <button
                onClick={() => { setAddingMember(false); setNewMember({ name: '', phone: '', year: '', dept: '' }); }}
                className="text-xs text-white/50 border border-white/20 px-4 py-1.5 rounded-lg hover:bg-white/5 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-3 border-t border-white/10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-xl text-sm transition"
        >
          {saving ? '💾 Saving...' : '💾 Save Changes'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-5 border border-red-400/40 text-red-400 hover:bg-red-400/10 disabled:opacity-60 disabled:cursor-not-allowed font-bold py-2.5 rounded-xl text-sm transition"
        >
          {deleting ? 'Deleting...' : '🗑️ Delete Team'}
        </button>
      </div>
    </div>
  );
}

// ── Team Card ─────────────────────────────────────────────────────────────────

interface TeamCardProps {
  team: TeamData;
  password: string;
  onSaved: (updated: TeamData) => void;
  onDeleted: (code: string) => void;
}

function TeamCard({ team, password, onSaved, onDeleted }: TeamCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const sport = SPORTS_CONFIG.find((s) => s.name === team.sport);
  const categories = sport?.categories ?? [];

  const memberNames =
    team.members.length > 0
      ? team.members.map((m) => m.name).join(', ')
      : 'None';

  return (
    <div className="mb-3">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-base">{team.teamName}</h3>
              <span className="text-xs px-2 py-0.5 bg-white/10 text-white/60 rounded-full">
                {team.category}
              </span>
              <StatusBadge status={team.status} />
            </div>
            <p className="text-white/60 text-sm">
              👑 {team.captain.name}
              {team.captain.phone && <span className="text-white/40 ml-1">· {team.captain.phone}</span>}
              <span className="text-white/40"> · {team.captain.year}, {team.captain.dept}</span>
            </p>
            <p className="text-white/40 text-xs mt-1">
              Members: {memberNames} ({team.memberCount}/{team.maxMembers})
            </p>
            <p className="text-white/25 text-xs font-mono mt-0.5">{team.teamCode}</p>
          </div>
          <button
            onClick={() => setShowEdit((v) => !v)}
            className={`shrink-0 text-sm px-3 py-1.5 border rounded-lg transition ${
              showEdit
                ? 'border-white/20 text-white/60 hover:bg-white/5'
                : 'border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10'
            }`}
          >
            {showEdit ? '✕ Close' : '✏️ Edit'}
          </button>
        </div>
      </div>

      {showEdit && (
        <EditPanel
          team={team}
          password={password}
          categories={categories}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { onSaved(updated); setShowEdit(false); }}
          onDeleted={(code) => { onDeleted(code); setShowEdit(false); }}
        />
      )}
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (pwd: string) => void }) {
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onLogin(pwd);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060d20] px-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-black text-white text-center mb-2">🔐 Admin Login</h1>
        <p className="text-white/40 text-sm text-center mb-6">Genesis 2K26 Dashboard</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Enter admin password"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/40 text-base focus:outline-none focus:border-yellow-400/60 transition"
            autoFocus
          />
          <button
            type="submit"
            disabled={!pwd || loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl text-base transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeSport, setActiveSport] = useState(SPORTS_CONFIG[0].name);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogin = (pwd: string) => {
    const adminPwd = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (adminPwd && pwd !== adminPwd) {
      toast.error('Incorrect password');
      return;
    }
    setAuthenticated(true);
    setPassword(pwd);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPassword('');
    setTeams([]);
  };

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/teams?sport=${encodeURIComponent(activeSport)}`,
        { headers: { 'x-admin-password': password } }
      );
      if (res.status === 401) {
        toast.error('Unauthorized — check your password');
        setAuthenticated(false);
        return;
      }
      if (!res.ok) { toast.error('Failed to load teams'); return; }
      const data = (await res.json()) as { teams: TeamData[] };
      setTeams(data.teams);
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }, [activeSport, password]);

  useEffect(() => {
    if (authenticated) {
      setSearchQuery('');
      void fetchTeams();
    }
  }, [authenticated, fetchTeams]);

  const handleTeamSaved = (updated: TeamData) => {
    setTeams((prev) => prev.map((t) => (t.teamCode === updated.teamCode ? updated : t)));
  };

  const handleTeamDeleted = (code: string) => {
    setTeams((prev) => prev.filter((t) => t.teamCode !== code));
  };

  const handleExportCsv = () => {
    const sport = SPORTS_CONFIG.find((s) => s.name === activeSport);
    const maxMembers = sport?.maxMembers ?? 1;
    const csv = buildCsv(filteredTeams, maxMembers);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `genesis-2k26-${activeSport.toLowerCase().replace(/\s+/g, '-')}-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTeams = teams.filter((t) => {
    const q = searchQuery.toLowerCase();
    return !q || t.teamName.toLowerCase().includes(q) || t.teamCode.toLowerCase().includes(q);
  });

  if (!authenticated) {
    return (
      <>
        <Toaster position="top-center" />
        <LoginScreen onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#060d20] text-white">
      <Toaster position="top-right" />

      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-[#060d20]/80 backdrop-blur-sm sticky top-0 z-10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-lg font-black text-white whitespace-nowrap">
            🏆 Genesis 2K26 — Admin
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search teams or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-white placeholder-white/40 text-sm focus:outline-none focus:border-yellow-400/60 transition w-48"
            />
            <button
              onClick={handleExportCsv}
              disabled={filteredTeams.length === 0}
              className="text-sm px-3 py-1.5 border border-white/20 text-white/70 rounded-lg hover:bg-white/5 disabled:opacity-40 transition"
            >
              📥 Export CSV
            </button>
            <button
              onClick={() => void fetchTeams()}
              disabled={loading}
              className="text-sm px-3 py-1.5 border border-white/20 text-white/70 rounded-lg hover:bg-white/5 disabled:opacity-40 transition"
            >
              {loading ? '⟳' : '🔄'}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 border border-red-400/30 text-red-400/70 rounded-lg hover:bg-red-400/10 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* ── Sport tabs ── */}
      <div className="border-b border-white/10 bg-[#060d20]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-2 scrollbar-hide">
            {SPORTS_CONFIG.map((sport) => (
              <button
                key={sport.slug}
                onClick={() => setActiveSport(sport.name)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeSport === sport.name
                    ? 'bg-yellow-400 text-black font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {sport.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Team list ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/50 text-sm">
            {loading
              ? 'Loading...'
              : `${filteredTeams.length} team${filteredTeams.length !== 1 ? 's' : ''} registered`}
            {searchQuery && ` (filtered from ${teams.length})`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
                <div className="h-5 bg-white/10 rounded w-1/3 mb-2" />
                <div className="h-4 bg-white/10 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🏅</p>
            <p className="text-white/40 text-lg">
              {searchQuery ? 'No teams match your search' : `No teams registered for ${activeSport} yet`}
            </p>
          </div>
        ) : (
          filteredTeams.map((team) => (
            <TeamCard
              key={team.teamCode}
              team={team}
              password={password}
              onSaved={handleTeamSaved}
              onDeleted={handleTeamDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}
