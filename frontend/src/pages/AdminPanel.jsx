import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  PieChart, Users, FileText, Database, 
  LayoutDashboard, Activity, Edit, Trash2, ShieldCheck,
  ChevronDown, ChevronRight, HardDrive, Cpu,
  Monitor, CheckCircle2
} from 'lucide-react';

const AdminPanel = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [dbUsers, setDbUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [serverMetrics, setServerMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState({ history: true });

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) setDbUsers(response.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) setDashboardStats(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/metrics?range=1h', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) setServerMetrics(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLogs = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'log_login' ? 'logs/login' : 'logs/action';
      const response = await axios.get(`http://localhost:5000/api/admin/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) setLogs(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/users/${editModal.id}`, editModal, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditModal(null);
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/users/${deleteConfirm.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteConfirm(null);
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  // Polling interval
  useEffect(() => {
    let interval;
    setLogs([]);
    if (activeMenu === 'members') {
      fetchUsers();
    } else if (activeMenu === 'dashboard') {
      fetchDashboardStats();
      interval = setInterval(fetchDashboardStats, 10000);
    } else if (activeMenu === 'database') {
      fetchMetrics();
      interval = setInterval(fetchMetrics, 5000);
    } else if (activeMenu === 'log_login' || activeMenu === 'log_action') {
      fetchLogs(activeMenu);
      interval = setInterval(() => fetchLogs(activeMenu), 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeMenu]);

  // Socket.IO real-time
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('new_action_log', () => {
      if (activeMenu === 'log_action') fetchLogs('log_action');
    });

    socket.on('new_login_log', () => {
      if (activeMenu === 'log_login') fetchLogs('log_login');
    });

    return () => socket.disconnect();
  }, [activeMenu]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  };

  return (
    <div className="flex min-h-[calc(100vh-2rem)] bg-white text-gray-800 rounded-xl overflow-hidden border border-gray-100 shadow-sm font-sans">

      {/* Sidebar */}
      <div className="w-72 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4 flex flex-col gap-6">
        <div className="px-2 pb-4 border-b border-gray-200 mb-2">
          <h2 className="text-black font-black uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="text-red-500 w-6 h-6" />
            Control Center
          </h2>
        </div>
        <div>
          <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-2">ข้อมูลระบบ</h3>
          <div className="space-y-1">
            <MenuButton active={activeMenu === 'dashboard'} onClick={() => setActiveMenu('dashboard')} icon={<PieChart size={18} />} label="แดชบอร์ดแอดมิน" />
            <MenuButton active={activeMenu === 'members'} onClick={() => setActiveMenu('members')} icon={<Users size={18} />} label="ข้อมูลสมาชิก" />
            <MenuButton active={activeMenu === 'database'} onClick={() => setActiveMenu('database')} icon={<Database size={18} />} label="สถานะเซิร์ฟเวอร์" />
          </div>
        </div>
        <div className="h-px bg-gray-200 w-full"></div>
        <div>
          <button onClick={() => toggleMenu('history')} className="w-full flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-2 hover:text-black transition-colors focus:outline-none">
            <div className="flex items-center gap-2"><FileText size={14} /> ประวัติทั้งหมด (Audit Logs)</div>
            {expandedMenus.history ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expandedMenus.history && (
            <div className="space-y-1 pl-4 border-l border-gray-200 ml-4">
              <MenuButton active={activeMenu === 'log_login'} onClick={() => setActiveMenu('log_login')} icon={<Activity size={16} />} label="ประวัติการเข้าสู่ระบบ" isSub />
              <MenuButton active={activeMenu === 'log_action'} onClick={() => setActiveMenu('log_action')} icon={<Edit size={16} />} label="ประวัติการแก้ไขข้อมูล" isSub />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 bg-white overflow-y-auto">

        {activeMenu === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-950 mb-1">ภาพรวมระบบ (System Overview)</h1>
                <p className="text-sm text-gray-500">สถิติและสถานะจาก Database แบบเรียลไทม์</p>
              </div>
              <button onClick={fetchDashboardStats} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center gap-2">
                <Activity size={16} /> รีเฟรชข้อมูล
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <StatCard label="ผู้ใช้งานทั้งหมด" value={dashboardStats?.totalUsers} icon={<Users size={20} />} color="blue" />
              <StatCard label="โปรเจกต์ในระบบ" value={dashboardStats?.totalProjects} icon={<LayoutDashboard size={20} />} color="purple" />
              <StatCard label="สถานะระบบ" value={dashboardStats?.systemHealth} icon={<CheckCircle2 size={20} />} color={dashboardStats?.systemHealth === "Healthy" ? "green" : "red"} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4">สมาชิกล่าสุด</h3>
                <div className="space-y-4">
                  {dashboardStats?.recentUsers?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs uppercase">{user.name?.substring(0, 2)}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }) : ''}</span>
                    </div>
                  )) || <p className="text-sm text-gray-500 py-4 text-center">กำลังโหลดข้อมูล...</p>}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4">สถานะทรัพยากร</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Activity size={14} className={dashboardStats?.systemHealth === "Healthy" ? "text-green-500 mt-1" : "text-red-500 mt-1"} />
                    <div>
                      <p className="text-sm text-gray-800 font-medium">
                        {dashboardStats?.systemHealth === "Healthy" ? "Database Connected" : "Database Warning"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {dashboardStats?.systemHealth === "Healthy" ? "Neon Cloud ตอบสนองปกติ" : "พบข้อผิดพลาดในการดึงข้อมูลจาก Neon Cloud"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'members' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-950">รายชื่อสมาชิกทั้งหมด</h1>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">ชื่อ - นามสกุล</th>
                    <th className="px-6 py-4 font-medium">อีเมล</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr><td colSpan="4" className="text-center py-10 text-gray-400">กำลังดึงข้อมูล...</td></tr>
                  ) : dbUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-950 font-medium">{user.name}</td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setEditModal({ ...user })} className="text-gray-400 hover:text-gray-900 p-2 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => setDeleteConfirm({ id: user.id, name: user.name })} className="text-gray-400 hover:text-red-500 p-2 ml-1 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeMenu === 'database' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold text-gray-950 mb-1">สถานะเซิร์ฟเวอร์</h1>
            <p className="text-sm text-gray-500 mb-6">ข้อมูลทรัพยากรระบบแบบเรียลไทม์ (อัปเดตทุก 5 วินาที)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MetricCard label="CPU Usage" value={serverMetrics?.cpuUsage} suffix="%" icon={<Cpu size={20} />} color="blue" />
              <MetricCard label="RAM Usage" value={serverMetrics?.memoryUsage?.used} suffix=" GB" total={serverMetrics?.memoryUsage?.total} icon={<Monitor size={20} />} color="purple" />
              <MetricCard label="Storage" value={serverMetrics?.diskUsage?.usedPercent} suffix="%" icon={<HardDrive size={20} />} color="green" />
            </div>
          </div>
        )}

        {(activeMenu === 'log_login' || activeMenu === 'log_action') && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold text-gray-950 mb-6">
              {activeMenu === 'log_login' ? 'ประวัติการเข้าสู่ระบบ' : 'ประวัติการแก้ไขข้อมูล'} (Real-time)
            </h1>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">เวลา</th>
                    <th className="px-6 py-4 font-medium">{activeMenu === 'log_login' ? 'ผู้ใช้งาน' : 'ผู้กระทำ'}</th>
                    <th className="px-6 py-4 font-medium">{activeMenu === 'log_login' ? 'IP Address' : 'Action'}</th>
                    <th className="px-6 py-4 font-medium">{activeMenu === 'log_login' ? 'สถานะ' : 'เป้าหมาย'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-500">{formatDate(log.created_at)}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{log.email || log.actor || 'Unknown'}</td>
                      <td className="px-6 py-4 font-mono text-xs">{log.ip_address || log.action}</td>
                      <td className="px-6 py-4">
                        {activeMenu === 'log_action' ? (
                          <span className="font-bold text-gray-700">{log.target || 'N/A'}</span>
                        ) : (
                          <span className={`font-bold ${log.status?.toUpperCase() === 'SUCCESS' ? 'text-green-600' : 'text-red-500'}`}>
                            {log.status?.toUpperCase() === 'SUCCESS' ? 'สำเร็จ' : log.status?.toUpperCase() === 'FAILED' ? 'ล้มเหลว' : log.status || 'N/A'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-10 text-gray-400">ไม่พบประวัติข้อมูลในขณะนี้</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!['dashboard', 'members', 'database', 'log_login', 'log_action'].includes(activeMenu) && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-in fade-in">
            <LayoutDashboard className="w-16 h-16 mb-4 opacity-10" />
            <h2 className="text-xl font-bold text-gray-600">กำลังพัฒนาหน้า {activeMenu}</h2>
          </div>
        )}

      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-96">
            <h2 className="text-lg font-bold text-gray-900 mb-4">แก้ไขข้อมูลสมาชิก</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">ชื่อ</label>
                <input
                  value={editModal.name}
                  onChange={e => setEditModal({ ...editModal, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">อีเมล</label>
                <input
                  value={editModal.email}
                  onChange={e => setEditModal({ ...editModal, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                <select
                  value={editModal.role}
                  onChange={e => setEditModal({ ...editModal, role: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditModal(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={handleUpdate} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
            <h2 className="text-lg font-bold text-gray-900 mb-2">ยืนยันการลบ</h2>
            <p className="text-sm text-gray-500 mb-5">
              คุณต้องการลบสมาชิก <span className="font-bold text-gray-800">{deleteConfirm.name}</span> ออกจากระบบใช่หรือไม่?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold">
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => {
  const colorMap = {
    blue: "border-l-blue-500 text-blue-500 bg-blue-50",
    purple: "border-l-purple-500 text-purple-500 bg-purple-50",
    green: "border-l-green-500 text-green-500 bg-green-50",
    red: "border-l-red-500 text-red-500 bg-red-50"
  };
  return (
    <div className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 ${colorMap[color].split(' ')[0]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{label}</p>
          <h4 className="text-2xl font-black text-gray-900">{value ?? '-'}</h4>
        </div>
        <div className={`p-2 rounded-lg ${colorMap[color].split(' ').slice(1).join(' ')}`}>{icon}</div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, suffix, total, icon, color }) => {
  const percent = total ? (value / total) * 100 : (value || 0);
  const colorClass = color === 'blue' ? 'bg-blue-500' : color === 'purple' ? 'bg-purple-500' : 'bg-green-500';
  const textClass = color === 'blue' ? 'text-blue-500' : color === 'purple' ? 'text-purple-500' : 'text-green-500';
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
      <div className={`${textClass} mb-4 flex justify-center`}>{icon}</div>
      <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</h4>
      <p className="text-3xl font-black text-gray-900 mb-4">
        {value !== undefined && value !== null ? `${Math.round(value)}${suffix}` : '...'}
      </p>
      <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
        <div className={`${colorClass} h-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
};

const MenuButton = ({ active, onClick, icon, label, isSub = false }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-bold ${active ? 'bg-red-50 text-red-600 shadow-inner' : 'text-gray-500 hover:bg-gray-100'} ${isSub ? 'text-[12px] py-1.5 ml-2 border-l-2 border-transparent' : ''}`}>
    <span className={active ? 'text-red-500' : 'text-gray-400'}>{icon}</span>{label}
  </button>
);

export default AdminPanel;