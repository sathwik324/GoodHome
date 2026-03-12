import { useEffect, useState } from "react";
import axios from "axios";
import StatCards from "../components/dashboard/StatCards";
import RecentActivity from "../components/dashboard/RecentActivity";
import QuickStats from "../components/dashboard/QuickStats";

const API = "https://goodhome-backend.onrender.com/api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    axios
      .get(`${API}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStats(res.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <StatCards stats={stats} loading={loading} />
      <div className="dashboard-bottom-grid">
        <RecentActivity activities={stats?.recentActivity || []} loading={loading} />
        <QuickStats stats={stats} loading={loading} />
      </div>
    </>
  );
}

export default Dashboard;
