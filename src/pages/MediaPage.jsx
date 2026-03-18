import { useState, useEffect, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api, { BACKEND_BASE } from "../api/axiosInstance";
import { Upload, X, User, Calendar, Image as ImageIcon, Trash2 } from "lucide-react";

function MediaPage() {
    const { user, groupId, group } = useOutletContext();
    const navigate = useNavigate();
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lightbox, setLightbox] = useState(null);

    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null); // { file, url }
    const fileInputRef = useRef(null);

    const fetchMedia = () => {
        if (!groupId) return;
        setLoading(true);
        api
            .get(`/groups/${groupId}/media`)
            .then((res) => { setMedia(res.data); setError(""); })
            .catch((err) => {
                if (err.response?.status === 403) {
                    navigate("/dashboard");
                } else {
                    setError("Failed to load media");
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchMedia(); }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

    const getImageUrl = (item) => {
        // If fileData is a base64 data URI, use it directly
        if (item.fileData && item.fileData.startsWith("data:")) return item.fileData;
        const raw = item.fileUrl || item.url || "";
        if (raw.startsWith("http")) return raw;
        return BACKEND_BASE + raw;
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview({ file, url });
    };

    const handleUploadConfirm = () => {
        if (!preview) return;
        setUploading(true);
        setError("");

        const reader = new FileReader();
        reader.onload = () => {
            const fileData = reader.result; // base64 data URI
            api
                .post(`/media/upload`, {
                    groupId,
                    fileName: preview.file.name,
                    fileData,
                    mimeType: preview.file.type
                })
                .then((res) => {
                    const newItem = res.data;
                    setMedia(prev => [newItem, ...prev]);
                    setPreview(null);
                })
                .catch((err) => setError(err.response?.data?.message || "Failed to upload photo"))
                .finally(() => {
                    setUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                });
        };
        reader.onerror = () => {
            setError("Failed to read file");
            setUploading(false);
        };
        reader.readAsDataURL(preview.file);
    };

    const cancelPreview = () => {
        if (preview) URL.revokeObjectURL(preview.url);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getUploaderName = (item) => {
        if (item.uploader?.name) return item.uploader.name;
        if (item.uploaderName) return item.uploaderName;
        if (item.uploader === user?._id) return user.name;
        return String(item.uploader || "Unknown").substring(0, 8);
    };

    const canDeleteMedia = (item) => {
        if (!user) return false;
        const uploaderId = item.uploader?._id || item.uploader;
        const isUploader = uploaderId === user._id;
        const isGroupOwner = user._id === (group?.owner?._id || group?.owner);
        return isUploader || isGroupOwner;
    };

    const handleDeleteMedia = (e, mediaId) => {
        e.stopPropagation();
        api
            .delete(`/media/${mediaId}`)
            .then(() => setMedia((prev) => prev.filter((m) => m._id !== mediaId)))
            .catch((err) => setError(err.response?.data?.message || "Failed to delete photo"));
    };

    return (
        <div className="feature-page">
            <div className="feature-header">
                <h3 style={{ margin: 0 }}>{media.length} Photos Shared</h3>

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleFileSelect}
                />
                <button
                    className="btn-accent"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    <Upload size={18} />
                    <span>{uploading ? "Uploading..." : "Upload Photo"}</span>
                </button>
            </div>

            {/* Upload Preview */}
            {preview && (
                <div style={{
                    background: "var(--color-card)", border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)", padding: "20px", display: "flex",
                    alignItems: "center", gap: "20px", flexWrap: "wrap"
                }}>
                    <img src={preview.url} alt="Preview" style={{
                        width: "120px", height: "120px", objectFit: "cover",
                        borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)"
                    }} />
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 4px", color: "var(--color-text-primary)", fontWeight: 600 }}>
                            {preview.file.name}
                        </p>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                            {(preview.file.size / 1024).toFixed(1)} KB
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button className="btn-outline" onClick={cancelPreview} style={{ padding: "8px 16px" }}>Cancel</button>
                        <button className="btn-accent" onClick={handleUploadConfirm} disabled={uploading} style={{ padding: "8px 16px" }}>
                            {uploading ? "Uploading..." : "Confirm Upload"}
                        </button>
                    </div>
                </div>
            )}

            {loading && <p style={{ color: "var(--color-text-secondary)" }}>Loading media...</p>}
            {error && (
                <div style={{ color: "#F87171", display: "flex", alignItems: "center", gap: "12px" }}>
                    <p>{error}</p>
                    <button className="btn-outline" onClick={fetchMedia} style={{ padding: "6px 14px", fontSize: "0.8rem" }}>Retry</button>
                </div>
            )}

            <div className="media-grid">
                {media.map((item) => (
                    <div className="media-card" key={item._id} onClick={() => setLightbox(item)} style={{ position: "relative" }}>
                        <img src={getImageUrl(item)} alt={`Shared by ${getUploaderName(item)}`} loading="lazy" />
                        <div className="media-card-info">
                            <span><User size={13} /> {getUploaderName(item)}</span>
                            <span><Calendar size={13} /> {new Date(item.createdAt || item.date).toLocaleDateString()}</span>
                        </div>
                        {canDeleteMedia(item) && (
                            <button
                                onClick={(e) => handleDeleteMedia(e, item._id)}
                                style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", border: "none", color: "#F87171", cursor: "pointer", padding: "6px", borderRadius: "6px", opacity: 0, transition: "opacity 0.2s", zIndex: 2 }}
                                className="media-delete-btn"
                                title="Delete photo"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
                {!loading && media.length === 0 && !error && (
                    <div className="empty-state" style={{ padding: "40px", gridColumn: "1 / -1" }}>
                        <ImageIcon size={48} color="var(--color-text-secondary)" style={{ marginBottom: 16 }} />
                        <h3 style={{ margin: "0 0 8px 0", color: "var(--color-text-primary)" }}>No photos yet</h3>
                        <p>Be the first to share a memory with the group!</p>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
                    <button className="lightbox-close" onClick={() => setLightbox(null)}>
                        <X size={24} />
                    </button>
                    <img src={getImageUrl(lightbox)} alt="Full size" onClick={(e) => e.stopPropagation()} />
                    <div className="lightbox-caption">
                        Shared by {getUploaderName(lightbox)} • {new Date(lightbox.createdAt || lightbox.date).toLocaleDateString()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MediaPage;
