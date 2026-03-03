import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const register = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "https://goodhome-backend.onrender.com/api/auth/register",
        { name, email, password }
      );

      setMsg("Registration successful");

      setTimeout(() => {
        navigate("/login");
      }, 1000);

    } catch (err) {
      setMsg(err.response?.data?.message || "Register failed");
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        <h2>GoodHome</h2>
        <p className="subtitle">Create Account</p>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>

        <form onSubmit={register}>
          <input
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn-primary">Register</button>
        </form>

        {msg && <p className="msg-alert">{msg}</p>}
      </div>
    </div>
  );
}

export default Register;
