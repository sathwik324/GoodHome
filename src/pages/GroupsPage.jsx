import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { Plus, LogIn, Users, X, Copy, ArrowRight, User, Trash2, LogOut } from "lucide-react";
import TopBar from "../components/dashboard/TopBar";
import { useAuth } from "../context/AuthContext";

function GroupsPage() {
    const { user, logout } = useAuth();
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
    const [showInviteModal, setShowInviteModal] = useState(null); // stores { code, groupName }

    // Delete/Leave State
    const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete'|'leave', groupId, groupName }
    const [copied, setCopied] = useState(false);

    const fetchGroups = () => {
        setLoading(true);
        setGroups([]); // Clear before fetching to prevent cross-user contamination
        api
            .get(`/groups/my`)
            .then((res) => {
                setGroups(res.data);
                setError("");
            })
            .catch((err) => {
                if (err.response?.status === 401) {
                    logout(); // AuthContext.logout already navigates to /login
                } else {
                    setError("Failed to load your groups.");
                }
            })
            .finally(() => setLoading(false));
    };

    // Re-fetch when user changes (session switching)
    useEffect(() => {
        if (!user) return;
        fetchGroups();
    }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCreate = (e) => {
        e.preventDefault();
        setModalError("");
        api
            .post(`/groups/create`, createForm)
            .then((res) => {
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
        const trimmedCode = inviteCode.trim();
        if (!trimmedCode) return;

        api
            .post(`/groups/join`, { inviteCode: trimmedCode })
            .then((res) => {
                setShowJoin(false);
                setInviteCode("");
                const newlyJoinedId = res.data?.group?._id || res.data?._id;
                fetchGroups();
                if (newlyJoinedId) {
                    navigate(`/groups/${newlyJoinedId}/channels`);
                }
            })
            .catch((err) => {
                console.error("Join Group Error:", err);
                const errMsg = err.response?.data?.message || "Invalid invite code";
                // If already a member, try to find the group and navigate
                if (errMsg.toLowerCase().includes("already")) {
                    setModalError(errMsg);
                    // Try to find matching group
                    const existingGroup = groups.find(
                        g => g.inviteCode === trimmedCode
                    );
                    if (existingGroup) {
                        setTimeout(() => {
                            setShowJoin(false);
                            navigate(`/groups/${existingGroup._id}/channels`);
                        }, 1500);
                    }
                } else {
                    setModalError(errMsg);
                }
            });
    };

    const handleFetchInvite = (e, groupId, groupName) => {
        e.preventDefault();
        e.stopPropagation();
        api
            .get(`/groups/${groupId}/invite`)
            .then((res) => {
                setShowInviteModal({
                    code: res.data?.inviteCode || "No code available",
                    groupName: groupName
                });
            })
            .catch((err) => {
                console.error("Fetch invite error:", err);
                setModalError("Failed to fetch invite code");
            });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDeleteGroup = () => {
        if (!confirmAction || confirmAction.type !== 'delete') return;
        api
            .delete(`/groups/${confirmAction.groupId}`)
            .then(() => {
                setGroups((prev) => prev.filter((g) => g._id !== confirmAction.groupId));
                setConfirmAction(null);
            })
            .catch((err) => {
                setError(err.response?.data?.message || "Failed to delete group");
                setConfirmAction(null);
            });
    };

    const handleLeaveGroup = () => {
        if (!confirmAction || confirmAction.type !== 'leave') return;
        api
            .post(`/groups/${confirmAction.groupId}/leave`)
            .then(() => {
                setGroups((prev) => prev.filter((g) => g._id !== confirmAction.groupId));
                setConfirmAction(null);
            })
            .catch((err) => {
                setError(err.response?.data?.message || "Failed to leave group");
                setConfirmAction(null);
            });
    };

    return (
        <div className="dashboard-layout">
            <div className="dashboard-main" style={{ marginLeft: 0 }}>
                <TopBar pageTitle="My Groups" hideHamburger={true} />

                <div className="dashboard-content" style={{ maxWidth: 1100, margin: "0 auto" }}>
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

                    {/* Empty State */}
                    {!loading && groups.length === 0 && !error && (
                        <div className="empty-state" style={{ padding: "80px 20px", background: "var(--color-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
                            <Users size={56} color="var(--color-primary)" style={{ marginBottom: 20, opacity: 0.8 }} />
                            <h3 style={{ margin: "0 0 8px 0", color: "var(--color-text-primary)", fontSize: "1.4rem" }}>You haven't joined any groups yet</h3>
                            <p style={{ margin: "0 0 32px 0", fontSize: "1rem" }}>Create a new group for your family or join an existing one using an invite code.</p>
                            <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
                                <button className="btn-accent" onClick={() => { setShowCreate(true); setCreateSuccessData(null); }} style={{ padding: "12px 24px" }}>Create Group</button>
                                <button className="btn-primary" onClick={() => setShowJoin(true)} style={{ padding: "12px 24px" }}>Join Group</button>
                            </div>
                        </div>
                    )}

                    {/* Groups Grid */}
                    {!loading && groups.length > 0 && (
                        <div className="groups-grid">
                            {groups.map((group, index) => (
                                <div className="group-card" key={group._id}>
                                    <div className="group-card-header">
                                        <div className={`group-avatar color-${index % 5}`}>
                                            {group.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="group-info">
                                            <h4>{group.name}</h4>
                                            <div className="group-meta-item" style={{ marginTop: "4px" }}>
                                                <Users size={14} /> <span>{group.memberCount || group.members?.length || 1} members</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p style={{ margin: "0 0 16px", color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: 1.5, flex: 1 }}>
                                        {group.description || "No description provided."}
                                    </p>
                                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px", marginTop: "auto" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <span style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                                                <User size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                                                Owner: {group.owner?.name || group.ownerName || "Unknown"}
                                            </span>
                                        </div>
                                        <div className="group-actions" style={{ borderTop: "none", paddingTop: "12px" }}>
                                            <button className="btn-outline" onClick={(e) => handleFetchInvite(e, group._id, group.name)}>
                                                <Copy size={14} /> Invite Code
                                            </button>
                                            {user?._id === (group.owner?._id || group.owner) ? (
                                                <button className="btn-outline" style={{ borderColor: "#F87171", color: "#F87171" }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmAction({ type: 'delete', groupId: group._id, groupName: group.name }); }}>
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            ) : (
                                                <button className="btn-outline" style={{ borderColor: "#FBBF24", color: "#FBBF24" }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmAction({ type: 'leave', groupId: group._id, groupName: group.name }); }}>
                                                    <LogOut size={14} /> Leave
                                                </button>
                                            )}
                                            <Link to={`/groups/${group._id}/channels`} className="btn-outline" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", textDecoration: "none" }}>
                                                Open <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
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
                                        <Copy size={18} /> {copied ? "Copied ✓" : "Copy Code"}
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
                            <input placeholder="Enter invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
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
                            <h3>Invite to {showInviteModal.groupName || "Group"}</h3>
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
                                <Copy size={18} /> {copied ? "Copied ✓" : "Copy Code"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete/Leave Modal */}
            {confirmAction && (
                <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{confirmAction.type === 'delete' ? 'Delete Group' : 'Leave Group'}</h3>
                            <button className="modal-close" onClick={() => setConfirmAction(null)}><X size={20} /></button>
                        </div>
                        <p style={{ color: "var(--color-text-secondary)", margin: "0 0 24px" }}>
                            {confirmAction.type === 'delete'
                                ? `Are you sure you want to permanently delete "${confirmAction.groupName}"? This cannot be undone.`
                                : `Are you sure you want to leave "${confirmAction.groupName}"? You will need a new invite code to rejoin.`
                            }
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button className="btn-outline" onClick={() => setConfirmAction(null)}>Cancel</button>
                            <button
                                className="btn-accent"
                                style={{ background: confirmAction.type === 'delete' ? '#EF4444' : '#F59E0B' }}
                                onClick={confirmAction.type === 'delete' ? handleDeleteGroup : handleLeaveGroup}
                            >
                                {confirmAction.type === 'delete' ? 'Delete Group' : 'Leave Group'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GroupsPage;
