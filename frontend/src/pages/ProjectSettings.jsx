import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Save, X, Shield,
  Users, Check, Pencil, Crown,
  LayoutDashboard, CheckSquare, DollarSign, ShieldAlert, Target,
  UserPlus, Mail,
} from 'lucide-react';
import { projectAPI } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── API helpers ───────────────────────────────────────────────────────────────
const rolesAPI = {
  getRoles:   (projectId)               => api.get(`/projects/${projectId}/roles`),
  createRole: (projectId, data)         => api.post(`/projects/${projectId}/roles`, data),
  updateRole: (projectId, roleId, data) => api.put(`/projects/${projectId}/roles/${roleId}`, data),
  deleteRole: (projectId, roleId)       => api.delete(`/projects/${projectId}/roles/${roleId}`),
  assignRole: (projectId, userId, data) => api.put(`/projects/${projectId}/members/${userId}/role`, data),
};

// ─── Constants ─────────────────────────────────────────────────────────────────
const PRESET_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444',
  '#f97316','#eab308','#22c55e','#14b8a6',
  '#3b82f6','#64748b',
];

const PERMISSIONS = [
  { key: 'can_view_tasks',      label: 'Tasks Kanban',  icon: CheckSquare, color: 'text-blue-400' },
  { key: 'can_view_finance',    label: 'Financial Hub', icon: DollarSign,  color: 'text-green-400' },
  { key: 'can_view_risk',       label: 'Risk Sentinel', icon: ShieldAlert, color: 'text-red-400' },
  { key: 'can_view_decisions',  label: 'Decision Hub',  icon: Target,      color: 'text-purple-400' },
];

const DEFAULT_PERMS = {
  can_view_tasks: true,
  can_view_finance: false,
  can_view_risk: false,
  can_view_decisions: false,
};

