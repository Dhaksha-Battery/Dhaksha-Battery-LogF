// src/component/ResetPassword/ResetPasswordOtp.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api";
import NoAutoFillInput from "../common/NoAutoFillInput";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ResetPasswordOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  // email passed from ForgotPassword page (optional)
  const emailFromState = location.state?.email || "";

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [info, setInfo] = useState(
    "If an account with that email exists, an OTP has been sent."
  );
  const [error, setError] = useState("");

  // Prevent browser autofill from filling password (extra safety)
  // Keep hidden inputs at top of form (they are read by the browser's autofill)
  useEffect(() => {
    // Clear any accidental autofill values in password fields on mount
    setNewPassword("");
    setConfirmPassword("");
  }, []);

  const validate = () => {
    if (!email || !String(email).trim()) return "Email is required";
    if (!otp || !String(otp).trim()) return "OTP is required";
    if (!newPassword) return "New password is required";
    if (newPassword.length < 6)
      return "Password should be at least 6 characters";
    if (newPassword !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // 🔐 Frontend validation: confirm password match
    if (newPassword !== confirmPassword) {
      setError("New password and Confirm password must match.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      setInfo(
        res.data?.message ||
          "Password reset successful. Redirecting to login..."
      );

      // Clear sensitive fields
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");

      setTimeout(() => navigate("/"), 1100);
    } catch (err) {
      console.error("reset-password error:", err?.response ?? err);

      setError(
        err?.response?.data?.message ||
          "Reset failed. Please check the OTP and try again."
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
        <h2 className="text-2xl font-semibold mb-3">Reset Password</h2>

        {/* Generic info about OTP */}
        {info && <p className="mb-3 text-sm text-gray-700">{info}</p>}
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

        <span className="text-green-600 text-sm" >Please check your spam folder for the OTP</span>

        {/* Email (prefilled when available) */}
        <NoAutoFillInput
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
          required
          // If email was passed, keep it readonly to avoid user changing it accidentally
          {...(emailFromState ? { readOnly: true } : {})}
        />

        {/* OTP */}
        <NoAutoFillInput
          label="OTP"
          name="otp"
          placeholder="Enter the 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          autoComplete="off"
          required
        />

        {/* New Password */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full border rounded px-3 py-2 pr-10"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </span>
        </div>

        {/* Confirm Password */}
        <div className="relative mb-4">
          <input
            type={showConfirmPassword ? "text" : "password"}
            className="w-full border rounded px-3 py-2 pr-10"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <FaEyeSlash size={18} />
            ) : (
              <FaEye size={18} />
            )}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full mt-4 py-2 rounded text-black ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#dee11e] hover:bg-slate-500"
          }`}
        >
          {loading ? "Resetting..." : "Reset Password"}
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
