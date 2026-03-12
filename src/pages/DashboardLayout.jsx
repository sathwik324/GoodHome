import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../styles/dashboard.css";

import Sidebar from "../components/dashboard/Sidebar";
import TopBar from "../components/dashboard/TopBar";

const pageTitles = {
    "/dashboard": "Dashboard",
    "/dashboard/channels": "Channels",
    "/dashboard/members": "Members",
    "/dashboard/events": "Events",
    "/dashboard/media": "Media",
    "/dashboard/settings": "Settings",
};

function DashboardLayout() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            setError("No token found. Please login.");
            return;
        }
        axios
            .get("https://goodhome-backend.onrender.com/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setUser(res.data))
            .catch(() => setError("Session expired. Please login again."));
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const pageTitle = pageTitles[location.pathname] || "Dashboard";

    if (error) {
        return (
            <div className="dashboard-error">
                <div className="card">
                    <h3>{error}</h3>
                    <button className="btn-primary" onClick={handleLogout} style={{ marginTop: "1rem" }}>
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="dashboard-loading">
                <div className="card" style={{ textAlign: "center" }}>
                    <h3>Loading your dashboard...</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            {mobileOpen && (
                <div className="sidebar-overlay visible" onClick={() => setMobileOpen(false)} />
            )}

            <div className="dashboard-main">
                <TopBar
                    userName={user.name}
                    pageTitle={pageTitle}
                    onHamburgerClick={() => setMobileOpen(!mobileOpen)}
                />

                <div className="dashboard-content">
                    <Outlet context={{ user, handleLogout }} />
                </div>
            </div>
        </div>
    );
}

export default DashboardLayout;
