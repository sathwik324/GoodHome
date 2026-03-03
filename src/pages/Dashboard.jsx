import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const { logout } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found. Please login.");
      return;
    }

    axios.get("https://goodhome-backend.onrender.com/api/user/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        setUser(res.data);
      })
      .catch(() => {
        setError("Session expired. Please login again.");
      });

  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  if (error) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: "center" }}>
          <h3 style={{ color: "var(--color-primary-hover)" }}>{error}</h3>
          <button className="btn-primary" onClick={handleLogout} style={{ marginTop: "1rem" }}>
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="card">
          <h3>Loading user data...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card">
        <h2>Dashboard</h2>
        <p className="subtitle">Welcome to your GoodHome portal</p>

        <div style={{ padding: "1rem 0", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", margin: "1.5rem 0" }}>
          <p style={{ margin: "0.5rem 0" }}><b>Name:</b> {user.name}</p>
          <p style={{ margin: "0.5rem 0" }}><b>Email:</b> {user.email}</p>
        </div>

        <button className="btn-primary" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Dashboard;
