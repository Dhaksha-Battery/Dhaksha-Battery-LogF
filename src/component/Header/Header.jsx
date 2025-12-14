// src\component\Header\Header.jsx
import { useNavigate } from "react-router-dom";
import logo from "../../assets/Dhaksha-Logo-01.png"; // Make sure the path is correct

function Header() {
  const navigate = useNavigate();

  return (
    <header className="bg-[#DEE11E] text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">
        {/* Logo & Brand */}
        <div
          className="flex items-center gap-4 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src={logo}
            alt="Dhaksha Drones Logo"
            className="h-14 w-auto object-contain" // ⬅️ slightly taller logo
          />
          <div>
            <h1 className="text-xl text-black font-semibold tracking-wide">
              Dhaksha Unmanned Systems Pvt Ltd.
            </h1>
            <p className="text-sm text-black -mt-1">
              Built to Fly, Engineered to Protect
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}


export default Header;
