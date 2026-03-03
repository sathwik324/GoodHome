import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
    const navigate = useNavigate();
    const { login: saveToken } = useAuth(); // Import from context to persist token

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");

    const login = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(
                "https://goodhome-backend.onrender.com/api/auth/login",
                { email, password }
            );

            // Fix: Actually save the token so ProtectedRoutes and Dashboard can use it!
            saveToken(res.data.token);

            setMsg("Login successful");
            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);
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

                <form onSubmit={login}>
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
