import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { Plus, LogIn, Users, X, Copy, ArrowRight, User } from "lucide-react";
import TopBar from "../components/dashboard/TopBar";
import { useAuth } from "../context/AuthContext";

function GroupsPage() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Create Group State
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ name: "", description: "" });
    const [createSuccessData, setCreateSuccessData] = useState(null);

    // Join Group State
    const [showJoin, setShowJoin] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [modalError, setModalError] = useState("");

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(null); // stores { code: string }
    const [copied, setCopied] = useState(false);

    const fetchGroups = () => {
        setLoading(true);
        api
            .get(`/groups/my`)
            .then((res) => {
                setGroups(res.data);
                setError("");
            })
            .catch((err) => {
                if (err.response?.status === 401) {
                    logout();
                    navigate("/login");
                } else {
                    setError("Failed to load your groups.");
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchGroups(); }, []);

    const handleCreate = (e) => {
        e.preventDefault();
        setModalError("");
        api
            .post(`/groups/create`, createForm)
            .then((res) => {
                // Assuming backend returns { group, inviteCode } or something similar
                const code = res.data?.inviteCode || res.data?.group?.inviteCode || "UNKNOWN";
                const newGroupId = res.data?.group?._id || res.data?._id;

                setCreateSuccessData({ code, groupId: newGroupId });
                setCreateForm({ name: "", description: "" });
                fetchGroups();
            })
            .catch((err) => {
                console.error("Create Group Error:", err);
                setModalError(err.response?.data?.message || "Failed to create group");
            });
    };

    const handleJoin = (e) => {
        e.preventDefault();
        setModalError("");
        api
            .post(`/groups/join`, { inviteCode })
            .then((res) => {
                setShowJoin(false);
                setInviteCode("");
                const newlyJoinedId = res.data?.group?._id || res.data?._id;
                if (newlyJoinedId) {
                    navigate(`/groups/${newlyJoinedId}/channels`);
                } else {
                    fetchGroups();
                }
            })
            .catch((err) => {
                console.error("Join Group Error:", err);
                setModalError(err.response?.data?.message || "Invalid invite code");
            });
    };

    const handleFetchInvite = (e, groupId) => {
        e.preventDefault();
        e.stopPropagation();
        api
            .get(`/groups/${groupId}/invite`)
            .then((res) => {
                setShowInviteModal({ code: res.data?.inviteCode || "No code available" });
            })
            .catch((err) => {
                console.error("Fetch invite error:", err);
                alert("Failed to fetch invite code");
            });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="dashboard-layout">
            <div className="dashboard-main" style={{ marginLeft: 0 }}>
                <TopBar pageTitle="Workspace" hideHamburger={true} userName="User" />

                <div className="dashboard-content" style={{ maxWidth: 1000, margin: "0 auto" }}>
                    <div className="feature-header" style={{ marginBottom: "10px" }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "1.8rem" }}>My Groups</h2>
                            <p style={{ margin: "4px 0 0", color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>Your family spaces</p>
                        </div>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button className="btn-primary" onClick={() => { setShowJoin(true); setModalError(""); }} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <LogIn size={18} /> Join Group
                            </button>
                            <button className="btn-accent" onClick={() => { setShowCreate(true); setModalError(""); setCreateSuccessData(null); }} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Plus size={18} /> Create Group
                            </button>
                        </div>
                    </div>

                    {loading && <p style={{ color: "var(--color-text-secondary)" }}>Loading your groups...</p>}
                    {error && <p style={{ color: "#F87171" }}>{error}</p>}

                    {!loading && groups.length === 0 && !error && (
                        <div className="empty-state" style={{ padding: "80px 20px", background: "var(--color-card)", borderRadius: "var(--radius-lg)", border: `1px solid var(--color-border)` }}>
                            <Users size={56} color="var(--color-primary)" style={{ marginBottom: 20, opacity: 0.8 }} />
                            <h3 style={{ margin: "0 0 8px 0", color: "var(--color-text-primary)", fontSize: "1.4rem" }}>No groups yet</h3>
                            <p style={{ margin: "0 0 32px 0", fontSize: "1rem" }}>Create or join a group to get started</p>
                            <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
                                <button className="btn-accent" onClick={() => { setShowCreate(true); setCreateSuccessData(null); }} style={{ padding: "12px 24px" }}>Create Group</button>
                                <button className="btn-primary" onClick={() => setShowJoin(true)} style={{ padding: "12px 24px" }}>Join Group</button>
                            </div>
                        </div>
                    )}

                    {!loading && groups.length > 0 && (
                        <div className="groups-grid">
                            {groups.map((group, index) => (
                                <Link to={`/groups/${group._id}/channels`} key={group._id} style={{ textDecoration: "none" }}>
                                    <div className="group-card">
                                        <div className="group-card-header">
                                            <div className={`group-avatar color-${index % 5}`}>
                                                {group.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="group-info">
                                                <h4>{group.name}</h4>
                                                <p>{group.description || "No description provided."}</p>
                                            </div>
                                        </div>
                                        <div className="group-meta">
                                            <div className="group-meta-item">
                                                <Users size={16} /> <span>{group.memberCount || group.members?.length || 1}</span>
                                            </div>
                                            <div className="group-meta-item">
                                                <User size={16} /> <span>Owner: {group.owner?.name || group.ownerName || "Unknown"}</span>
                                            </div>
                                        </div>
                                        <div className="group-actions">
                                            <button className="btn-outline" onClick={(e) => handleFetchInvite(e, group._id)}>
                                                <Copy size={16} /> Invite Code
                                            </button>
                                            <button className="btn-outline" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                                                Open <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        {!createSuccessData ? (
                            <>
                                <div className="modal-header">
                                    <h3>Create New Group</h3>
                                    <button className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
                                </div>
                                <form onSubmit={handleCreate}>
                                    <input placeholder="Group Name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
                                    <textarea placeholder="Description (optional)" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={3} />
                                    <button className="btn-accent" type="submit">Create Group</button>
                                    {modalError && <p className="settings-msg" style={{ color: "#F87171" }}>{modalError}</p>}
                                </form>
                            </>
                        ) : (
                            <div style={{ textAlign: "center", padding: "10px 0" }}>
                                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "-20px" }}>
                                    <button className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
                                </div>
                                <h3 style={{ fontSize: "1.4rem", color: "var(--color-primary)", marginBottom: "8px" }}>Group Created! 🎉</h3>
                                <p style={{ color: "var(--color-text-secondary)", marginBottom: "16px" }}>Your invite code is:</p>

                                <div className="invite-code-box">
                                    {createSuccessData.code}
                                </div>
                                {copied && <p className="success-temp-msg">Copied!</p>}

                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
                                    <button className="btn-outline" onClick={() => copyToClipboard(createSuccessData.code)}>
                                        <Copy size={18} /> {copied ? "Copied" : "Copy Code"}
                                    </button>
                                    <button className="btn-accent" onClick={() => navigate(`/groups/${createSuccessData.groupId}/channels`)}>
                                        Go to Group <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Join Modal */}
            {showJoin && (
                <div className="modal-overlay" onClick={() => setShowJoin(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Join a Group</h3>
                            <button className="modal-close" onClick={() => setShowJoin(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleJoin}>
                            <input placeholder="Enter Invite Code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
                            <button className="btn-primary" type="submit">Join Group</button>
                            {modalError && <p className="settings-msg" style={{ color: "#F87171" }}>{modalError}</p>}
                        </form>
                    </div>
                </div>
            )}

            {/* Invite Modal (Action from Card) */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={() => setShowInviteModal(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Invite Friends & Family</h3>
                            <button className="modal-close" onClick={() => setShowInviteModal(null)}><X size={20} /></button>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", marginBottom: "16px" }}>
                                Share this code with family members so they can join your group.
                            </p>
                            <div className="invite-code-box">
                                {showInviteModal.code}
                            </div>
                            {copied && <p className="success-temp-msg" style={{ marginBottom: "16px" }}>Copied!</p>}
                            <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => copyToClipboard(showInviteModal.code)}>
                                <Copy size={18} /> {copied ? "Copied" : "Copy Code"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GroupsPage;
