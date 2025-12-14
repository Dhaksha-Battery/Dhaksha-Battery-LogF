// src/component/UserDashboard/UserDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import NoAutoFillInput from "../common/NoAutoFillInput";

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

export default function UserDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const [lookupBatteryId, setLookupBatteryId] = useState("");
  const [cycleCount, setCycleCount] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [showCustomCustomer, setShowCustomCustomer] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("batteryFormData");
    if (saved) {
      try {
        setForm(JSON.parse(saved));
      } catch (err) {
        console.warn(err);
      }
    }
  }, []);

  useEffect(() => {
    const start = form.chargeTimeInitial;
    const end = form.chargeTimeFinal;

    if (start && end) {
      const dur = calculateDuration(start, end);
      setForm((s) => ({ ...s, duration: dur }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.duration;
        return next;
      });
    } else {
      setForm((s) => ({ ...s, duration: "" }));
    }
  }, [form.chargeTimeInitial, form.chargeTimeFinal]);

  const calculateDuration = (startStr, endStr) => {
    try {
      const [sh, sm] = startStr.split(":").map(Number);
      const [eh, em] = endStr.split(":").map(Number);
      const start = new Date(1970, 0, 1, sh, sm, 0);
      let end = new Date(1970, 0, 1, eh, em, 0);
      if (end < start) end.setDate(end.getDate() + 1);
      const diffMs = end - start;
      const minutes = Math.round(diffMs / 60000);
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      if (h === 0 && m === 0) return "0 mins";
      if (m === 0) return `${h} hours`;
      if (h === 0) return `${m} mins`;
      return `${h} hours ${m} mins`;
    } catch {
      return "";
    }
  };

  function validateAll(values) {
    const e = {};
    Object.entries(values).forEach(([k, v]) => {
      if (["others", "customerNameCustom"].includes(k)) return;
      if (!v || String(v).trim() === "") e[k] = "This field is required";
    });

    if (values.customerName === "Others" && !values.customerNameCustom.trim()) {
      e.customerNameCustom = "Please enter customer name";
    }

    ["chargeCurrent", "battVoltInitial", "battVoltFinal"].forEach((key) => {
      if (values[key] && isNaN(Number(values[key])))
        e[key] = "Must be a number";
    });
    return e;
  }

  const isValid = () => Object.keys(validateAll(form)).length === 0;

  const showToastMsg = (text, ms = 3000) => {
    setToast(text);
    setTimeout(() => setToast(null), ms);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => {
      const next = { ...s, [name]: value };
      if (name === "customerName" && value !== "Others")
        next.customerNameCustom = "";
      setErrors(validateAll(next));
      localStorage.setItem("batteryFormData", JSON.stringify(next));
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateAll(form);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    try {
      setLoading(true);

      const resolvedCustomerName =
        form.customerName === "Others"
          ? (form.customerNameCustom || "").trim()
          : form.customerName;

      const payload = { ...form, customerName: resolvedCustomerName };

      const res = await api.post("/rows", payload);

      showToastMsg(
        res.data?.chargingCycle
          ? `Submitted successfully — cycles so far: ${res.data.chargingCycle}`
          : "Submitted successfully"
      );

      // RESET FORM CORRECTLY
      setForm(initialForm);
      setErrors({});
      setShowCustomCustomer(false); // ★ FIX FOR YOUR ISSUE
      localStorage.removeItem("batteryFormData");
    } catch (error) {
      showToastMsg(error?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchCycles = async (batteryId) => {
    if (!batteryId.trim()) return showToastMsg("Enter a battery id");

    try {
      setLookupLoading(true);
      const res = await api.get("/rows/cycles", { params: { batteryId } });
      setCycleCount(Number(res.data?.cycles ?? 0));
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      showToastMsg("Failed to fetch cycles");
    } finally {
      setLookupLoading(false);
    }
  };

  const onLookupKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchCycles(lookupBatteryId);
    }
  };

  const inputCls = (field) =>
    `mt-1 block w-full px-3 py-2 border rounded ${
      errors[field] ? "border-red-500" : "border-gray-200"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="flex flex-col">
        {/* LOOKUP SECTION */}
        <div className="mb-6">
          <label className="text-base font-bold text-gray-700">
            Lookup cycles by Battery ID
          </label>
          <div className="flex gap-3 mt-2">
            <input
              type="text"
              value={lookupBatteryId}
              onChange={(e) => setLookupBatteryId(e.target.value)}
              onKeyDown={onLookupKey}
              placeholder="Type your battery id"
              className="flex-1 border px-3 py-2 rounded"
            />
            <button
              onClick={() => fetchCycles(lookupBatteryId)}
              disabled={lookupLoading}
              className="px-4 py-2 bg-[#dee11e] text-black rounded"
            >
              {lookupLoading ? "Loading..." : "Get"}
            </button>
          </div>

          {/* CYCLE DISPLAY WITH COLORS */}
          <div className="mt-2">
            {cycleCount === null ? (
              <span className="text-gray-500 text-sm">No cycles loaded</span>
            ) : cycleCount === 0 ? (
              <span className="text-gray-500 text-sm">Cycles: 0</span>
            ) : (
              <span
                className={`text-base font-semibold ${
                  cycleCount <= 250
                    ? "text-green-600"
                    : cycleCount <= 450
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                Cycles: {cycleCount}{" "}
                {cycleCount > 500 && (
                  <span className="text-red-600 font-bold ml-2">Critical!</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* ---- FORM ---- */}
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-center mb-6">
            Battery Charging Log
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Battery ID + Date */}
            <div className="grid grid-cols-2 gap-4">
              <NoAutoFillInput
                label="Battery ID"
                name="id"
                value={form.id}
                onChange={handleChange}
                className={inputCls("id")}
                required
              />
              <NoAutoFillInput
                label="Date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className={inputCls("date")}
                required
              />
            </div>

            {/* Customer Name */}
            <div className="grid grid-cols-2 gap-4">
              {/* Customer Name */}
              <div className="flex flex-col">
                <span className="text-base font-semibold">Customer Name *</span>
                <select
                  name="customerName"
                  value={
                    showCustomCustomer ? "Others" : form.customerName || ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Others") {
                      setShowCustomCustomer(true);
                      setForm((s) => ({
                        ...s,
                        customerName: "Others",
                        customerNameCustom: "",
                      }));
                    } else {
                      setShowCustomCustomer(false);
                      setForm((s) => ({
                        ...s,
                        customerName: val,
                        customerNameCustom: "",
                      }));
                    }
                  }}
                  className={inputCls("customerName")}
                >
                  <option value="">Select Customer Name</option>
                  <option value="IFFCO">IFFCO</option>
                  <option value="CIL">CIL</option>
                  <option value="Others">Others</option>
                </select>
                {showCustomCustomer && (
                  <NoAutoFillInput
                    label="Enter customer name"
                    name="customerNameCustom"
                    value={form.customerNameCustom}
                    onChange={handleChange}
                    className={inputCls("customerNameCustom")}
                  />
                )}
              </div>

              <NoAutoFillInput
                label="Zone"
                name="zone"
                value={form.zone}
                onChange={handleChange}
                className={inputCls("zone")}
                required
              />
            </div>

            {/* Location + Charge Current */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="font-semibold">Location *</span>
                <select
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className={inputCls("location")}
                >
                  <option value="">Select Location</option>

                  {/* All states */}
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Andaman and Nicobar Islands">
                    Andaman and Nicobar Islands
                  </option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Dadra & Nagar Haveli and Daman & Diu">
                    Dadra & Nagar Haveli and Daman & Diu
                  </option>
                  <option value="Delhi (NCT)">Delhi (NCT)</option>
                  <option value="Jammu & Kashmir">Jammu & Kashmir</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Lakshadweep">Lakshadweep</option>
                  <option value="Puducherry">Puducherry</option>
                </select>
              </div>

              <NoAutoFillInput
                label="Charge Current (A)"
                name="chargeCurrent"
                value={form.chargeCurrent}
                onChange={handleChange}
                className={inputCls("chargeCurrent")}
              />
            </div>

            {/* Battery Voltages */}
            <div>
              <div className="font-semibold">Battery Voltage (V) *</div>
              <div className="grid grid-cols-2 gap-4">
                <NoAutoFillInput
                  label="Initial"
                  name="battVoltInitial"
                  value={form.battVoltInitial}
                  onChange={handleChange}
                  className={inputCls("battVoltInitial")}
                />
                <NoAutoFillInput
                  label="Final"
                  name="battVoltFinal"
                  value={form.battVoltFinal}
                  onChange={handleChange}
                  className={inputCls("battVoltFinal")}
                />
              </div>
            </div>

            {/* Charging Times */}
            <div>
              <div className="font-semibold">Charging Time (HH:MM) *</div>
              <div className="grid grid-cols-3 gap-4">
                <NoAutoFillInput
                  label="Initial"
                  name="chargeTimeInitial"
                  value={form.chargeTimeInitial}
                  onChange={handleChange}
                  className={inputCls("chargeTimeInitial")}
                />
                <NoAutoFillInput
                  label="Final"
                  name="chargeTimeFinal"
                  value={form.chargeTimeFinal}
                  onChange={handleChange}
                  className={inputCls("chargeTimeFinal")}
                />
                <NoAutoFillInput
                  label="Duration"
                  name="duration"
                  value={form.duration}
                  readOnly
                  className={inputCls("duration")}
                />
              </div>
            </div>

            {/* Drone, UIN, Name */}
            <div className="grid grid-cols-3 gap-4">
              <NoAutoFillInput
                label="Drone number"
                name="droneno"
                value={form.droneno}
                onChange={handleChange}
                className={inputCls("droneno")}
              />
              <NoAutoFillInput
                label="UIN of UAS"
                name="uin"
                value={form.uin}
                onChange={handleChange}
                className={inputCls("uin")}
              />
              <NoAutoFillInput
                label="Responsible Person (Name)"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputCls("name")}
              />
            </div>

            {/* Physical Status */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="font-semibold">Temperature *</span>
                <select
                  name="temp"
                  value={form.temp}
                  onChange={handleChange}
                  className={inputCls("temp")}
                >
                  <option value="">Select Temperature</option>
                  <option value="Normal">Normal</option>
                  <option value="Overheat">Overheat</option>
                </select>
              </div>

              <div className="flex flex-col">
                <span className="font-semibold">Deformation *</span>
                <select
                  name="deformation"
                  value={form.deformation}
                  onChange={handleChange}
                  className={inputCls("deformation")}
                >
                  <option value="">Select Deformation</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <NoAutoFillInput
                label="Others (if any)"
                name="others"
                value={form.others}
                onChange={handleChange}
                className={inputCls("others")}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !isValid()}
                className={`flex-1 py-2 rounded text-black ${
                  loading || !isValid()
                    ? "bg-gray-400"
                    : "bg-[#dee11e] hover:bg-slate-500"
                }`}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>

              <button
                type="button"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
                className="flex-1 py-2 bg-[#dee11e] text-black rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </form>
        </div>

        {toast && (
          <div className="fixed left-1/2 transform -translate-x-1/2 bottom-8 z-50 bg-black text-white px-4 py-2 rounded shadow">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

//KAUSHIK.S
