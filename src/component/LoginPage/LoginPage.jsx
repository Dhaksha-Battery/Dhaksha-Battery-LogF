import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import NoAutoFillInput from "../common/NoAutoFillInput";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // added

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, role } = res.data;

      if (!token || !role) {
        setError("Invalid response from server");
        return;
      }

      localStorage.setItem("bl_token", token);
      localStorage.setItem("bl_role", role.toLowerCase());

      if (role.toLowerCase() === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 shadow-md rounded-lg w-96"
        noValidate
        autoComplete="off"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

        {error && (
          <p className="text-red-500 text-center mb-3 text-sm">{error}</p>
        )}

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
          type="email"
          name="login_email"
          placeholder="Enter your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
          className="w-full border rounded px-3 py-2 mb-3"
          required
        />

        {/* ✅ Password field with show/hide eye */}
        <div className="relative mb-5">
          <NoAutoFillInput
            type={showPassword ? "text" : "password"}
            name="login_password"
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full border rounded px-3 py-2 pr-10"
            required
          />

          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </span>
        </div> 

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-[#dee11e] text-black py-2 rounded hover:bg-slate-500"
        >
          Login
        </button>

        {/* Redirect to Register */}
        <div className="mt-4 text-sm text-center">
          <span className="text-gray-600">Don't have an account? </span>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-yellow-500 font-bold hover:underline"
          >
            Register
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
