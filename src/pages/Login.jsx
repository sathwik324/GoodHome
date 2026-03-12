import { useState } from "react";
import api from "../api/axiosInstance";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // 1. Get token
            const res = await api.post("/auth/login", { email, password });
            const token = res.data.token;
            if (!token) throw new Error("No token received");

            // 2. Fetch user profile using the token
            const meRes = await api.get("/auth/me", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const userData = meRes.data;
            console.log("Login response user:", userData);

            // 3. Save both token AND user via AuthContext (uses sessionStorage)
            login(token, userData);

            setMsg("Login successful");
            navigate("/dashboard");
        } catch (err) {
            setMsg(err.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="page-container">
            <div className="card">
                <h2>GoodHome</h2>
                <p className="subtitle">Welcome Back</p>
                <p className="auth-link">
                    Don't have an account? <Link to="/">Register</Link>
                </p>

                <form onSubmit={handleLogin}>
                    <input
                        placeholder="Email"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className="btn-primary">Login</button>
                </form>

                {msg && <p className="msg-alert">{msg}</p>}
            </div>
        </div>
    );
}

export default Login;
