import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      if (res.data.role === "admin") {
        navigate("/admin");
      } else if (res.data.role === "user") {
        navigate("/user");
      } else if (res.data.role === "superadmin") {
        navigate("/superadmin");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo Section */}
        <div className="login-logo-section">
          <div className="logo-wrapper">
            <img src="/Logo3.png" alt="Chauhan Logo" className="login-logo" />
          </div>
          <h1 className="login-title"></h1>
          <p className="login-subtitle">Employee Payroll System</p>
        </div>

        {/* Form Section */}
        <div className="login-form-section">
          <h2 className="login-heading">Welcome Back</h2>
          <p className="login-description">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Input */}
            <div className="login-form-group">
              <label htmlFor="email" className="login-label">
                📧 Email Address
              </label>
              <input
                id="email"
                type="email"
                className="login-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Input */}
            <div className="login-form-group">
              <label htmlFor="password" className="login-label">
                🔐 Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="login-error">
                <span className="error-icon">⚠️</span> {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`login-button ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Signing in...
                </>
              ) : (
                "🔓 Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p className="login-footer-text">
              For login Credentials Contact:<br />
              <code>admin@example.com</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;