// ─── Add Member Modal ──────────────────────────────────────────────────────────
const AddMemberModal = ({ projectId, onClose, onSaved }) => {
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!input.trim()) return toast.error('Enter email or username');
    setAdding(true);
    try {
      await projectAPI.addMember(projectId, { emailOrUsername: input.trim() });
      toast.success('Member added!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#13151a] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-indigo-400" />
            <h3 className="font-black text-sm tracking-widest uppercase text-white">Add Member</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <label className="block text-[10px] font-black tracking-widest text-gray-500 mb-2 uppercase">
            Email or Username
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="somchai or somchai@email.com"
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-white/5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-sm font-bold transition-colors">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <UserPlus size={14} />
            {adding ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Role Card ─────────────────────────────────────────────────────────────────
const RoleCard = ({ role, onEdit, onDelete, memberCount }) => (
  <div className="group relative bg-[#16181d] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all duration-200">
    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: role.color }} />
    <div className="pl-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: role.color }} />
          <span className="font-black text-sm tracking-wide text-white truncate uppercase">{role.name}</span>
          {memberCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
              {memberCount} members
            </span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(role)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(role)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {PERMISSIONS.map(({ key, label, icon: Icon, color }) => {
          const active = role[key];
          return (
            <span key={key} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-all ${
              active ? 'bg-white/10 text-white border border-white/10' : 'bg-white/3 text-gray-600 border border-white/5'
            }`}>
              <Icon size={9} className={active ? color : ''} />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  </div>
);

// ─── Role Editor Modal ─────────────────────────────────────────────────────────
const RoleModal = ({ role, projectId, onClose, onSaved }) => {
  const isEdit = !!role?.id;
  const [form, setForm] = useState({
    name:  role?.name  || '',
    color: role?.color || PRESET_COLORS[0],
    ...DEFAULT_PERMS,
    ...(role ? Object.fromEntries(PERMISSIONS.map(p => [p.key, !!role[p.key]])) : {}),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Role name is required');
    setSaving(true);
    try {
      if (isEdit) {
        await rolesAPI.updateRole(projectId, role.id, form);
        toast.success('Role updated');
      } else {
        await rolesAPI.createRole(projectId, form);
        toast.success('Role created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#13151a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-indigo-400" />
            <h3 className="font-black text-sm tracking-widest uppercase text-white">
              {isEdit ? 'Edit Role' : 'New Role'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-[10px] font-black tracking-widest text-gray-500 mb-2 uppercase">Role Name</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Developer, Designer..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black tracking-widest text-gray-500 mb-2 uppercase">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#13151a]' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black tracking-widest text-gray-500 mb-3 uppercase">Page Access</label>
            <div className="space-y-2">
              {PERMISSIONS.map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    form[key] ? 'bg-white/8 border-white/15 text-white' : 'bg-white/3 border-white/5 text-gray-500 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} className={form[key] ? color : ''} />
                    <span className="text-sm font-bold">{label}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    form[key] ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'
                  }`}>
                    {form[key] && <Check size={11} className="text-white" strokeWidth={3} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-white/5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-sm font-bold transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Role'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const ProjectSettings = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project,       setProject]       = useState(null);
  const [roles,         setRoles]         = useState([]);
  const [members,       setMembers]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingRole,   setEditingRole]   = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [pRes, rRes, mRes] = await Promise.all([
        projectAPI.getProject(projectId),
        rolesAPI.getRoles(projectId),
        projectAPI.getMembers(projectId),
      ]);
      setProject(pRes?.data?.data?.project ?? null);
      setRoles(rRes?.data?.data?.roles ?? []);
      setMembers(mRes?.data?.data?.members ?? []);
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isOwner = project && user &&
    String(project.created_by ?? project.creator_id ?? project.owner_id) === String(user.id);

  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    try {
      await rolesAPI.deleteRole(projectId, role.id);
      toast.success('Role deleted');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleAssignRole = async (userId, roleId) => {
    try {
      await rolesAPI.assignRole(projectId, userId, { role_id: roleId || null });
      toast.success('Role assigned');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to assign role');
    }
  };

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Remove "${member.username}" from project?`)) return;
    try {
      await projectAPI.removeMember(projectId, member.user_id);
      toast.success('Member removed');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove member');
    }
  };

  const memberCountForRole = (roleId) =>
    members.filter(m => String(m.role_id) === String(roleId)).length;

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isOwner) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
      <Shield size={40} className="text-gray-600" />
      <p className="text-gray-400 font-bold">Only the project owner can access Settings</p>
      <button onClick={() => navigate(-1)} className="text-sm text-indigo-400 hover:text-indigo-300 font-bold">← Go Back</button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-white transition-colors mb-4">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
            <LayoutDashboard size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">
              {project?.title || `Project #${projectId}`}
            </h1>
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Settings</p>
          </div>
        </div>
      </div>

      {/* ── ROLES ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-indigo-400" />
            <h2 className="font-black text-xs tracking-widest uppercase text-gray-300">Roles</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-500">{roles.length}</span>
          </div>
          <button
            onClick={() => { setEditingRole(null); setShowRoleModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black tracking-wide transition-colors"
          >
            <Plus size={12} /> New Role
          </button>
        </div>

        {roles.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
            <Shield size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-bold">No roles yet</p>
            <p className="text-gray-600 text-xs mt-1">Create roles to control what members can see</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                memberCount={memberCountForRole(role.id)}
                onEdit={r => { setEditingRole(r); setShowRoleModal(true); }}
                onDelete={handleDeleteRole}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── MEMBERS ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-indigo-400" />
            <h2 className="font-black text-xs tracking-widest uppercase text-gray-300">Members</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-500">{members.length}</span>
          </div>
          {/* ✅ Add Member button */}
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black tracking-wide transition-colors"
            >
            <UserPlus size={12} /> Add Member
           </button>
        </div>

        <div className="bg-[#16181d] border border-white/5 rounded-2xl overflow-hidden">
          {members.map((m, i) => {
            const isProjectOwner =
              String(m.user_id) === String(project?.created_by ?? project?.creator_id ?? project?.owner_id);
            const assignedRole = roles.find(r => String(r.id) === String(m.role_id));

            return (
              <div
                key={m.user_id}
                className={`flex items-center gap-4 px-5 py-3.5 group ${i < members.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ backgroundColor: assignedRole?.color ?? '#374151' }}
                >
                  {(m.username || '?')[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate uppercase">{m.username}</span>
                    {isProjectOwner && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/20">
                        <Crown size={8} /> OWNER
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">{m.email}</p>
                </div>

                {/* Role selector + Remove */}
                <div className="flex items-center gap-2">
                  {isProjectOwner ? (
                    <span className="text-xs text-gray-600 font-bold italic">All access</span>
                  ) : (
                    <>
                      <select
                        value={m.role_id ?? ''}
                        onChange={e => handleAssignRole(m.user_id, e.target.value)}
                        className="text-xs font-bold bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        style={{ color: assignedRole?.color ?? '#9ca3af' }}
                      >
                        <option value="">— No Role —</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>

                      {/* ✅ Remove member — hover เพื่อแสดง */}
                      <button
                        onClick={() => handleRemoveMember(m)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                        title="Remove member"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm font-bold">No members yet</div>
          )}
        </div>
      </section>

      {/* Modals */}
      {showRoleModal && (
        <RoleModal
          role={editingRole}
          projectId={projectId}
          onClose={() => { setShowRoleModal(false); setEditingRole(null); }}
          onSaved={fetchData}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAddMember(false)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
};

export default ProjectSettings;