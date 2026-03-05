import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Users, Zap, AlertTriangle, Clock, 
  Server, ShieldAlert, BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { adminAPI, systemAPI } from '../services/api';

const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [isRealtime, setIsRealtime] = useState(false);
  const [timeRange, setTimeRange] = useState('1h');
  const [data, setData] = useState({
    kpis: null,
    charts: null,
    topEndpoints: [],
    slowRequests: [],
    systemHealth: null
  });

  const fetchAdminData = useCallback(async () => {
    try {
      const [metricsRes, healthRes] = await Promise.all([
        adminAPI.getMetrics(timeRange),
        systemAPI.getHealth(),
      ]);

      const metrics = metricsRes.data?.data || null;
      setData({
        kpis: metrics?.kpis || null,
        charts: metrics?.charts || null,
        topEndpoints: metrics?.topEndpoints || [],
        slowRequests: metrics?.slowRequests || [],
        systemHealth: healthRes.data || null
      });
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Handle Auto-refresh / Realtime
  useEffect(() => {
    fetchAdminData();
    let interval;
    if (isRealtime) {
      interval = setInterval(fetchAdminData, 5000); // Refresh ทุก 5 วินาที
    }
    return () => clearInterval(interval);
  }, [fetchAdminData, isRealtime]);

  if (loading) return <div className="p-8 text-center">Loading Admin Metrics...</div>;

  const chartData = (data.charts?.timeseries || []).map((p) => ({
    ...p,
    t: new Date(p.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* A) Global Filters */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="text-indigo-600" /> Admin Control Panel
        </h1>
        <div className="flex gap-4 items-center">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="15m">Last 15m</option>
            <option value="1h">Last 1h</option>
            <option value="24h">Last 24h</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isRealtime} 
              onChange={() => setIsRealtime(!isRealtime)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Real-time Mode</span>
          </label>
        </div>
      </div>

      {/* B) KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KPICard title="Requests/min" value={data.kpis?.rpm} icon={<Zap size={20}/>} color="blue" />
        <KPICard title="Active Users" value={data.kpis?.activeUsers} icon={<Users size={20}/>} color="green" />
        <KPICard title="Socket Conn." value={data.kpis?.sockets} icon={<Activity size={20}/>} color="purple" />
        <KPICard title="Error Rate" value={`${data.kpis?.errorRate}%`} icon={<AlertTriangle size={20}/>} color="red" />
        <KPICard title="Latency P95" value={`${data.kpis?.p95}ms`} icon={<Clock size={20}/>} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* C) Traffic Chart Area */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 size={18}/> Traffic & Latency Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="rpm" name="RPM" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="errors" name="5xx" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="p95" name="P95 (ms)" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* E) System Health */}
        <div className="bg-white p-4 rounded-lg shadow-sm border text-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Server size={18}/> System Health</h3>
          <div className="space-y-3">
            <HealthItem label="Status" value={data.systemHealth?.message} status="success" />
            <HealthItem label="Timestamp" value={data.systemHealth?.timestamp} />
            <HealthItem label="Socket" value={data.systemHealth?.socket_status} />
            <div className="pt-2 border-t mt-2">
              <p className="text-xs text-gray-500">Tip: use Grafana/Prometheus for infra stats</p>
            </div>
          </div>
        </div>

        {/* D) Drill-down Tables */}
        <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="font-bold mb-4">Top Endpoints (High Traffic/Errors)</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2">Path</th>
                <th className="pb-2">Method</th>
                <th className="pb-2">Count</th>
                <th className="pb-2">Error %</th>
                <th className="pb-2">P95 Latency</th>
              </tr>
            </thead>
            <tbody>
              {data.topEndpoints.map((ep, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-mono text-xs">{ep.path}</td>
                  <td className="py-2"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] uppercase font-bold">{ep.method}</span></td>
                  <td className="py-2">{ep.count}</td>
                  <td className="py-2 text-red-500">{ep.error_rate}%</td>
                  <td className="py-2 font-medium">{ep.p95}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Small Helper Components
const KPI_STYLES = {
  blue:   { wrap: 'bg-blue-50 text-blue-600', border: 'border-l-blue-500' },
  green:  { wrap: 'bg-green-50 text-green-600', border: 'border-l-green-500' },
  purple: { wrap: 'bg-purple-50 text-purple-600', border: 'border-l-purple-500' },
  red:    { wrap: 'bg-red-50 text-red-600', border: 'border-l-red-500' },
  orange: { wrap: 'bg-orange-50 text-orange-600', border: 'border-l-orange-500' },
};

const KPICard = ({ title, value, icon, color }) => {
  const styles = KPI_STYLES[color] || { wrap: 'bg-slate-50 text-slate-600', border: 'border-l-slate-300' };
  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${styles.border}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-500 uppercase font-bold">{title}</p>
          <h4 className="text-xl font-bold mt-1">{value || '0'}</h4>
        </div>
        <div className={`p-2 ${styles.wrap} rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
};

const HealthItem = ({ label, value, status }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-600">{label}:</span>
    <span className={`font-medium ${status === 'success' ? 'text-green-600' : ''}`}>{value}</span>
  </div>
);

export default AdminPanel;