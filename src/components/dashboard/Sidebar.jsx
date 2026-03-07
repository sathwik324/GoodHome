import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import {
    MessageSquare,
    Users,
    CalendarDays,
    Image,
    Settings,
    ChevronsLeft,
    ChevronsRight,
    Home,
    ArrowLeft,
    UserPlus,
    X,
    Copy
} from "lucide-react";

function Sidebar({ groupId, groupName, memberCount, collapsed, onToggle, mobileOpen, onMobileClose }) {
    const navigate = useNavigate();

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [copied, setCopied] = useState(false);

    const navItems = [
        { icon: MessageSquare, label: "Channels", to: `/groups/${groupId}/channels` },
        { icon: Users, label: "Members", to: `/groups/${groupId}/members`, badge: memberCount > 0 ? memberCount : null },
        { icon: CalendarDays, label: "Events", to: `/groups/${groupId}/events` },
        { icon: Image, label: "Media", to: `/groups/${groupId}/media` },
        { icon: Settings, label: "Settings", to: `/groups/${groupId}/settings` },
    ];

    const handleInviteClick = async () => {
        try {
            const res = await api.get(`/groups/${groupId}/invite`);
            setInviteCode(res.data?.inviteCode || "UNAVAILABLE");
            setShowInviteModal(true);
        } catch (err) {
            console.error(err);
            alert("Failed to fetch invite code.");
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <aside className={`sidebar${collapsed ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}>
            {/* Brand */}
            <div className="sidebar-brand">
                <div className="brand-icon">
                    <Home size={20} />
                </div>
                <h1>GoodHome</h1>
            </div>

            {/* Back to Groups */}
            <div style={{ padding: "0 12px", marginBottom: "8px" }}>
                <button
                    onClick={() => { navigate("/dashboard"); onMobileClose && onMobileClose(); }}
                    style={{
                        display: "flex", alignItems: "center", gap: 8, background: "none", border: "none",
                        color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "0.85rem",
                        padding: "8px 12px", width: "100%", borderRadius: "var(--radius-md)",
                        transition: "background 0.2s"
                    }}
                    className="back-btn-hover"
                >
                    <ArrowLeft size={16} />
                    {!collapsed && <span>My Groups</span>}
                </button>
            </div>

            {/* Group Name Header */}
            {!collapsed && (
                <div style={{ padding: "8px 20px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ color: "white", fontSize: "1.1rem", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {groupName}
                        </div>
                        <button
                            onClick={handleInviteClick}
                            style={{
                                background: "none", border: "none", color: "var(--color-primary)",
                                cursor: "pointer", display: "flex", alignItems: "center",
                                padding: "4px", borderRadius: "4px",
                            }}
                            title="Invite Friends"
                            className="back-btn-hover"
                        >
                            <UserPlus size={16} />
                        </button>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Users size={12} /> {memberCount} member{memberCount !== 1 && "s"}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.to}
                        className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                        onClick={onMobileClose}
                    >
                        <item.icon className="nav-icon" size={20} />
                        <span className="nav-label">{item.label}</span>
                        {item.badge && <span className="nav-badge">{item.badge}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Collapse Toggle */}
            <button className="sidebar-toggle" onClick={onToggle}>
                {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
            </button>

            <style>{`
        .back-btn-hover:hover {
          background-color: rgba(255,255,255,0.05);
          color: white !important;
        }
      `}</style>

            {/* Invite Modal inside Sidebar */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={() => setShowInviteModal(false)} style={{ zIndex: 100 }}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Invite Friends & Family</h3>
                            <button className="modal-close" onClick={() => setShowInviteModal(false)}><X size={20} /></button>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", marginBottom: "16px" }}>
                                Share this code with family members so they can join your group.
                            </p>
                            <div className="invite-code-box">
                                {inviteCode}
                            </div>
                            {copied && <p className="success-temp-msg" style={{ marginBottom: "16px" }}>Copied!</p>}
                            <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={copyToClipboard}>
                                <Copy size={18} /> {copied ? "Copied" : "Copy Code"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}

export default Sidebar;
