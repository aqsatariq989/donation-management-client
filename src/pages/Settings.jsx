import { useEffect, useMemo, useState } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  HandCoins,
  Percent,
  ReceiptText,
  Database,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL =
  "https://donation-management-server-production.up.railway.app/api";

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken") ||
    ""
  );
};

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const defaultGeneral = {
  organizationName: "Donation Management",
  email: "",
  phone: "",
  address: "",
  currency: "PKR",
  dateFormat: "DD/MM/YYYY",
};

const defaultDonation = {
  defaultPaymentMethod: "Cash",
  receiptPrefix: "DON",
  receiptFooter:
    "Thank you for your generous contribution.",
};

function Settings() {
  const [activeTab, setActiveTab] = useState("general");

  const [general, setGeneral] = useState(defaultGeneral);
  const [donation, setDonation] = useState(defaultDonation);

  const [categories, setCategories] = useState([]);
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationSaving, setAllocationSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [systemInfo] = useState({
    backend: "http://localhost:5000",
    frontend: window.location.origin,
    environment: "Development",
  });

  useEffect(() => {
    loadLocalSettings();
    loadCategories();
  }, []);

  const loadLocalSettings = () => {
    try {
      const savedGeneral = localStorage.getItem(
        "donation_general_settings"
      );

      const savedDonation = localStorage.getItem(
        "donation_settings"
      );

      if (savedGeneral) {
        setGeneral({
          ...defaultGeneral,
          ...JSON.parse(savedGeneral),
        });
      }

      if (savedDonation) {
        setDonation({
          ...defaultDonation,
          ...JSON.parse(savedDonation),
        });
      }
    } catch (err) {
      console.error("Settings load error:", err);
    }
  };

  const loadCategories = async () => {
    try {
      setAllocationLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/categories`, {
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load categories"
        );
      }

      setCategories(result.data || []);
    } catch (err) {
      console.error("Category settings error:", err);
      setError(err.message || "Failed to load category settings");
    } finally {
      setAllocationLoading(false);
    }
  };

  const handleGeneralChange = (field, value) => {
    setGeneral((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDonationChange = (field, value) => {
    setDonation((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveGeneralSettings = () => {
    try {
      localStorage.setItem(
        "donation_general_settings",
        JSON.stringify(general)
      );

      setMessage("General settings saved successfully.");
      setError("");

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to save general settings.");
    }
  };

  const saveDonationSettings = () => {
    try {
      localStorage.setItem(
        "donation_settings",
        JSON.stringify(donation)
      );

      setMessage("Donation settings saved successfully.");
      setError("");

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to save donation settings.");
    }
  };

    const activeCategories = useMemo(() => {
  return categories.filter((category) => category.isActive);
}, [categories]);

const totalPercentage = useMemo(() => {
  return activeCategories.reduce((total, category) => {
    return total + Number(category.allocationPercentage || 0);
  }, 0);
}, [activeCategories]);

  const percentageValid =
    Math.abs(totalPercentage - 100) < 0.0001;

  const handlePercentageChange = (id, value) => {
    setCategories((prev) =>
      prev.map((category) =>
        category._id === id
          ? {
              ...category,
              allocationPercentage: value,
            }
          : category
      )
    );
  };

  const saveAllocation = async () => {
    if (!percentageValid) {
      setError(
        `Allocation percentage must equal 100%. Current total: ${totalPercentage.toFixed(
          6
        )}%`
      );
      return;
    }

    try {
      setAllocationSaving(true);
      setError("");
      setMessage("");

      for (const category of categories) {
        const response = await fetch(
          `${API_BASE}/categories/${category._id}`,
          {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              name: category.name,
              allocationPercentage:
                Number(category.allocationPercentage),
              sortOrder: category.sortOrder,
              isActive: category.isActive,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              `Failed to update ${category.name}`
          );
        }
      }

      await loadCategories();

      setMessage(
        "Category allocation percentages saved successfully."
      );

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Allocation save error:", err);
      setError(
        err.message ||
          "Failed to save allocation percentages."
      );
    } finally {
      setAllocationSaving(false);
    }
  };

  const equalAllocation = async () => {
    try {
      setAllocationSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE}/categories/equal-allocation`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to apply equal allocation."
        );
      }

      await loadCategories();

      setMessage(
        "Equal allocation applied successfully."
      );

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Equal allocation error:", err);
      setError(
        err.message ||
          "Failed to apply equal allocation."
      );
    } finally {
      setAllocationSaving(false);
    }
  };

  const tabs = [
    {
      id: "general",
      label: "General",
      icon: Building2,
    },
    {
      id: "donation",
      label: "Donation",
      icon: HandCoins,
    },
    {
      id: "allocation",
      label: "Category Allocation",
      icon: Percent,
    },
    {
      id: "receipt",
      label: "Receipt",
      icon: ReceiptText,
    },
    {
      id: "system",
      label: "System",
      icon: Database,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
        padding: "32px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "25px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <SettingsIcon size={28} color="#00142b" />

              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  fontWeight: 700,
                  color: "#00142b",
                }}
              >
                Settings
              </h1>
            </div>

            <p
              style={{
                margin: "7px 0 0",
                color: "#718096",
              }}
            >
              Manage donation system configuration and preferences.
            </p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            style={{
              background: "#ecfdf3",
              border: "1px solid #b7ebc6",
              color: "#18794e",
              padding: "13px 16px",
              borderRadius: "10px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#b42318",
              padding: "13px 16px",
              borderRadius: "10px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage("");
                  setError("");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 16px",
                  borderRadius: "9px",
                  border: active
                    ? "1px solid #00142b"
                    : "1px solid #d9e0e7",
                  backgroundColor: active
                    ? "#00142b"
                    : "#ffffff",
                  color: active
                    ? "#ffffff"
                    : "#334155",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "28px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
          }}
        >
          {/* GENERAL */}
          {activeTab === "general" && (
            <>
              <SectionTitle
                title="General Settings"
                description="Basic organization and system information."
              />

              <div style={gridStyle}>
                <Field
                  label="Organization Name"
                  value={general.organizationName}
                  onChange={(value) =>
                    handleGeneralChange(
                      "organizationName",
                      value
                    )
                  }
                />

                <Field
                  label="Email"
                  type="email"
                  value={general.email}
                  onChange={(value) =>
                    handleGeneralChange("email", value)
                  }
                />

                <Field
                  label="Phone"
                  value={general.phone}
                  onChange={(value) =>
                    handleGeneralChange("phone", value)
                  }
                />

                <SelectField
                  label="Currency"
                  value={general.currency}
                  onChange={(value) =>
                    handleGeneralChange("currency", value)
                  }
                  options={[
                    { value: "PKR", label: "PKR - Pakistani Rupee" },
                    { value: "USD", label: "USD - US Dollar" },
                  ]}
                />

                <SelectField
                  label="Date Format"
                  value={general.dateFormat}
                  onChange={(value) =>
                    handleGeneralChange("dateFormat", value)
                  }
                  options={[
                    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                    { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                  ]}
                />

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>
                    Address
                  </label>

                  <textarea
                    value={general.address}
                    onChange={(e) =>
                      handleGeneralChange(
                        "address",
                        e.target.value
                      )
                    }
                    rows={3}
                    style={textareaStyle}
                    placeholder="Organization address"
                  />
                </div>
              </div>

              <SaveButton
                onClick={saveGeneralSettings}
                text="Save General Settings"
              />
            </>
          )}

          {/* DONATION */}
          {activeTab === "donation" && (
            <>
              <SectionTitle
                title="Donation Settings"
                description="Configure default donation behavior."
              />

              <div style={gridStyle}>
                <SelectField
                  label="Default Payment Method"
                  value={donation.defaultPaymentMethod}
                  onChange={(value) =>
                    handleDonationChange(
                      "defaultPaymentMethod",
                      value
                    )
                  }
                  options={[
                    { value: "Cash", label: "Cash" },
                    { value: "Bank", label: "Bank" },
                    { value: "Online", label: "Online" },
                    { value: "Other", label: "Other" },
                  ]}
                />

                <Field
                  label="Receipt Prefix"
                  value={donation.receiptPrefix}
                  onChange={(value) =>
                    handleDonationChange(
                      "receiptPrefix",
                      value.toUpperCase()
                    )
                  }
                />
              </div>

              <SaveButton
                onClick={saveDonationSettings}
                text="Save Donation Settings"
              />
            </>
          )}

          {/* ALLOCATION */}
          {activeTab === "allocation" && (
            <>
              <SectionTitle
                title="Category Allocation"
                description="Configure how received donations are automatically allocated across active categories."
              />

              <div
                style={{
                  padding: "15px 18px",
                  borderRadius: "10px",
                  backgroundColor: percentageValid
                    ? "#ecfdf3"
                    : "#fff7ed",
                  border: `1px solid ${
                    percentageValid
                      ? "#bbf7d0"
                      : "#fed7aa"
                  }`,
                  marginBottom: "20px",
                }}
              >
                <strong>
                  Total Allocation:{" "}
                  {totalPercentage.toFixed(6)}%
                </strong>

                <div
                  style={{
                    fontSize: "13px",
                    marginTop: "4px",
                    color: "#64748b",
                  }}
                >
                  {percentageValid
                    ? "Allocation is valid and equals 100%."
                    : "Allocation must equal exactly 100% before saving."}
                </div>
              </div>

              {allocationLoading ? (
                <div
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Loading categories...
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "10px",
                      marginBottom: "15px",
                    }}
                  >
                    <button
                      onClick={loadCategories}
                      disabled={allocationSaving}
                      style={secondaryButton}
                    >
                      <RefreshCw size={16} />
                      Refresh
                    </button>

                    <button
                      onClick={equalAllocation}
                      disabled={allocationSaving}
                      style={secondaryButton}
                    >
                      <Percent size={16} />
                      Equal Allocation
                    </button>
                  </div>

                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    {categories.map((category, index) => (
                      <div
                        key={category._id}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "60px 1fr 180px 120px",
                          alignItems: "center",
                          gap: "15px",
                          padding: "15px 18px",
                          borderBottom:
                            index === categories.length - 1
                              ? "none"
                              : "1px solid #edf2f7",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#64748b",
                          }}
                        >
                          {index + 1}
                        </div>

                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#1e293b",
                            }}
                          >
                            {category.name}
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              color: "#64748b",
                              marginTop: "3px",
                            }}
                          >
                            {category.isActive
                              ? "Active"
                              : "Inactive"}
                          </div>
                        </div>

                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.000001"
                          value={
                            category.allocationPercentage
                          }
                          disabled={
                            !category.isActive ||
                            allocationSaving
                          }
                          onChange={(e) =>
                            handlePercentageChange(
                              category._id,
                              e.target.value
                            )
                          }
                          style={{
                            ...inputStyle,
                            textAlign: "right",
                          }}
                        />

                        <div
                          style={{
                            color: "#64748b",
                            fontSize: "13px",
                          }}
                        >
                          {category.isActive
                            ? "Active"
                            : "Inactive"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: "20px",
                      paddingTop: "20px",
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <SaveButton
                      onClick={saveAllocation}
                      text={
                        allocationSaving
                          ? "Saving..."
                          : "Save Allocation"
                      }
                      disabled={allocationSaving}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* RECEIPT */}
          {activeTab === "receipt" && (
            <>
              <SectionTitle
                title="Receipt Settings"
                description="Configure the basic receipt information used by the system."
              />

              <div style={gridStyle}>
                <Field
                  label="Receipt Prefix"
                  value={donation.receiptPrefix}
                  onChange={(value) =>
                    handleDonationChange(
                      "receiptPrefix",
                      value.toUpperCase()
                    )
                  }
                />

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>
                    Receipt Footer
                  </label>

                  <textarea
                    value={donation.receiptFooter}
                    onChange={(e) =>
                      handleDonationChange(
                        "receiptFooter",
                        e.target.value
                      )
                    }
                    rows={4}
                    style={textareaStyle}
                  />
                </div>
              </div>

              <SaveButton
                onClick={saveDonationSettings}
                text="Save Receipt Settings"
              />
            </>
          )}

          {/* SYSTEM */}
          {activeTab === "system" && (
            <>
              <SectionTitle
                title="System Information"
                description="Current application environment and connection information."
              />

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                <InfoRow
                  label="Application"
                  value="Donation Management System"
                />

                <InfoRow
                  label="Frontend"
                  value={systemInfo.frontend}
                />

                <InfoRow
                  label="Backend API"
                  value={systemInfo.backend}
                />

                <InfoRow
                  label="Environment"
                  value={systemInfo.environment}
                />

                <InfoRow
                  label="Database"
                  value="MongoDB Atlas"
                />

                <InfoRow
                  label="Architecture"
                  value="MERN Stack"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div
      style={{
        marginBottom: "25px",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "22px",
          color: "#00142b",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: "6px 0 0",
          color: "#718096",
          fontSize: "14px",
        }}
      >
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SaveButton({
  onClick,
  text,
  disabled = false,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        marginTop: "22px",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "11px 18px",
        border: "none",
        borderRadius: "8px",
        backgroundColor: disabled
          ? "#94a3b8"
          : "#00142b",
        color: "#ffffff",
        fontWeight: 600,
        cursor: disabled
          ? "not-allowed"
          : "pointer",
      }}
    >
      <Save size={17} />
      {text}
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        padding: "15px 17px",
        border: "1px solid #e2e8f0",
        borderRadius: "9px",
      }}
    >
      <span
        style={{
          fontWeight: 600,
          color: "#475569",
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: "#64748b",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "20px",
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  fontSize: "13px",
  fontWeight: 600,
  color: "#475569",
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  outline: "none",
  fontSize: "14px",
  backgroundColor: "#ffffff",
  boxSizing: "border-box",
};

const textareaStyle = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  outline: "none",
  fontSize: "14px",
  resize: "vertical",
  boxSizing: "border-box",
};

const secondaryButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  padding: "9px 13px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#334155",
  fontWeight: 600,
  cursor: "pointer",
};

export default Settings;