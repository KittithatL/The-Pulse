import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Dashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedMood, setSelectedMood] = useState(null);
  const [moodComment, setMoodComment] = useState("");
  const [submittingMood, setSubmittingMood] = useState(false);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const getAuthHeaders = useCallback(() => {
    const t = localStorage.getItem("token");
    return { Authorization: `Bearer ${t}` };
  }, []);

  // -----------------------------
  // 1) Fetch Projects (only once)
  // -----------------------------
  const fetchProjects = useCallback(async () => {
    try {
      const t = localStorage.getItem("token");
      if (!t) {
        setError("Please login first");
        navigate("/login");
        return [];
      }

      const res = await axios.get(`${API_URL}/projects`, {
        headers: getAuthHeaders(),
      });

      const list = res.data?.data || [];
      setProjects(list);
      return list;
    } catch (err) {
      console.error("Error fetching projects:", err);

      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/login"), 1000);
      } else if (err.code === "ERR_NETWORK") {
        setError("Cannot connect to server. Please ensure backend is running.");
      } else {
        setError(err.response?.data?.message || "Failed to load projects.");
      }

      return [];
    }
  }, [getAuthHeaders, navigate]);

  // --------------------------------------
  // 2) Decide Active Project ID (safe)
  // --------------------------------------
  const resolveActiveProjectId = useCallback(
    (projectList) => {
      // URL has projectId -> use it
      if (projectId) return Number(projectId);

      // If no projectId in URL -> use first project
      if (projectList.length > 0) return projectList[0].id;

      return null;
    },
    [projectId]
  );

  // --------------------------------------
  // 3) Fetch Dashboard Overview (safe)
  // --------------------------------------
  const fetchDashboardData = useCallback(
    async (useProjectId) => {
      setLoading(true);
      setError(null);

      try {
        const t = localStorage.getItem("token");
        if (!t) {
          setError("Please login first");
          navigate("/login");
          setLoading(false);
          return;
        }

        if (!useProjectId) {
          setError("No projects found. Please create a project first.");
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `${API_URL}/dashboard/${useProjectId}/overview`,
          { headers: getAuthHeaders() }
        );

        setDashboardData(res.data?.data || null);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard:", err);

        if (err.response?.status === 401) {
          setError("Session expired. Please login again.");
          setTimeout(() => navigate("/login"), 1200);
        } else if (err.response?.status === 403) {
          setError("Access denied to this project.");
        } else if (err.response?.status === 404) {
          setError("Project not found. Please select a valid project.");
        } else if (err.code === "ERR_NETWORK") {
          setError(
            "Cannot connect to server. Please ensure backend is running on port 5000."
          );
        } else {
          setError(
            err.response?.data?.message ||
              "Failed to load dashboard. Please try again."
          );
        }

        setDashboardData(null);
        setLoading(false);
      }
    },
    [getAuthHeaders, navigate]
  );

  // ---------------------------------------------------
  // 4) Load projects -> set activeProjectId -> fetch dash
  // ---------------------------------------------------
  useEffect(() => {
    const run = async () => {
      setLoading(true);

      // token check
      const t = localStorage.getItem("token");
      if (!t) {
        setError("Please login first");
        navigate("/login");
        return;
      }

      const list = await fetchProjects();
      const resolvedId = resolveActiveProjectId(list);

      setActiveProjectId(resolvedId);

      // fetch dashboard if we got an id
      await fetchDashboardData(resolvedId);
    };

    run();
  }, [projectId, fetchProjects, resolveActiveProjectId, fetchDashboardData, navigate]);

  // -----------------------------
  // Mood submit (SAFE)
  // -----------------------------
  const submitMood = async (score) => {
    if (submittingMood) return;
    if (!activeProjectId) return;

    setSubmittingMood(true);
    setSelectedMood(score);

    try {
      const t = localStorage.getItem("token");
      if (!t) {
        navigate("/login");
        return;
      }

      await axios.post(
        `${API_URL}/dashboard/${activeProjectId}/mood`,
        {
          sentiment_score: score,
          comment: moodComment,
        },
        { headers: getAuthHeaders() }
      );

      // refresh
      await fetchDashboardData(activeProjectId);
      setMoodComment("");
    } catch (err) {
      console.error("Error submitting mood:", err);

      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setError(err.response?.data?.message || "Failed to submit mood.");
      }
    } finally {
      setTimeout(() => setSubmittingMood(false), 600);
    }
  };

  // -----------------------------
  // UI Helpers
  // -----------------------------
  const getMoodIcon = (score) => {
    const icons = { 1: "😞", 2: "😕", 3: "😐", 4: "😊", 5: "😄" };
    return icons[score] || "😐";
  };

  const getRiskLevelColor = (level) => {
    const colors = {
      low: "text-green-500",
      medium: "text-yellow-500",
      high: "text-orange-500",
      critical: "text-red-500",
    };
    return colors[level] || "text-gray-500";
  };

  // -----------------------------
  // Safe data extraction
  // -----------------------------
  const projectName = (dashboardData?.project?.name || "PROJECT").toUpperCase();

  const learningPercent = dashboardData?.learning_capacity?.percentage ?? 0;
  const dueDateRaw = dashboardData?.learning_capacity?.due_date;

  const dueDateText = dueDateRaw
    ? new Date(dueDateRaw)
        .toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/\//g, "-")
    : "N/A";

  const aiBriefing = dashboardData?.ai_briefing || "No briefing available.";

  const efficiencyPercent = dashboardData?.efficiency?.percentage ?? 0;
  const velocity = dashboardData?.pipeline_velocity?.tasks_per_week ?? 0;

  const moodScore = dashboardData?.team_mood?.score ?? 0;
  const moodResponses = dashboardData?.team_mood?.total_responses ?? 0;

  const completionPercent = dashboardData?.completion?.percentage ?? 0;
  const completedTasks = dashboardData?.completion?.completed_tasks ?? 0;
  const totalTasks = dashboardData?.completion?.total_tasks ?? 0;

  const riskLevel = dashboardData?.risk_level || "unknown";

  // -----------------------------
  // Loading state
  // -----------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Error state / no data
  // -----------------------------
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="mb-6">
            <svg
              className="w-20 h-20 text-red-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <p className="text-red-500 text-xl font-semibold mb-4">
            {error || "Failed to load dashboard"}
          </p>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left">
            <p className="text-sm text-yellow-800 font-semibold mb-2">
              💡 Troubleshooting:
            </p>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Check if backend is running on port 5000</li>
              <li>• Verify VITE_API_URL in .env file</li>
              <li>• Ensure you have created a project</li>
              <li>• Check browser console for errors</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => fetchDashboardData(activeProjectId)}
              className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors"
            >
              Retry
            </button>

            <button
              onClick={() => navigate("/projects")}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
            >
              Go to Projects
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
            <p className="text-xs text-gray-600 font-mono">
              <strong>API URL:</strong> {API_URL}
              <br />
              <strong>Active Project:</strong>{" "}
              {activeProjectId ? activeProjectId : "none"}
              <br />
              <strong>Token:</strong>{" "}
              {localStorage.getItem("token") ? "✓ Present" : "✗ Missing"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Main UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900 italic tracking-tight">
              {projectName}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <span className="font-semibold">
                LEARNING CAPACITY: {learningPercent}%
              </span>
            </div>

            <div className="text-gray-500 font-medium">DUE: {dueDateText}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Briefing */}
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 7H7v6h6V7z" />
                <path
                  fillRule="evenodd"
                  d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-500 font-semibold uppercase tracking-wide text-sm">
                AI Briefing
              </span>
            </div>
            <p className="text-white text-xl leading-relaxed font-medium">
              {aiBriefing}
            </p>
          </div>

          {/* Efficiency */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">
                  Efficiency
                </p>
                <p className="text-4xl font-bold text-gray-900">
                  {efficiencyPercent}%
                </p>
              </div>
            </div>

            <div className="mt-6">
              <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">
                Pipeline Velocity
              </span>

              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mt-2">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(velocity * 5, 100)}%` }}
                />
              </div>

              <p className="text-sm text-gray-500 mt-2">{velocity} tasks/week</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team Mood */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-lg font-bold text-gray-900 italic">TEAMMOOD</h3>
            </div>

            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => submitMood(score)}
                  disabled={submittingMood || !activeProjectId}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-200 transform hover:scale-110 ${
                    selectedMood === score
                      ? "bg-red-500 shadow-lg scale-110"
                      : score === 3
                      ? "bg-red-500 shadow-md"
                      : "bg-gray-100 hover:bg-gray-200"
                  } ${
                    submittingMood ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <span
                    className={
                      selectedMood === score || score === 3
                        ? "filter brightness-200"
                        : ""
                    }
                  >
                    {getMoodIcon(score)}
                  </span>
                </button>
              ))}
            </div>

            <div className="text-center border-t pt-4">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                Team Sentiment Score
              </p>
              <p className="text-5xl font-black text-gray-900">
                {moodScore}
                <span className="text-2xl text-gray-400">/5.0</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Based on {moodResponses} responses
              </p>
            </div>
          </div>

          {/* Infrastructure */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 shadow-xl">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-4">
              Infrastructure Health
            </p>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <div>
                <p className="text-white text-lg font-bold italic">
                  Systems Operational
                </p>
                <p className="text-gray-400 text-sm">LATENCY: 24MS</p>
              </div>
            </div>

            <button className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors uppercase tracking-wide text-sm">
              View Cloud Console
            </button>
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="mt-6 bg-white rounded-3xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wide mb-2">
              Completion
            </p>
            <p className="text-4xl font-bold text-gray-900">
              {completionPercent}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {completedTasks} / {totalTasks} tasks
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wide mb-2">
              Risk Level
            </p>
            <p className={`text-4xl font-bold ${getRiskLevelColor(riskLevel)}`}>
              {String(riskLevel).toUpperCase()}
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wide mb-2">
              Efficiency
            </p>
            <p className="text-4xl font-bold text-gray-900">
              {efficiencyPercent}%
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wide mb-2">
              Velocity
            </p>
            <p className="text-4xl font-bold text-gray-900">{velocity}</p>
            <p className="text-sm text-gray-500 mt-1">tasks/week</p>
          </div>
        </div>
      </div>

      {/* Cycle Progress */}
      <div className="mt-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              Cycle
            </span>

            <div className="flex-1 w-64">
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>

          <span className="text-green-400 font-bold text-sm">
            {completionPercent}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
