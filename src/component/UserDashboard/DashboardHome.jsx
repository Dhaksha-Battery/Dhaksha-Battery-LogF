// src/component/UserDashboard/DashboardHome.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DashboardHome() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center space-y-6">
        <h2 className="text-2xl font-bold">Choose Entry Mode</h2>

        <button
          onClick={() => navigate("/dashboard/single")}
          className="w-full py-3 bg-[#dee11e] text-black rounded hover:bg-slate-500"
        >
          Single Battery Entry
        </button>

        <button
          onClick={() => navigate("/dashboard/dual")}
          className="w-full py-3 bg-[#dee11e] text-black rounded hover:bg-slate-500"
        >
          Dual Battery Entry
        </button>

        <button
          onClick={() => {
            signOut();
            navigate("/");
          }}
          className="w-full py-3 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
