import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { CalendarDays, Plus, Trash2, X, Clock } from "lucide-react";

function EventsPage() {
    const { user, groupId, group } = useOutletContext();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ title: "", date: "", time: "", description: "" });
    const [createError, setCreateError] = useState("");

    const fetchEvents = () => {
        if (!groupId) return;
        setLoading(true);
        api
            .get(`/events?groupId=${groupId}`)
            .then((res) => {
                // Sort by date ascending
                const sorted = (res.data || []).sort((a, b) => new Date(a.date) - new Date(b.date));
                setEvents(sorted);
                setError("");
            })
            .catch((err) => {
                if (err.response?.status === 403) {
                    navigate("/dashboard");
                } else {
                    setError("Failed to load events");
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchEvents(); }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCreate = (e) => {
        e.preventDefault();
        setCreateError("");
        api
            .post(`/events`, { ...form, groupId })
            .then((res) => {
                setShowCreate(false);
                setForm({ title: "", date: "", time: "", description: "" });
                const newEvent = res.data;
                setEvents(prev => [...prev, newEvent].sort((a, b) => new Date(a.date) - new Date(b.date)));
            })
            .catch((err) => setCreateError(err.response?.data?.message || "Failed to create event"));
    };

    const handleDelete = (id) => {
        api
            .delete(`/events/${id}`)
            .then(() => setEvents(events.filter((e) => e._id !== id)))
            .catch((err) => setError(err.response?.data?.message || "Failed to delete event"));
    };

    const isCreator = (event) => {
        if (!user) return false;
        const isEventCreator = event.createdBy === user._id || (event.createdBy?._id === user._id);
        const isGroupOwner = user._id === (group?.owner?._id || group?.owner);
        return isEventCreator || isGroupOwner;
    };

    return (
        <div className="feature-page">
            <div className="feature-header">
                <h3 style={{ margin: 0 }}>{events.length} Upcoming Events</h3>
                <button className="btn-accent" onClick={() => { setShowCreate(true); setCreateError(""); }}>
                    <Plus size={18} />
                    <span>Create Event</span>
                </button>
            </div>

            {loading && <p style={{ color: "var(--color-text-secondary)" }}>Loading events...</p>}
            {error && (
                <div style={{ color: "#F87171", display: "flex", alignItems: "center", gap: "12px" }}>
                    <p>{error}</p>
                    <button className="btn-outline" onClick={fetchEvents} style={{ padding: "6px 14px", fontSize: "0.8rem" }}>Retry</button>
                </div>
            )}

            <div className="events-grid">
                {events.map((event) => (
                    <div className="event-card" key={event._id}>
                        <div className="event-card-top">
                            <div className="event-icon">
                                <CalendarDays size={22} />
                            </div>
                            {isCreator(event) && (
                                <button className="event-delete" onClick={() => handleDelete(event._id)}>
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                        <h4>{event.title}</h4>
                        <p className="event-meta">
                            <CalendarDays size={14} /> {event.date ? new Date(event.date).toLocaleDateString() : "No date"}
                            {event.time && <><Clock size={14} style={{ marginLeft: 12 }} /> {event.time}</>}
                        </p>
                        {event.description && <p className="event-desc">{event.description}</p>}
                        <span className="event-creator">Created by {event.createdBy?.name || "Unknown"}</span>
                    </div>
                ))}
                {!loading && events.length === 0 && !error && (
                    <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
                        <CalendarDays size={48} color="var(--color-text-secondary)" style={{ marginBottom: 12 }} />
                        <h3 style={{ margin: "0 0 8px", color: "var(--color-text-primary)" }}>No upcoming events</h3>
                        <p>Plan your next family gathering!</p>
                    </div>
                )}
            </div>

            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create Event</h3>
                            <button className="modal-close" onClick={() => setShowCreate(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <input placeholder="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                            <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                            <button className="btn-primary" type="submit">Create Event</button>
                            {createError && <p className="settings-msg" style={{ color: "#F87171" }}>{createError}</p>}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventsPage;
