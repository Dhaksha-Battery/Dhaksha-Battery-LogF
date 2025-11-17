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
  customerNameCustom: "", // used when "Others" selected
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

  // cycles lookup state (placed above the form UI)
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
        console.warn("Failed to parse saved form from localStorage:", err);
      }
    }
  }, []);

  // Keep duration updated when times change
  useEffect(() => {
    const start = form.chargeTimeInitial;
    const end = form.chargeTimeFinal;

    if (start && end) {
      const dur = calculateDuration(start, end);
      setForm((s) => ({ ...s, duration: dur }));
      setErrors((prev) => {
        const next = { ...prev };
        if (next.duration) delete next.duration;
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
      const totalMinutes = Math.round(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (hours === 0 && minutes === 0) return "0 mins";
      if (minutes === 0) return `${hours} hours`;
      if (hours === 0) return `${minutes} mins`;
      return `${hours} hours ${minutes} mins`;
    } catch (err) {
      console.warn("Error calculating duration:", err);
      return "";
    }
  };

  // validation: location, customerName and zone are required (and custom customer if "Others")
  function validateAll(values) {
    const e = {};
    Object.entries(values).forEach(([key, val]) => {
      // 'others' optional
      if (["others", "customerNameCustom"].includes(key)) return;
      if (!val || String(val).trim() === "") {
        // enforce required for most fields
        e[key] = "This field is required";
      }
    });

    // Make location, customerName, zone, date, id, name required (override if present)
    ["location", "customerName", "zone", "date", "id", "name"].forEach((k) => {
      if (!values[k] || String(values[k]).trim() === "")
        e[k] = "This field is required";
    });

    // If customerName is "Others", require customerNameCustom
    if (values.customerName === "Others") {
      if (
        !values.customerNameCustom ||
        String(values.customerNameCustom).trim() === ""
      ) {
        e.customerNameCustom = "Please enter customer name";
      }
    }

    // numeric checks
    ["chargeCurrent", "battVoltInitial", "battVoltFinal"].forEach((key) => {
      if (values[key] && isNaN(Number(values[key]))) {
        e[key] = "Must be a number";
      }
    });

    return e;
  }

  const isValid = () => Object.keys(validateAll(form)).length === 0;

  const showToast = (text, ms = 3000) => {
    setToast(text);
    setTimeout(() => setToast(null), ms);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => {
      const next = { ...s, [name]: value };
      // if customerName changed away from "Others", clear custom
      if (name === "customerName" && value !== "Others")
        next.customerNameCustom = "";
      setErrors(validateAll(next));
      try {
        localStorage.setItem("batteryFormData", JSON.stringify(next));
      } catch (err) {
        console.warn("Failed to save draft to localStorage:", err);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateAll(form);
    setErrors(validation);
    if (Object.keys(validation).length) {
      const firstField = Object.keys(validation)[0];
      const el = document.querySelector(`[name="${firstField}"]`);
      if (el) el.focus();
      return;
    }

    try {
      setLoading(true);

      // resolve customerName (use custom if Others)
      const resolvedCustomerName =
        form.customerName === "Others"
          ? (form.customerNameCustom || "").trim()
          : form.customerName;

      const payload = {
        ...form,
        customerName: resolvedCustomerName,
      };

      const res = await api.post("/rows", payload);

      // backend returns assigned chargingCycle (if implemented)
      // backend returns assigned chargingCycle (if implemented)
      const assigned = res?.data?.chargingCycle ?? null;
      if (
        assigned !== null &&
        assigned !== undefined &&
        String(assigned).trim() !== ""
      ) {
        // DON'T setCycleCount(...) here — only show toast
        showToast(`Submitted successfully — cycles so far: ${assigned}`);
      } else {
        showToast("Submitted successfully");
      }

      setForm(initialForm);
      setErrors({});
      try {
        localStorage.removeItem("batteryFormData");
      } catch (err) {
        console.warn("Failed to clear batteryFormData from localStorage:", err);
      }
    } catch (error) {
      console.error("Submit error:", error?.response ?? error);
      showToast(error?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field) =>
    `mt-1 block w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
      errors[field]
        ? "border-red-500 ring-red-200 focus:ring-red-400"
        : "border-gray-200"
    }`;

  // ===== cycles lookup helpers =====
  const fetchCycles = async (batteryId) => {
    if (!batteryId || !String(batteryId).trim()) {
      setCycleCount(null);
      showToast("Enter a battery id to lookup");
      return;
    }
    try {
      setLookupLoading(true);
      setCycleCount(null);
      const res = await api.get("/rows/cycles", {
        params: { batteryId: batteryId.trim() },
      });
      const n = res.data?.cycles ?? 0;
      setCycleCount(Number(n));
    } catch (err) {
      console.error("fetchCycles error:", err?.response ?? err);
      showToast(err?.response?.data?.message || "Failed to fetch cycles");
      setCycleCount(null);
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

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="flex flex-col">
        {/* ===== cycles lookup (above form) ===== */}
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
              className="px-4 py-2 bg-[#dee11e] text-black rounded disabled:opacity-60"
            >
              {lookupLoading ? "Loading..." : "Get"}
            </button>
          </div>
          <div className="mt-2">
            {cycleCount === null ? (
              <span className="text-gray-500 text-sm">No cycles loaded</span>
            ) : (
              <span className="text-base font-semibold">
                Cycles: {cycleCount}
              </span>
            )}
          </div>
        </div>
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-center mb-6">
            Battery Charging Log
          </h2>

          {/* ===== form ===== */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            noValidate
            autoComplete="off"
          >
            {/* Battery ID and Date */}
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

            {/* Customer Name and Zone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-base font-semibold text-black mt-1">
                  Customer Name *
                </span>

                {/* select controls whether we show the custom input */}
                <select
                  name="customerName"
                  value={
                    showCustomCustomer ? "Others" : form.customerName || ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Others") {
                      // switch to custom input mode and set customerName to "Others"
                      setShowCustomCustomer(true);
                      setForm((s) => {
                        const next = {
                          ...s,
                          customerName: "Others",
                          customerNameCustom: "",
                        };
                        setErrors(validateAll(next));
                        try {
                          localStorage.setItem(
                            "batteryFormData",
                            JSON.stringify(next)
                          );
                        } catch (err) {
                          console.warn(
                            "Failed to save draft to localStorage:",
                            err
                          );
                        }
                        return next;
                      });
                    } else {
                      // user selected a known customer, store it directly in customerName
                      setShowCustomCustomer(false);
                      setForm((s) => {
                        const next = {
                          ...s,
                          customerName: val,
                          customerNameCustom: "",
                        };
                        setErrors(validateAll(next));
                        try {
                          localStorage.setItem(
                            "batteryFormData",
                            JSON.stringify(next)
                          );
                        } catch (err) {
                          console.warn(
                            "Failed to save draft to localStorage:",
                            err
                          );
                        }
                        return next;
                      });
                    }
                  }}
                  className={inputCls("customerName")}
                  required
                >
                  <option value="">Select Customer Name</option>
                  <option value="IFFCO">IFFCO</option>
                  <option value="CIL">CIL</option>
                  <option value="Others">Others</option>
                </select>

                {/* show error for customerName if exists */}
                {errors.customerName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.customerName}
                  </p>
                )}

                {/* When Others is chosen, show a text input bound to customerNameCustom */}
                {showCustomCustomer && (
                  <div className="mt-2">
                    <NoAutoFillInput
                      label="Enter customer name"
                      name="customerNameCustom"
                      value={form.customerNameCustom}
                      onChange={handleChange}
                      className={inputCls("customerNameCustom")}
                    />
                  </div>
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

            {/* Location / Charge Current */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-base font-semibold text-black mt-1">
                  Location *
                </span>
                <select
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className={inputCls("location")}
                  required
                >
                  <option value="">Select Location</option>
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
                required
              />
            </div>

            {/* Battery Voltage */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Battery Voltage (V) *
              </div>
              <div className="grid grid-cols-2 gap-4">
                <NoAutoFillInput
                  label="Initial"
                  name="battVoltInitial"
                  value={form.battVoltInitial}
                  onChange={handleChange}
                  className={inputCls("battVoltInitial")}
                  required
                />
                <NoAutoFillInput
                  label="Final"
                  name="battVoltFinal"
                  value={form.battVoltFinal}
                  onChange={handleChange}
                  className={inputCls("battVoltFinal")}
                  required
                />
              </div>
            </div>

            {/* Charge Times */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Charging Time (HH:MM) *
              </div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                [Please enter time in 24-hour format]
              </div>
              <div className="grid grid-cols-3 gap-4">
                <NoAutoFillInput
                  label="Initial"
                  name="chargeTimeInitial"
                  value={form.chargeTimeInitial}
                  onChange={handleChange}
                  className={inputCls("chargeTimeInitial")}
                  required
                />
                <NoAutoFillInput
                  label="Final"
                  name="chargeTimeFinal"
                  value={form.chargeTimeFinal}
                  onChange={handleChange}
                  className={inputCls("chargeTimeFinal")}
                  required
                />
                <NoAutoFillInput
                  label="Duration"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  className={inputCls("duration")}
                  readOnly
                />
              </div>
            </div>

            {/* Drone number, UIN, Name */}
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
                required
              />
            </div>

            {/* Physical Status */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Physical Status *
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-black mt-1">
                    Temperature *
                  </span>
                  <select
                    name="temp"
                    value={form.temp}
                    onChange={handleChange}
                    className={inputCls("temp")}
                    required
                  >
                    <option value="">Select Temperature</option>
                    <option value="Normal">Normal</option>
                    <option value="Overheat">Overheat</option>
                  </select>
                  {errors.temp && (
                    <p className="text-red-500 text-xs mt-1">{errors.temp}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-base font-semibold text-black mt-1">
                    Deformation *
                  </span>
                  <select
                    name="deformation"
                    value={form.deformation}
                    onChange={handleChange}
                    className={inputCls("deformation")}
                    required
                  >
                    <option value="">Select deformation</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {errors.deformation && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.deformation}
                    </p>
                  )}
                </div>

                <NoAutoFillInput
                  label="Others (if any)"
                  name="others"
                  value={form.others}
                  onChange={handleChange}
                  className={inputCls("others")}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !isValid()}
                className={`flex-1 py-2 rounded text-black ${
                  loading || !isValid()
                    ? "bg-gray-400 cursor-not-allowed"
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

        {/* Toast popup */}
        {toast && (
          <div className="fixed left-1/2 transform -translate-x-1/2 bottom-8 z-50">
            <div className="bg-black text-white px-4 py-2 rounded shadow">
              {toast}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

//KAUSHIK.S
