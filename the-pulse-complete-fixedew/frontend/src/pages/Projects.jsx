import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Users, X, Calendar, Trash2 } from 'lucide-react';
import { projectAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Projects = ({ searchQuery = '' }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);

  const [members, setMembers] = useState([]);
  const [deletingMember, setDeletingMember] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  const navigate = useNavigate();

  // ✅ ปรับ State ให้ตรงกับ Database (name, deadline)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    deadline: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    deadline: '',
  });

  const [memberForm, setMemberForm] = useState({
    emailOrName: '', // ✅ Backend เรารับค่าเป็น emailOrName
    role: 'member',
  });

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectAPI.getProjects();
      // ✅ Backend เราส่ง Array มาใน data.data โดยตรง ไม่ต้อง .projects ต่อ
      setProjects(response?.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (projectId) => {
    try {
      const response = await projectAPI.getMembers(projectId);
      // ✅ Backend ส่ง Array มาตรงๆ เช่นกัน
      setMembers(response?.data?.data || []);
    } catch (error) {
      console.error('Fetch members error:', error);
      toast.error('Failed to fetch members');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ ส่งฟอร์มที่แก้ key แล้ว (name, deadline)
      await projectAPI.createProject(createForm);
      toast.success('Project created successfully');
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', deadline: '' });
      fetchProjects();
    } catch (error) {
      console.error('Create project error:', error);
      toast.error(error?.response?.data?.message || 'Failed to create project');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      // ✅ ใช้ .id แทน .project_id
      await projectAPI.updateProject(selectedProject.id, editForm);
      toast.success('Project updated successfully');
      setShowEditModal(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Update project error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async (projectId, projectTitle) => {
    const ok = window.confirm(
      `Are you sure you want to delete "${projectTitle}"?\nThis action cannot be undone!`
    );
    if (!ok) return;

    setDeletingProject(projectId);
    try {
      await projectAPI.deleteProject(projectId);
      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      console.error('Delete project error:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeletingProject(null);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    const value = (memberForm.emailOrName || '').trim();
    if (!value) {
      toast.error('Please enter email or username');
      return;
    }

    try {
      // ✅ key ต้องตรงกับ Backend (emailOrName)
      await projectAPI.addMember(selectedProject.id, { emailOrName: value, role: memberForm.role });

      toast.success('Member added successfully');
      setMemberForm({ emailOrName: '', role: 'member' });
      fetchMembers(selectedProject.id);
    } catch (error) {
      console.error('Add member error:', error);
      toast.error(error?.response?.data?.message || 'User not found or already added');
    }
  };

  const handleRemoveMember = async (userId, username) => {
    if (!selectedProject) return;

    // TODO: ต้องทำ API removeMember เพิ่มใน Backend ถ้ายังไม่มี (แต่ใส่ UI ไว้ก่อนได้)
    // ตอนนี้ปิดไว้หรือแจ้งเตือนก่อน
    alert("Feature 'Remove Member' coming soon (Backend implementation needed)");
    
    /* const ok = window.confirm(`Are you sure you want to remove ${username} from this project?`);
    if (!ok) return;

    setDeletingMember(userId);
    try {
      await projectAPI.removeMember(selectedProject.id, userId);
      toast.success('Member removed successfully');
      fetchMembers(selectedProject.id);
    } catch (error) {
      console.error('Remove member error:', error);
      toast.error('Failed to remove member');
    } finally {
      setDeletingMember(null);
    }
    */
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setEditForm({
      name: project.name || '', // ✅ ใช้ name
      description: project.description || '',
      deadline: project.deadline ? format(new Date(project.deadline), 'yyyy-MM-dd') : '', // ✅ ใช้ deadline
    });
    setShowEditModal(true);
  };

  const openMembersModal = async (project) => {
    setSelectedProject(project);
    setShowMembersModal(true);
    await fetchMembers(project.id); // ✅ ใช้ id
  };

  const filteredProjects = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return projects;

    return projects.filter((project) => {
      // ✅ ใช้ name แทน title
      const title = (project.name || '').toLowerCase();
      const desc = (project.description || '').toLowerCase();
      const creator = (project.creator_name || '').toLowerCase(); // ✅ ใช้ creator_name
      return title.includes(q) || desc.includes(q) || creator.includes(q);
    });
  }, [projects, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-bold uppercase">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 italic uppercase tracking-tighter">ALL PROJECTS</h1>
          <p className="text-red-600 text-xs font-bold tracking-widest uppercase">Mission Control Center</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all transform hover:scale-105 font-bold uppercase text-xs tracking-wider shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {/* Projects Count */}
      {searchQuery && (
        <div className="mb-6 text-sm font-bold text-gray-500 uppercase tracking-wide">
          Found <span className="text-red-600">{filteredProjects.length}</span> project(s) matching "{searchQuery}"
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-20 border-4 border-dashed border-gray-200 rounded-3xl">
            <p className="text-gray-400 text-xl font-black italic uppercase">
              {searchQuery
                ? `No projects found matching "${searchQuery}"`
                : 'No projects yet. Initiate your first mission!'}
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id} // ✅ ใช้ project.id
              className="bg-white rounded-[2rem] shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  ID // {project.id}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(project)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Edit project"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>

                  <button
                    onClick={() => openMembersModal(project)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Manage members"
                  >
                    <Users className="w-4 h-4 text-gray-600" />
                  </button>

                  <button
                    onClick={() => handleDeleteProject(project.id, project.name)}
                    disabled={deletingProject === project.id}
                    className="p-2 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                    title="Delete project"
                  >
                    {deletingProject === project.id ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-600" />
                    )}
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-black text-gray-900 mb-3 italic uppercase leading-none truncate">
                {project.name} {/* ✅ ใช้ project.name */}
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-medium line-clamp-2 h-8">
                {project.description || 'NO BRIEFING PROVIDED.'}
              </p>

              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 mb-2 uppercase tracking-wide">
                <Users className="w-3 h-3" />
                <span>LEADER: {project.creator_name || 'UNKNOWN'}</span> {/* ✅ ใช้ creator_name */}
              </div>

              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 mb-6 uppercase tracking-wide">
                <Calendar className="w-3 h-3 text-red-600" />
                <span>
                  DEADLINE: {project.deadline ? format(new Date(project.deadline), 'dd MMM yyyy') : 'NO DATE'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-6 border-t-2 border-gray-100 border-dashed">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-white shadow-md">
                    {(project.creator_name?.[0] || 'U').toUpperCase()}
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase">
                    {project.member_count} AGENTS
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/projects/${project.id}/tasks`)} // ✅ ลิงก์ไปหน้า Tasks
                  className="text-red-600 hover:text-red-700 font-black text-[10px] flex items-center gap-1 uppercase tracking-widest hover:translate-x-1 transition-transform"
                >
                  ACCESS DATA <span className="text-lg leading-none">→</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- Create Project Modal --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-white">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">NEW MISSION</h2>
              <button onClick={() => setShowCreateModal(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">CODENAME (NAME)</label>
                <input
                  type="text"
                  value={createForm.name} // ✅ ใช้ name
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black font-bold text-sm transition-colors"
                  placeholder="Ex. PROJECT OMEGA"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">BRIEFING (DESC)</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black font-medium text-sm transition-colors"
                  rows="3"
                  placeholder="Mission details..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">DEADLINE</label>
                <input
                  type="date"
                  value={createForm.deadline} // ✅ ใช้ deadline
                  onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black font-bold text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5" />
                INITIATE PROJECT
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- Edit Project Modal --- */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">EDIT MISSION</h2>
              <button onClick={() => setShowEditModal(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">CODENAME</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">BRIEFING</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black font-medium text-sm"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">DEADLINE</label>
                <input
                  type="date"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black font-bold text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest transition-all"
              >
                <Edit className="w-4 h-4" />
                UPDATE DATA
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- Members Modal --- */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">SQUAD LIST</h2>
              <button onClick={() => setShowMembersModal(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="mb-8">
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">ADD OPERATIVE (EMAIL/NAME)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={memberForm.emailOrName} // ✅ ใช้ emailOrName
                  onChange={(e) => setMemberForm({ ...memberForm, emailOrName: e.target.value })}
                  className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black font-bold text-sm"
                  placeholder="agent@thepulse.ai"
                />
                <button
                  type="submit"
                  className="bg-black hover:bg-gray-800 text-white px-6 rounded-xl font-black text-xs uppercase tracking-wider"
                >
                  ADD
                </button>
              </div>
            </form>

            {/* Members List */}
            <div className="space-y-3">
              {members.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl">
                  <p className="text-gray-400 font-bold uppercase text-xs">NO OPERATIVES ASSIGNED</p>
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id} // ✅ ใช้ member.id
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100"
                  >
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-black border-2 border-white shadow-sm flex-shrink-0">
                      {(member.name?.[0] || '?').toUpperCase()} {/* ✅ ใช้ member.name */}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-gray-900 truncate uppercase">
                        {member.name}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{member.role}</p>
                    </div>

                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        className="p-2 bg-white rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-600 transition-colors"
                        title="Remove member"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;