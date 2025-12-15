// src/component/UserDashboard/DualUserDashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserDashboard from "./UserDashboard";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";

/* SAME INITIAL FORM STRUCTURE AS UserDashboard */
const initialForm = {
  id: "",
  date: "",
  customerName: "",
  customerNameCustom: "",
  zone: "",
  location: "",
  chargeCurrent: "",
  battVoltInitial: "",
  battVoltFinal: "",
  chargeTimeInitial: "",
  chargeTimeFinal: "",
  duration: "",
  droneno: "",
  temp: "",
  deformation: "",
  others: "",
  uin: "",
  name: "",
};

export default function DualUserDashboard() {
  const [form1, setForm1] = useState(initialForm);
  const [form2, setForm2] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();
  const { signOut } = useAuth();

  const showToastMsg = (text, ms = 3000) => {
    setToast(text);
    setTimeout(() => setToast(null), ms);
  };

  /* 🔐 VALIDATION — SAME RULES AS SINGLE FORM */
  const validateAll = (values) => {
    const e = {};
    Object.entries(values).forEach(([k, v]) => {
      if (["others", "customerNameCustom"].includes(k)) return;
      if (!v || String(v).trim() === "") e[k] = "required";
    });

    if (
      values.customerName === "Others" &&
      !values.customerNameCustom?.trim()
    ) {
      e.customerNameCustom = "required";
    }

    return e;
  };

  const isForm1Valid = Object.keys(validateAll(form1)).length === 0;
  const isForm2Valid = Object.keys(validateAll(form2)).length === 0;
  const canSubmitBoth = isForm1Valid && isForm2Valid;

  /* 🚀 FINAL SUBMIT */
  const handleSubmitBoth = async () => {
    if (!canSubmitBoth) return;

    try {
      setLoading(true);

      const resolveCustomer = (form) => ({
        ...form,
        customerName:
          form.customerName === "Others"
            ? (form.customerNameCustom || "").trim()
            : form.customerName,
      });

      const res = await api.post("/rows", {
        primary: resolveCustomer(form1),
        secondary: resolveCustomer(form2),
      });

      // ✅ SAME UX AS SINGLE FORM (toast-style message)
      showToastMsg(
        res.data?.chargingCycle
          ? `Submitted successfully — cycles so far: ${res.data.chargingCycle}`
          : "Submitted successfully"
      );

      // ✅ reset both forms (NO redirect)
      setForm1(initialForm);
      setForm2(initialForm);
    } catch (err) {
      showToastMsg(err?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="flex flex-col gap-10 w-full max-w-5xl">
        {/* 🔹 FIRST FORM (WITH LOOKUP, NO ACTIONS) */}
        <UserDashboard
          embedded
          hideActions
          title="Battery Charging Log - Battery 1"
          formData={form1}
          setFormData={setForm1}
        />

        {/* 🔹 SECOND FORM (NO LOOKUP, NO ACTIONS) */}
        <UserDashboard
          embedded
          hideLookup
          hideActions
          title="Battery Charging Log - Battery 2"
          formData={form2}
          setFormData={setForm2}
        />

        {/* ✅ SINGLE ACTION BAR */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmitBoth}
            disabled={!canSubmitBoth || loading}
            className={`flex-1 py-3 rounded text-black ${
              canSubmitBoth
                ? "bg-[#dee11e] hover:bg-slate-500"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>

          <button
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded"
          >
            Logout
          </button>
        </div>
      </div>
      {toast && (
        <div className="fixed left-1/2 transform -translate-x-1/2 bottom-8 z-50 bg-black text-white px-4 py-2 rounded shadow">
          {toast}
        </div>
      )}
    </div>
  );
}
