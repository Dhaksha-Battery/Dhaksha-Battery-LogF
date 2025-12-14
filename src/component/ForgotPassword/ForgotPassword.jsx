// src/component/ForgotPassword/ForgotPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import NoAutoFillInput from "../common/NoAutoFillInput";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(""); // success/info message
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email || !String(email).trim()) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      // call backend to request OTP
      const res = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });

      // Show generic message (backend already uses a non-enumerating response)
      setInfo(
        res.data?.message ||
          "If an account with that email exists, an OTP has been sent."
      );

      // short delay so user sees the confirmation, then navigate to OTP page
      setTimeout(() => {
        // you can choose the path name you registered for OTP reset
        navigate("/reset-password-otp", { state: { email: email.trim() } });
      }, 800);
    } catch (err) {
      console.error("forgot password error:", err?.response ?? err);
      setError(
        err?.response?.data?.message || "Failed to send OTP. Try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow w-full max-w-sm"
        noValidate
        autoComplete="off"
      >
        <h2 className="text-2xl font-semibold mb-4">Forgot Password</h2>

        {/* Info / Error */}
        {info && <p className="mb-3 text-sm text-green-700">{info}</p>}
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        {/* Hidden credential sinks to reduce browser autofill interference */}
        <input
          type="text"
          name="__hidden_username"
          autoComplete="username"
          style={{ display: "none" }}
          tabIndex={-1}
          aria-hidden="true"
        />
        <input
          type="password"
          name="__hidden_password"
          autoComplete="current-password"
          style={{ display: "none" }}
          tabIndex={-1}
          aria-hidden="true"
        />

        <NoAutoFillInput
          name="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="off"
        />

        <button
          type="submit"
          disabled={loading}
          className={`mt-4 w-full py-2 rounded text-black ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#dee11e] hover:bg-slate-500"
          }`}
        >
          {loading ? "Sending…" : "Send OTP"}
        </button>

        <div className="mt-4 text-sm text-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-gray-600 hover:underline"
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
}