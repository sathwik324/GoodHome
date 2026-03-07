import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/axiosInstance";
import { Hash, Send, Users, MessageCircle, CalendarDays, Plus, X } from "lucide-react";

function formatTime(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}

function ChannelsPage() {
    const { user, groupId } = useOutletContext();
    const [channels, setChannels] = useState([]);
    const [activeChannel, setActiveChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");
    const [loading, setLoading] = useState(true);
    const [msgsLoading, setMsgsLoading] = useState(false);

    // Create Channel State
    const [showCreate, setShowCreate] = useState(false);
    const [newChannelName, setNewChannelName] = useState("");
    const [createError, setCreateError] = useState("");

    // Dashboard stats specifically for this group
    const [stats, setStats] = useState(null);
    const messagesEndRef = useRef(null);

    const fetchChannelsAndStats = () => {
        setLoading(true);
        Promise.all([
            api.get(`/groups/${groupId}/channels`).catch(() => ({ data: [] })),
            api.get(`/dashboard?groupId=${groupId}`).catch(() => ({ data: {} }))
        ]).then(([chRes, stRes]) => {
            const chData = chRes.data || [];
            setChannels(chData);
            setStats(stRes.data);
            if (chData.length > 0 && !activeChannel) {
                setActiveChannel(chData[0]._id);
            }
        }).finally(() => setLoading(false));
    };

    // Fetch Channels & Stats on mount
    useEffect(() => {
        if (!groupId) return;
        fetchChannelsAndStats();
    }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch messages when active channel changes
    const fetchMessages = (channelId) => {
        if (!channelId) return;
        api
            .get(`/channels/${channelId}/messages`)
            .then((res) => setMessages(res.data))
            .catch(() => setMessages([]))
            .finally(() => setMsgsLoading(false));
    };

    useEffect(() => {
        if (!activeChannel) return;
        setMsgsLoading(true);
        fetchMessages(activeChannel);
    }, [activeChannel]);

    // Poll for new messages every 5 seconds
    useEffect(() => {
        if (!activeChannel) return;
        const interval = setInterval(() => fetchMessages(activeChannel), 5000);
        return () => clearInterval(interval);
    }, [activeChannel]);

    // Auto-scroll on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    const activeChannelObj = channels.find((c) => c._id === activeChannel);
    const channelName = activeChannelObj?.name || "";

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMsg.trim() || !activeChannel) return;

        api
            .post(`/channels/${activeChannel}/messages`, { text: newMsg })
            .then((res) => {
                setMessages((prev) => [...prev, res.data]);
                setNewMsg("");
            })
            .catch(() => { });
    };

    const handleCreateChannel = (e) => {
        e.preventDefault();
        if (!newChannelName.trim()) return;
        setCreateError("");
        api
            .post(`/groups/${groupId}/channels`, { name: newChannelName })
            .then((res) => {
                setShowCreate(false);
                setNewChannelName("");
                const newCh = res.data?.channel || res.data;
                setChannels((prev) => [...prev, newCh]);
                setActiveChannel(newCh._id);
            })
            .catch((err) => {
                setCreateError(err.response?.data?.message || "Failed to create channel");
            });
    };

    const getSenderName = (msg) => {
        if (msg.sender?.name) return msg.sender.name;
        if (msg.senderName) return msg.senderName;
        if (msg.sender === user?._id) return user.name;
        return String(msg.sender || "").substring(0, 6);
    };

    if (loading) {
        return (
            <div className="channels-layout">
                <p style={{ padding: 20, color: "var(--color-text-secondary)" }}>Loading workspace...</p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
            {/* Group Stats Top Bar */}
            {stats && (
                <div style={{ display: "flex", gap: "16px", background: "var(--color-card)", padding: "12px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-secondary)", fontSize: "0.85rem", marginRight: "16px" }}>
                        <Users size={16} color="#818CF8" /> <strong>{stats.totalMembers || 0}</strong> Members
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-secondary)", fontSize: "0.85rem", marginRight: "16px" }}>
                        <MessageCircle size={16} color="#34D399" /> <strong>{stats.messagesToday || 0}</strong> Messages Today
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                        <CalendarDays size={16} color="#FBBF24" /> <strong>{stats.upcomingEvents || 0}</strong> Upcoming Events
                    </div>
                </div>
            )}

            {/* Main Split Layout */}
            <div className="channels-layout" style={{ flex: 1, height: "auto" }}>
                <div className="channel-list">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: "16px", marginBottom: "8px" }}>
                        <h4 className="channel-list-title" style={{ marginBottom: 0 }}>Channels</h4>
                        <button
                            onClick={() => setShowCreate(true)}
                            style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", display: "flex", padding: "4px", borderRadius: "4px" }}
                            className="back-btn-hover"
                            title="Create Channel"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {channels.map((ch) => (
                        <button
                            key={ch._id}
                            className={`channel-item${ch._id === activeChannel ? " active" : ""}`}
                            onClick={() => setActiveChannel(ch._id)}
                        >
                            <Hash size={16} />
                            <span>{ch.name}</span>
                        </button>
                    ))}
                    {channels.length === 0 && (
                        <div style={{ padding: "16px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                            <p style={{ fontSize: "0.85rem", marginBottom: "12px" }}>No channels yet</p>
                            <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ padding: "6px 12px", fontSize: "0.8rem", margin: "0 auto", display: "flex", alignItems: "center", gap: "6px" }}>
                                <Plus size={14} /> Create Channel
                            </button>
                        </div>
                    )}
                </div>

                <div className="channel-thread">
                    <div className="channel-thread-header">
                        <Hash size={18} />
                        <h4>{channelName || "Select a channel"}</h4>
                    </div>

                    <div className="channel-messages">
                        {msgsLoading && <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>Loading messages...</p>}
                        {!msgsLoading && messages.length === 0 && activeChannel && (
                            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>No messages yet. Say hello!</p>
                        )}
                        {!activeChannel && channels.length === 0 && (
                            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)", flexDirection: "column", gap: "12px" }}>
                                <Hash size={48} opacity={0.2} />
                                <p>Create a channel to start chatting</p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div className="message-item" key={msg._id}>
                                <div className="message-avatar">
                                    {getSenderName(msg).charAt(0).toUpperCase()}
                                </div>
                                <div className="message-body">
                                    <div className="message-meta">
                                        <strong>{getSenderName(msg)}</strong>
                                        <span>{formatTime(msg.createdAt || msg.time)}</span>
                                    </div>
                                    <p>{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="message-input" onSubmit={handleSend}>
                        <input
                            placeholder={channelName ? `Message #${channelName}...` : "Create a channel..."}
                            value={newMsg}
                            onChange={(e) => setNewMsg(e.target.value)}
                            disabled={!activeChannel}
                        />
                        <button type="submit" className="send-btn" disabled={!activeChannel}>
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Create Channel Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)} style={{ zIndex: 100 }}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create Channel</h3>
                            <button className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateChannel}>
                            <input
                                placeholder="Channel name (e.g. general, plans)"
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                                required
                                autoFocus
                            />
                            <button className="btn-accent" type="submit">Create Channel</button>
                            {createError && <p className="settings-msg" style={{ color: "#F87171" }}>{createError}</p>}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChannelsPage;
