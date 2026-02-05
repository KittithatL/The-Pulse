// src/services/api.js

const BASE_URL = "http://localhost:8000/api";

export const getDashboardSummary = async () => {
  const res = await fetch(`${BASE_URL}/dashboard/summary`);
  if (!res.ok) {
    throw new Error("Failed to fetch dashboard summary");
  }
  return res.json();
};
