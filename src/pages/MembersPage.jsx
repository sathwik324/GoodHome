import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { Search, UserPlus, Mail, X, Copy, Users, Trash2 } from "lucide-react";

function MembersPage() {
    const { user, groupId, group } = useOutletContext();
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    // Invite section state
    const [inviteCode, setInviteCode] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Invite modal state
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteMsg, setInviteMsg] = useState("");

    const fetchMembers = () => {
        if (!groupId) return;
        setLoading(true);
        api
            .get(`/groups/${groupId}/members`)
            .then((res) => { setMembers(res.data); setError(""); })
            .catch((err) => {
                if (err.response?.status === 403) {
                    navigate("/dashboard");
                } else {
                    setError("Failed to load members for this group.");
                }
            })
            .finally(() => setLoading(false));
    };

    const fetchInviteCode = () => {
        if (!groupId) return;
        setInviteLoading(true);
        api
            .get(`/groups/${groupId}/invite`)
            .then((res) => setInviteCode(res.data?.inviteCode || ""))
            .catch(() => { })
            .finally(() => setInviteLoading(false));
    };

    useEffect(() => {
        fetchMembers();
        fetchInviteCode();
    }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

    const filtered = members.filter((m) =>
        (m.name || m.user?.name || "").toLowerCase().includes(search.toLowerCase())
    );

    const handleInvite = (e) => {
        e.preventDefault();
        setInviteMsg("");
        api
            .post(`/groups/${groupId}/invite`, { email: inviteEmail })
            .then(() => {
                setInviteMsg("Invite sent!");
                setInviteEmail("");
                fetchMembers();
                setTimeout(() => { setShowInvite(false); setInviteMsg(""); }, 1500);
            })
            .catch((err) => {
                setInviteMsg(err.response?.data?.message || "Failed to send invite");
            });
    };

    const copyCode = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isGroupOwner = user?._id === (group?.owner?._id || group?.owner);

    const handleRemoveMember = (memberId) => {
        if (!window.confirm("Remove this member from the group?")) return;
        api
            .delete(`/groups/${groupId}/members/${memberId}`)
            .then(() => setMembers((prev) => prev.filter((m) => (m.user?._id || m._id) !== memberId)))
            .catch((err) => setError(err.response?.data?.message || "Failed to remove member"));
    };

    return (
        <div className="feature-page">
            {/* Invite Code Section */}
            {inviteCode && (
                <div style={{
                    background: "var(--color-card)", border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)", padding: "20px 24px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexWrap: "wrap", gap: "12px"
                }}>
                    <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem" }}>Invite Members</h4>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                            Share this code with family members to let them join
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <code style={{
                            background: "var(--color-bg)", border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)", padding: "8px 16px",
                            fontFamily: "monospace", fontSize: "1.1rem", letterSpacing: "2px",
                            color: "var(--color-primary)", fontWeight: "bold"
                        }}>
                            {inviteCode}
                        </code>
                        <button className="btn-outline" onClick={copyCode} style={{ padding: "8px 16px" }}>
                            <Copy size={16} /> {copied ? "Copied ✓" : "Copy"}
                        </button>
                    </div>
                </div>
            )}

            <div className="feature-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="search-bar">
                        <Search size={18} />
                        <input type="text" placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                        <Users size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                        {members.length} member{members.length !== 1 && "s"}
                    </span>
                </div>
                <button className="btn-accent" onClick={() => setShowInvite(true)}>
                    <UserPlus size={18} />
                    <span>Invite Member</span>
                </button>
            </div>

            {loading && <p style={{ color: "var(--color-text-secondary)" }}>Loading group members...</p>}
            {error && (
                <div style={{ color: "#F87171", display: "flex", alignItems: "center", gap: "12px" }}>
                    <p>{error}</p>
                    <button className="btn-outline" onClick={fetchMembers} style={{ padding: "6px 14px", fontSize: "0.8rem" }}>Retry</button>
                </div>
            )}

            <div className="members-grid">
                {filtered.map((memberObj) => {
                    const m = memberObj.user || memberObj;
                    const role = memberObj.role || m.role || "Member";

                    return (
                        <div className="member-card" key={m._id || Math.random()}>
                            <div className="member-avatar">
                                {(m.name || "?").charAt(0).toUpperCase()}
                                <span className={`status-dot ${m.online ? "online" : "offline"}`} />
                            </div>
                            <div className="member-info" style={{ flex: 1 }}>
                                <h4>{m.name || "Unknown"}</h4>
                                <p><Mail size={14} /> {m.email || ""}</p>
                                <span className={`role-badge ${role.toLowerCase()}`}>{role}</span>
                            </div>
                            {isGroupOwner && m._id !== (group?.owner?._id || group?.owner) && (
                                <button
                                    onClick={() => handleRemoveMember(m._id)}
                                    className="btn-outline"
                                    style={{ borderColor: "#F87171", color: "#F87171", padding: "6px 12px", fontSize: "0.8rem", flexShrink: 0 }}
                                    title="Remove member"
                                >
                                    <Trash2 size={14} /> Remove
                                </button>
                            )}
                        </div>
                    );
                })}
                {!loading && filtered.length === 0 && (
                    <div className="empty-state">
                        <Users size={48} color="var(--color-text-secondary)" style={{ marginBottom: 12 }} />
                        <p>No members found{search ? ` matching "${search}"` : ""}</p>
                    </div>
                )}
            </div>

            {showInvite && (
                <div className="modal-overlay" onClick={() => setShowInvite(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Invite to Group</h3>
                            <button className="modal-close" onClick={() => setShowInvite(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleInvite}>
                            <input placeholder="Email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                            <button className="btn-primary" type="submit">Send Invite</button>
                            {inviteMsg && <p className="settings-msg">{inviteMsg}</p>}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MembersPage;
