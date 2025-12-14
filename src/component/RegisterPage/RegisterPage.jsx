// src\component\RegisterPage\RegisterPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import NoAutoFillInput from "../common/NoAutoFillInput";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // unified change handler — keys must match state fields (name, email, password, confirmPassword)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // clear password mismatch error while user types
    if (
      (name === "password" || name === "confirmPassword") &&
      error === "Passwords do not match"
    ) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic client-side validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill all fields.");
      // focus first empty
      const firstEmpty = Object.keys(formData).find((k) => !formData[k]);
      const el = firstEmpty && document.querySelector(`[name="${firstEmpty}"]`);
      if (el) el.focus();
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      const el = document.querySelector('[name="confirmPassword"]');
      if (el) el.focus();
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      const res = await api.post("/auth/register", payload);

      // Accept 200 or 201 as success depending on backend
      if (res.status === 201 || res.status === 200) {
        setSuccess("Registered successfully. Redirecting to login...");
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        setTimeout(() => navigate("/"), 1400);
      } else {
        setError(res.data?.message || "Unexpected server response.");
      }
    } catch (err) {
      console.error("Register error (full):", err);
      if (err?.response) {
        setError(
          err.response.data?.message || "Server error during registration."
        );
      } else if (err.request) {
        setError("No response from server. Check your network/backend.");
      } else {
        setError(err.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 shadow-md rounded-lg w-full max-w-md"
        noValidate
        autoComplete="off"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Register here!</h2>

        {/* Messages */}
        {error && (
          <p className="text-red-500 text-center mb-3 text-sm">{error}</p>
        )}
        {success && (
          <p className="text-yellow-500 text-center mb-3 text-sm">{success}</p>
        )}

        {/* Hidden credential sinks (most browsers will consume saved credentials here) */}
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

        {/* Full Name */}
        <NoAutoFillInput
          name="name"
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          autoComplete="off"
          required
        />

        {/* Email */}
        <NoAutoFillInput
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="off"
          required
        />

        {/* Password */}
        <div className="relative">
          <NoAutoFillInput
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            className="w-full pr-10"
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
        <div className="relative">
          <NoAutoFillInput
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            className="w-full pr-10"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full mt-2 py-2 rounded text-black transition-colors duration-200 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#dee11e] hover:bg-slate-500"
          }`}
        >
          {loading ? (
            <span className="flex justify-center items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              Registering...
            </span>
          ) : (
            "Register"
          )}
        </button>

        {/* Redirect to login */}
        <div className="mt-4 text-sm text-center">
          <span className="text-gray-600">Already have an account? </span>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-yellow-500 font-bold hover:underline"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default RegisterPage;
