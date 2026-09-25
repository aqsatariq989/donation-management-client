import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================
  // HANDLE LOGIN
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!formData.password) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/auth/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      const data = response.data?.data;

      const token =
        data?.token ||
        response.data?.token;

      if (!token) {
        throw new Error(
          "Login successful, but authentication token was not received."
        );
      }

      localStorage.setItem("token", token);

      if (data?.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center bg-white overflow-hidden"
    >
      <div className="container-fluid px-3">

        <div className="row justify-content-center">

          <div className="col-12 col-sm-10 col-md-7 col-lg-5 col-xl-4">

            {/* =================================
                LOGIN CARD
            ================================= */}

            <div
              className="card border-0 rounded-4"
              style={{
                backgroundColor: "#ffffff",
                boxShadow:
                  "0 10px 35px rgba(0, 20, 43, 0.12)",
              }}
            >

              <div className="card-body px-4 py-4 px-md-5">

                {/* =================================
                    BRAND
                ================================= */}

                <div className="text-center mb-4">

                  <div
                    className="d-flex align-items-center justify-content-center mx-auto mb-3 rounded-3"
                    style={{
                      width: "50px",
                      height: "50px",
                      backgroundColor: "#00142b",
                      color: "#e6a726",
                      fontSize: "25px",
                      fontWeight: 800,
                    }}
                  >
                    D
                  </div>

                  <h1
                    className="fw-bold mb-1"
                    style={{
                      color: "#00142b",
                      fontSize: "21px",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    Donation Management
                  </h1>

                  <p
                    className="mb-0"
                    style={{
                      color: "#718096",
                      fontSize: "13px",
                    }}
                  >
                    Administration Portal
                  </p>

                </div>

                {/* =================================
                    WELCOME
                ================================= */}

                <div className="text-center mb-4">

                  <h2
                    className="fw-bold mb-1"
                    style={{
                      color: "#00142b",
                      fontSize: "20px",
                    }}
                  >
                    Welcome Back
                  </h2>

                  <p
                    className="mb-0"
                    style={{
                      color: "#718096",
                      fontSize: "13px",
                    }}
                  >
                    Sign in to access your dashboard
                  </p>

                </div>

                {/* =================================
                    ERROR
                ================================= */}

                {error && (
                  <div
                    className="alert alert-danger py-2 px-3 rounded-3 small mb-3"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {/* =================================
                    FORM
                ================================= */}

                <form onSubmit={handleSubmit}>

                  {/* EMAIL */}

                  <div className="mb-3">

                    <label
                      htmlFor="email"
                      className="form-label fw-semibold mb-2 text-start d-block"
                      style={{
                        color: "#334155",
                        fontSize: "13px",
                      }}
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="form-control rounded-3"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      autoComplete="email"
                      disabled={loading}
                      style={{
                        height: "44px",
                        fontSize: "14px",
                        borderColor: "#d5dce5",
                        boxShadow: "none",
                      }}
                    />

                  </div>

                  {/* PASSWORD */}

                  <div className="mb-4">

                    <label
                      htmlFor="password"
                      className="form-label fw-semibold mb-2 text-start d-block"
                      style={{
                        color: "#334155",
                        fontSize: "13px",
                      }}
                    >
                      Password
                    </label>

                    <div className="input-group">

                      <input
                        id="password"
                        name="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        className="form-control border-end-0"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        autoComplete="current-password"
                        disabled={loading}
                        style={{
                          height: "44px",
                          fontSize: "14px",
                          borderColor: "#d5dce5",
                          boxShadow: "none",
                          borderRadius:
                            "8px 0 0 8px",
                        }}
                      />

                      <button
                        type="button"
                        className="btn bg-white border border-start-0 d-flex align-items-center justify-content-center"
                        onClick={() =>
                          setShowPassword(
                            (previous) => !previous
                          )
                        }
                        disabled={loading}
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        style={{
                          width: "48px",
                          height: "44px",
                          borderColor: "#d5dce5",
                          borderRadius:
                            "0 8px 8px 0",
                          color: "#64748b",
                        }}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* =================================
                      SIGN IN
                  ================================= */}

                  <button
                    type="submit"
                    className="btn w-100 rounded-3 fw-semibold text-white"
                    disabled={loading}
                    style={{
                      height: "44px",
                      backgroundColor: "#00142b",
                      borderColor: "#00142b",
                      fontSize: "14px",
                    }}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>

                </form>

                {/* =================================
                    FOOTER
                ================================= */}

                <div className="text-center mt-4">

                  <span
                    style={{
                      color: "#94a3b8",
                      fontSize: "12px",
                    }}
                  >
                    Donation Management System
                  </span>

                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;