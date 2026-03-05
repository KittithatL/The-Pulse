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

  const [createForm, setCreateForm] = useState({ title: '', description: '', deadline: '' });
  const [editForm, setEditForm] = useState({ title: '', description: '', deadline: '' });

  const [memberForm, setMemberForm] = useState({
    emailOrUsername: '',
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
      setProjects(response?.data?.data?.projects ?? []);
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
      setMembers(response?.data?.data?.members ?? []);
    } catch (error) {
      console.error('Fetch members error:', error);
      toast.error('Failed to fetch members');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.createProject(createForm);
      toast.success('Project created successfully');
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', deadline: '' });
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
      await projectAPI.updateProject(selectedProject.project_id, editForm);
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

    const value = (memberForm.emailOrUsername || '').trim();
    if (!value) {
      toast.error('Please enter email or username');
      return;
    }

    try {
      // ✅ ส่งเฉพาะ emailOrUsername ให้ตรง backend
      await projectAPI.addMember(selectedProject.project_id, { emailOrUsername: value });

      toast.success('Member added successfully');
      setMemberForm({ emailOrUsername: '', role: 'member' });
      fetchMembers(selectedProject.project_id);
    } catch (error) {
      console.error('Add member error:', error);
      toast.error(error?.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId, username) => {
    if (!selectedProject) return;

    const ok = window.confirm(`Are you sure you want to remove ${username} from this project?`);
    if (!ok) return;

    setDeletingMember(userId);
    try {
      await projectAPI.removeMember(selectedProject.project_id, userId);
      toast.success('Member removed successfully');
      fetchMembers(selectedProject.project_id);
    } catch (error) {
      console.error('Remove member error:', error);
      toast.error(error?.response?.data?.message || 'Failed to remove member');
    } finally {
      setDeletingMember(null);
    }
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setEditForm({
      title: project.title || '',
      description: project.description || '',
      deadline: project.deadline ? format(new Date(project.deadline), 'yyyy-MM-dd') : '',
    });
    setShowEditModal(true);
  };

  const openMembersModal = async (project) => {
    setSelectedProject(project);
    setShowMembersModal(true);
    await fetchMembers(project.project_id);
  };

  const filteredProjects = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return projects;

    return projects.filter((project) => {
      const title = (project.title || '').toLowerCase();
      const desc = (project.description || '').toLowerCase();
      const creator = (project.creator_username || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || creator.includes(q);
    });
  }, [projects, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 italic">ALL PROJECTS</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          Create Project
        </button>
      </div>

      {/* Projects Count */}
      {searchQuery && (
        <div className="mb-4 text-sm text-gray-600">
          Found <span className="font-semibold">{filteredProjects.length}</span> project(s) matching "
          {searchQuery}"
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchQuery
                ? `No projects found matching "${searchQuery}"`
                : 'No projects yet. Create your first project!'}
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.project_id}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-dark text-white px-3 py-1 rounded-full text-xs font-semibold">
                  #P-{project.project_id}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(project)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit project"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>

                  <button
                    onClick={() => openMembersModal(project)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Manage members"
                  >
                    <Users className="w-4 h-4 text-gray-600" />
                  </button>

                  <button
                    onClick={() => handleDeleteProject(project.project_id, project.title)}
                    disabled={deletingProject === project.project_id}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete project"
                  >
                    {deletingProject === project.project_id ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-500" />
                    )}
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2 italic">{project.title}</h3>
              <p className="text-sm text-gray-600 mb-4 italic line-clamp-2">
                "{project.description || 'No description'}"
              </p>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Users className="w-4 h-4" />
                <span>CREATED BY: {project.creator_username?.toUpperCase()}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar className="w-4 h-4" />
                <span>
                  {project.created_at ? format(new Date(project.created_at), 'yyyy-MM-dd') : '-'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {project.creator_username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm text-gray-600">{project.member_count} MEMBERS</span>
                </div>

                <button
                  onClick={() => navigate(`/projects/${project.project_id}/tasks`)}
                  className="text-primary hover:text-primary-dark font-semibold text-sm flex items-center gap-1"
                >
                  ENTER ENVIRONMENT →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold italic">CREATE PROJECT</h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">PROJECT NAME</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  PROJECT DESCRIPTION
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">END DATE</label>
                <input
                  type="date"
                  value={createForm.deadline}
                  onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold italic">EDIT PROJECT</h2>
              <button onClick={() => setShowEditModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">PROJECT NAME</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  PROJECT DESCRIPTION
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">END DATE</label>
                <input
                  type="date"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Update Project
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold italic">MEMBERS</h2>
              <button onClick={() => setShowMembersModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 mb-2">EMAIL / USERNAME</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={memberForm.emailOrUsername}
                  onChange={(e) => setMemberForm({ ...memberForm, emailOrUsername: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="staff@pulse.ai"
                />
                <button
                  type="submit"
                  className="bg-dark hover:bg-dark-light text-white px-6 py-2 rounded-lg font-semibold"
                >
                  ADD
                </button>
              </div>
            </form>

            {/* Members List */}
            <div className="space-y-3">
              {members.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No members yet</p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {member.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {(member.username || '').toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">{(member.role || '').toUpperCase()}</p>
                    </div>

                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id, member.username)}
                        disabled={deletingMember === member.user_id}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Remove member"
                      >
                        {deletingMember === member.user_id ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
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
