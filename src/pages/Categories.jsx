import React, { useEffect, useMemo, useState } from "react";
import {
  FolderTree,
  Plus,
  RefreshCw,
  Save,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Percent,
  ShieldCheck,
  Info,
} from "lucide-react";

const API_URL =
  "https://donation-management-server-production.up.railway.app/api";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingPercentage, setEditingPercentage] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    allocationPercentage: "0",
    openingBalance: "0",
    sortOrder: "999",
    isActive: true,
  });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // ==========================================================
  // TOKEN
  // ==========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  };

  // ==========================================================
  // FETCH
  // ==========================================================

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/categories`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load categories"
        );
      }

      const data =
        result.data ||
        result.categories ||
        [];

      setCategories(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      setError(
        err.message || "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ==========================================================
  // ACTIVE CATEGORIES + TOTAL
  // ==========================================================

  const activeCategories = useMemo(() => {
    return categories.filter(
      (category) =>
        category.isActive !== false &&
        category.active !== false
    );
  }, [categories]);

  const totalPercentage = useMemo(() => {
    return activeCategories.reduce(
      (sum, category) =>
        sum + Number(category.allocationPercentage || 0),
      0
    );
  }, [activeCategories]);

  const total = Number(
    totalPercentage.toFixed(6)
  );

  const isValid =
    Math.abs(total - 100) < 0.000001;

  // ==========================================================
  // EDIT
  // ==========================================================

  const startEdit = (category) => {
    setEditingId(category._id);
    setEditingPercentage(
      String(category.allocationPercentage ?? "")
    );
    setError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingPercentage("");
  };

  // ==========================================================
  // SAVE
  // ==========================================================

  const saveCategory = async (category) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const percentage =
        Number(editingPercentage);

      if (!Number.isFinite(percentage)) {
        throw new Error(
          "Please enter a valid percentage."
        );
      }

      if (percentage < 0 || percentage > 100) {
        throw new Error(
          "Percentage must be between 0 and 100."
        );
      }

      const categoryIsActive =
        category.isActive !== false &&
        category.active !== false;

      const newTotal = categoryIsActive
        ? totalPercentage -
          Number(category.allocationPercentage || 0) +
          percentage
        : totalPercentage;

      const roundedNewTotal =
        Number(newTotal.toFixed(6));

      if (roundedNewTotal > 100.000001) {
        throw new Error(
          `Total allocation cannot exceed 100%. Current total would be ${roundedNewTotal}%.`
        );
      }

      const response = await fetch(
        `${API_URL}/categories/${category._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            allocationPercentage: percentage,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to update category"
        );
      }

      cancelEdit();

      setSuccess(
        "Category percentage updated successfully."
      );

      await fetchCategories();
    } catch (err) {
      setError(
        err.message ||
          "Failed to update category"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CREATE CATEGORY
  // ==========================================================

  const createCategory = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const name = newCategory.name.trim();
      const percentage = Number(newCategory.allocationPercentage);
      const openingBalance = Number(newCategory.openingBalance);
      const sortOrder = Number(newCategory.sortOrder);

      if (!name) {
        throw new Error("Category name is required.");
      }

      if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
        throw new Error("Percentage must be between 0 and 100.");
      }

      if (!Number.isFinite(openingBalance) || openingBalance < 0) {
        throw new Error("Opening balance must be a valid non-negative number.");
      }

      if (!Number.isFinite(sortOrder)) {
        throw new Error("Sort order must be a valid number.");
      }

      if (newCategory.isActive) {
        const newTotal = Number((totalPercentage + percentage).toFixed(6));

        if (newTotal > 100.000001) {
          throw new Error(
            `Total allocation cannot exceed 100%. Current total would be ${newTotal}%.`
          );
        }
      }

      const response = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          allocationPercentage: percentage,
          openingBalance,
          sortOrder,
          isActive: newCategory.isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create category");
      }

      setShowAddModal(false);
      setNewCategory({
        name: "",
        allocationPercentage: "0",
        openingBalance: "0",
        sortOrder: "999",
        isActive: true,
      });

      setSuccess("Category created successfully.");
      await fetchCategories();
    } catch (err) {
      setError(err.message || "Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // ACTIVATE / DEACTIVATE
  // ==========================================================

const toggleCategoryStatus = async (category) => {
  try {
    setActionLoadingId(category._id);
    setError("");
    setSuccess("");

    const currentlyActive =
      category.isActive !== false &&
      category.active !== false;

    const nextStatus = !currentlyActive;

    const response = await fetch(
      `${API_URL}/categories/${category._id}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: nextStatus,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to update category status"
      );
    }

    setSuccess(
      nextStatus
        ? "Category activated successfully. Allocation percentages have been redistributed equally."
        : "Category deactivated successfully. Allocation percentages have been redistributed equally."
    );

    await fetchCategories();
  } catch (err) {
    setError(
      err.message ||
        "Failed to update category status"
    );
  } finally {
    setActionLoadingId(null);
  }
};

  // ==========================================================
  // RESET EQUAL
  // ==========================================================

  const resetEqual = () => {
    if (categories.length === 0) {
      return;
    }

    const equal =
      100 / activeCategories.length;

    let runningTotal = 0;

    const updated = categories.map(
      (category, index) => {
        const isActive =
          category.isActive !== false &&
          category.active !== false;

        if (!isActive) {
          return category;
        }

        const activeIndex =
          activeCategories.findIndex(
            (item) =>
              String(item._id) === String(category._id)
          );

        let percentage;

        if (
          activeIndex ===
          activeCategories.length - 1
        ) {
          percentage = Number(
            (100 - runningTotal).toFixed(6)
          );
        } else {
          percentage = Number(
            equal.toFixed(6)
          );

          runningTotal += percentage;
        }

        return {
          ...category,
          allocationPercentage: percentage,
        };
      }
    );

    setCategories(updated);

    setSuccess(
      "Equal allocation values loaded. Click Save All to apply."
    );
  };

  // ==========================================================
  // SAVE ALL
  // ==========================================================

  const saveAll = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const active = categories.filter(
        (category) =>
          category.isActive !== false &&
          category.active !== false
      );

      const activeTotal = active.reduce(
        (sum, category) =>
          sum + Number(category.allocationPercentage || 0),
        0
      );

      const rounded =
        Number(activeTotal.toFixed(6));

      if (
        Math.abs(rounded - 100) >
        0.000001
      ) {
        throw new Error(
          `Active category allocation must equal 100%. Current total is ${rounded}%.`
        );
      }

      for (const category of active) {
        const response = await fetch(
          `${API_URL}/categories/${category._id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${getToken()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              allocationPercentage:
                Number(category.allocationPercentage),
            }),
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              `Failed to update ${category.name}`
          );
        }
      }

      setSuccess(
        "All allocation percentages saved successfully."
      );

      await fetchCategories();
    } catch (err) {
      setError(
        err.message ||
          "Failed to save categories"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // STYLES
  // ==========================================================

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f5f7fa",
      padding: "28px 32px",
      color: "#00142b",
      fontFamily:
        "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    },

    container: {
      maxWidth: "1180px",
      margin: "0 auto",
    },

    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "20px",
      marginBottom: "24px",
      flexWrap: "wrap",
    },

    titleArea: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
    },

    titleIcon: {
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      background: "#00142b",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    title: {
      margin: 0,
      fontSize: "27px",
      fontWeight: 700,
      color: "#00142b",
    },

    subtitle: {
      margin: "4px 0 0",
      fontSize: "14px",
      color: "#64748b",
    },

    actions: {
      display: "flex",
      gap: "9px",
      flexWrap: "wrap",
    },

    button: {
      height: "40px",
      padding: "0 15px",
      borderRadius: "8px",
      border: "1px solid #d8dee7",
      background: "#ffffff",
      color: "#334155",
      fontSize: "13px",
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      cursor: "pointer",
    },

    primaryButton: {
      background: "#00142b",
      color: "#ffffff",
      border: "1px solid #00142b",
    },

    disabledButton: {
      opacity: 0.5,
      cursor: "not-allowed",
    },

    summaryGrid: {
      display: "grid",
      gridTemplateColumns:
        "repeat(4, minmax(0, 1fr))",
      gap: "14px",
      marginBottom: "22px",
    },

    summaryCard: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "17px 18px",
      minHeight: "88px",
      boxSizing: "border-box",
    },

    summaryTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },

    summaryLabel: {
      fontSize: "12px",
      color: "#64748b",
      fontWeight: 500,
      marginBottom: "6px",
    },

    summaryValue: {
      fontSize: "22px",
      fontWeight: 700,
      color: "#00142b",
    },

    summaryIcon: {
      width: "36px",
      height: "36px",
      borderRadius: "9px",
      background: "#f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    alert: {
      borderRadius: "9px",
      padding: "12px 15px",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "13px",
    },

    error: {
      background: "#fef2f2",
      border: "1px solid #fecaca",
      color: "#b91c1c",
    },

    success: {
      background: "#f0fdf4",
      border: "1px solid #bbf7d0",
      color: "#15803d",
    },

    panel: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      overflow: "hidden",
    },

    panelHeader: {
      padding: "17px 20px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "15px",
    },

    panelTitle: {
      margin: 0,
      fontSize: "16px",
      fontWeight: 700,
      color: "#00142b",
    },

    panelDescription: {
      margin: "4px 0 0",
      fontSize: "12px",
      color: "#64748b",
    },

    tableWrapper: {
      overflowX: "auto",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "760px",
    },

    th: {
      background: "#f8fafc",
      color: "#64748b",
      fontSize: "11px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      padding: "12px 18px",
      borderBottom: "1px solid #e2e8f0",
      textAlign: "left",
    },

    td: {
      padding: "13px 18px",
      borderBottom: "1px solid #f1f5f9",
      fontSize: "13px",
      color: "#334155",
      verticalAlign: "middle",
    },

    categoryCell: {
      display: "flex",
      alignItems: "center",
      gap: "11px",
    },

    categoryIcon: {
      width: "34px",
      height: "34px",
      borderRadius: "8px",
      background: "#f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },

    categoryName: {
      fontWeight: 600,
      color: "#0f172a",
    },

    percentageBadge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "100px",
      padding: "7px 11px",
      borderRadius: "7px",
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      fontWeight: 700,
      color: "#00142b",
      fontSize: "13px",
    },

    statusActive: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "5px 9px",
      borderRadius: "20px",
      background: "#ecfdf5",
      color: "#047857",
      fontSize: "11px",
      fontWeight: 700,
    },

    statusInactive: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "5px 9px",
      borderRadius: "20px",
      background: "#f1f5f9",
      color: "#64748b",
      fontSize: "11px",
      fontWeight: 700,
    },

    editButton: {
      height: "34px",
      padding: "0 11px",
      borderRadius: "7px",
      border: "1px solid #d8dee7",
      background: "#ffffff",
      color: "#334155",
      fontSize: "12px",
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      cursor: "pointer",
    },

    input: {
      width: "110px",
      height: "36px",
      boxSizing: "border-box",
      border: "1px solid #cbd5e1",
      borderRadius: "7px",
      padding: "0 10px",
      fontSize: "13px",
      outline: "none",
    },

    smallButton: {
      height: "34px",
      padding: "0 10px",
      borderRadius: "7px",
      border: "none",
      color: "#ffffff",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
    },

    saveSmall: {
      background: "#15803d",
    },

    cancelSmall: {
      background: "#64748b",
    },

    totalRow: {
      background: "#f8fafc",
    },

    infoBox: {
      marginTop: "16px",
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      borderRadius: "10px",
      padding: "13px 15px",
      display: "flex",
      gap: "10px",
      color: "#1e40af",
      fontSize: "12px",
      lineHeight: 1.5,
    },
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "70px",
              textAlign: "center",
            }}
          >
            <RefreshCw
              size={28}
              style={{
                animation:
                  "categories-spin 1s linear infinite",
              }}
            />

            <p
              style={{
                color: "#64748b",
                marginTop: "12px",
                fontSize: "13px",
              }}
            >
              Loading categories...
            </p>

            <style>
              {`
                @keyframes categories-spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div style={styles.header}>

          <div style={styles.titleArea}>
            <div style={styles.titleIcon}>
              <FolderTree size={23} />
            </div>

            <div>
              <h1 style={styles.title}>
                Categories
              </h1>

              <p style={styles.subtitle}>
                Manage donation allocation categories
              </p>
            </div>
          </div>

          <div style={styles.actions}>

            <button
              onClick={() => {
                setError("");
                setSuccess("");
                setShowAddModal(true);
              }}
              disabled={saving}
              style={{
                ...styles.button,
                ...styles.primaryButton,
                ...(saving ? styles.disabledButton : {}),
              }}
            >
              <Plus size={15} />
              Add Category
            </button>

            <button
              onClick={resetEqual}
              disabled={saving}
              style={{
                ...styles.button,
                ...(saving
                  ? styles.disabledButton
                  : {}),
              }}
            >
              <RefreshCw size={15} />
              Equal Allocation
            </button>

            <button
              onClick={fetchCategories}
              disabled={saving}
              style={{
                ...styles.button,
                ...(saving
                  ? styles.disabledButton
                  : {}),
              }}
            >
              <RefreshCw size={15} />
              Refresh
            </button>

            <button
              onClick={saveAll}
              disabled={
                saving || !isValid
              }
              style={{
                ...styles.button,
                ...styles.primaryButton,
                ...(saving || !isValid
                  ? styles.disabledButton
                  : {}),
              }}
            >
              <Save size={15} />

              {saving
                ? "Saving..."
                : "Save All"}
            </button>

          </div>
        </div>

        {/* ====================================================
            ALERTS
        ==================================================== */}

        {error && (
          <div
            style={{
              ...styles.alert,
              ...styles.error,
            }}
          >
            <AlertCircle size={17} />

            <span style={{ flex: 1 }}>
              {error}
            </span>

            <button
              onClick={() => setError("")}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {success && (
          <div
            style={{
              ...styles.alert,
              ...styles.success,
            }}
          >
            <CheckCircle2 size={17} />

            <span style={{ flex: 1 }}>
              {success}
            </span>

            <button
              onClick={() => setSuccess("")}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <div style={styles.summaryGrid}>

          <div style={styles.summaryCard}>
            <div style={styles.summaryTop}>
              <div>
                <div style={styles.summaryLabel}>
                  Total Categories
                </div>

                <div style={styles.summaryValue}>
                  {categories.length}
                </div>
              </div>

              <div style={styles.summaryIcon}>
                <FolderTree size={18} />
              </div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryTop}>
              <div>
                <div style={styles.summaryLabel}>
                  Active Categories
                </div>

                <div style={styles.summaryValue}>
                  {activeCategories.length}
                </div>
              </div>

              <div style={styles.summaryIcon}>
                <CheckCircle2 size={18} />
              </div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryTop}>
              <div>
                <div style={styles.summaryLabel}>
                  Allocation Total
                </div>

                <div
                  style={{
                    ...styles.summaryValue,
                    color: isValid
                      ? "#15803d"
                      : "#dc2626",
                  }}
                >
                  {total.toFixed(6)}%
                </div>
              </div>

              <div style={styles.summaryIcon}>
                <Percent size={18} />
              </div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryTop}>
              <div>
                <div style={styles.summaryLabel}>
                  Configuration
                </div>

                <div
                  style={{
                    ...styles.summaryValue,
                    fontSize: "17px",
                    color: isValid
                      ? "#15803d"
                      : "#dc2626",
                  }}
                >
                  {isValid
                    ? "100% Valid"
                    : "Needs Review"}
                </div>
              </div>

              <div style={styles.summaryIcon}>
                <ShieldCheck size={18} />
              </div>
            </div>
          </div>

        </div>

        {/* ====================================================
            TABLE
        ==================================================== */}

        <div style={styles.panel}>

          <div style={styles.panelHeader}>

            <div>
              <h2 style={styles.panelTitle}>
                Donation Allocation Categories
              </h2>

              <p style={styles.panelDescription}>
                Configure how received donations are
                automatically allocated.
              </p>
            </div>

            <div
              style={{
                fontSize: "12px",
                color: isValid
                  ? "#15803d"
                  : "#dc2626",
                fontWeight: 700,
              }}
            >
              {isValid
                ? "✓ Allocation is valid"
                : "⚠ Total must equal 100%"}
            </div>

          </div>

          <div style={styles.tableWrapper}>

            <table style={styles.table}>

              <thead>
                <tr>
                  <th
                    style={{
                      ...styles.th,
                      width: "55px",
                    }}
                  >
                    #
                  </th>

                  <th style={styles.th}>
                    Category
                  </th>

                  <th
                    style={{
                      ...styles.th,
                      textAlign: "center",
                    }}
                  >
                    Allocation
                  </th>

                  <th
                    style={{
                      ...styles.th,
                      textAlign: "center",
                    }}
                  >
                    Status
                  </th>

                  <th
                    style={{
                      ...styles.th,
                      textAlign: "right",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>

                {categories.map(
                  (category, index) => {

                    const isEditing =
                      editingId ===
                      category._id;

                    const isActive =
                      category.isActive !==
                        false &&
                      category.active !==
                        false;

                    return (
                      <tr
                        key={
                          category._id ||
                          index
                        }
                      >

                        <td
                          style={{
                            ...styles.td,
                            color: "#94a3b8",
                            fontWeight: 600,
                          }}
                        >
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </td>

                        <td style={styles.td}>
                          <div
                            style={
                              styles.categoryCell
                            }
                          >
                            <div
                              style={
                                styles.categoryIcon
                              }
                            >
                              <FolderTree
                                size={16}
                              />
                            </div>

                            <div>
                              <div
                                style={
                                  styles.categoryName
                                }
                              >
                                {category.name}
                              </div>

                              {category.description && (
                                <div
                                  style={{
                                    fontSize:
                                      "11px",
                                    color:
                                      "#94a3b8",
                                    marginTop:
                                      "2px",
                                  }}
                                >
                                  {
                                    category.description
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                gap: "6px",
                              }}
                            >
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.000001"
                                value={
                                  editingPercentage
                                }
                                onChange={(e) =>
                                  setEditingPercentage(
                                    e.target.value
                                  )
                                }
                                style={
                                  styles.input
                                }
                              />

                              <span
                                style={{
                                  color:
                                    "#64748b",
                                  fontWeight: 600,
                                }}
                              >
                                %
                              </span>
                            </div>
                          ) : (
                            <span
                              style={
                                styles.percentageBadge
                              }
                            >
                              {Number(
                                category.allocationPercentage ||
                                  0
                              ).toFixed(6)}
                              %
                            </span>
                          )}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            textAlign: "center",
                          }}
                        >
                          {isActive ? (
                            <span
                              style={
                                styles.statusActive
                              }
                            >
                              <span>
                                ●
                              </span>
                              Active
                            </span>
                          ) : (
                            <span
                              style={
                                styles.statusInactive
                              }
                            >
                              ● Inactive
                            </span>
                          )}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            textAlign: "right",
                          }}
                        >
                          {isEditing ? (
                            <div
                              style={{
                                display: "flex",
                                justifyContent:
                                  "flex-end",
                                gap: "6px",
                              }}
                            >
                              <button
                                onClick={() =>
                                  saveCategory(
                                    category
                                  )
                                }
                                disabled={
                                  saving
                                }
                                style={{
                                  ...styles.smallButton,
                                  ...styles.saveSmall,
                                  opacity:
                                    saving
                                      ? 0.5
                                      : 1,
                                }}
                              >
                                <Save
                                  size={13}
                                />
                                Save
                              </button>

                              <button
                                onClick={
                                  cancelEdit
                                }
                                disabled={
                                  saving
                                }
                                style={{
                                  ...styles.smallButton,
                                  ...styles.cancelSmall,
                                }}
                              >
                                <X
                                  size={13}
                                />
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "6px",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                onClick={() =>
                                  startEdit(category)
                                }
                                disabled={actionLoadingId === category._id}
                                style={{
                                  ...styles.editButton,
                                  ...(actionLoadingId === category._id
                                    ? styles.disabledButton
                                    : {}),
                                }}
                              >
                                <Edit3 size={13} />
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  toggleCategoryStatus(category)
                                }
                                disabled={
                                  actionLoadingId === category._id ||
                                  saving
                                }
                                style={{
                                  ...styles.editButton,
                                  color: isActive
                                    ? "#b91c1c"
                                    : "#15803d",
                                  borderColor: isActive
                                    ? "#fecaca"
                                    : "#bbf7d0",
                                }}
                              >
                                {actionLoadingId === category._id
                                  ? "Saving..."
                                  : isActive
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

              <tfoot>
                <tr
                  style={
                    styles.totalRow
                  }
                >
                  <td
                    colSpan="2"
                    style={{
                      ...styles.td,
                      textAlign:
                        "right",
                      fontWeight: 700,
                      color:
                        "#00142b",
                    }}
                  >
                    Total Allocation
                  </td>

                  <td
                    style={{
                      ...styles.td,
                      textAlign:
                        "center",
                    }}
                  >
                    <span
                      style={{
                        ...styles.percentageBadge,
                        background:
                          isValid
                            ? "#ecfdf5"
                            : "#fef2f2",
                        borderColor:
                          isValid
                            ? "#bbf7d0"
                            : "#fecaca",
                        color:
                          isValid
                            ? "#15803d"
                            : "#dc2626",
                      }}
                    >
                      {total.toFixed(6)}%
                    </span>
                  </td>

                  <td
                    colSpan="2"
                    style={
                      styles.td
                    }
                  />
                </tr>
              </tfoot>

            </table>
          </div>
        </div>

        {/* ====================================================
            ADD CATEGORY MODAL
        ==================================================== */}

        {showAddModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.48)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "500px",
                background: "#ffffff",
                borderRadius: "14px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "18px 20px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      color: "#00142b",
                    }}
                  >
                    Add Category
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    Add a new donation allocation category.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#64748b",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  padding: "20px",
                  display: "grid",
                  gap: "14px",
                }}
              >
                <label>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Category Name
                  </div>
                  <input
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g. Community Welfare"
                    style={{
                      width: "100%",
                      height: "40px",
                      boxSizing: "border-box",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "0 11px",
                      fontSize: "13px",
                    }}
                  />
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <label>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#334155",
                        marginBottom: "6px",
                      }}
                    >
                      Allocation %
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.000001"
                      value={newCategory.allocationPercentage}
                      onChange={(e) =>
                        setNewCategory((prev) => ({
                          ...prev,
                          allocationPercentage: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        height: "40px",
                        boxSizing: "border-box",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "0 11px",
                        fontSize: "13px",
                      }}
                    />
                  </label>

                  <label>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#334155",
                        marginBottom: "6px",
                      }}
                    >
                      Opening Balance
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newCategory.openingBalance}
                      onChange={(e) =>
                        setNewCategory((prev) => ({
                          ...prev,
                          openingBalance: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        height: "40px",
                        boxSizing: "border-box",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "0 11px",
                        fontSize: "13px",
                      }}
                    />
                  </label>
                </div>

                <label>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Sort Order
                  </div>
                  <input
                    type="number"
                    value={newCategory.sortOrder}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        sortOrder: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      height: "40px",
                      boxSizing: "border-box",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "0 11px",
                      fontSize: "13px",
                    }}
                  />
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    fontSize: "13px",
                    color: "#334155",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newCategory.isActive}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                  Active category
                </label>

                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "9px",
                    padding: "11px 13px",
                    fontSize: "12px",
                    color: "#1e40af",
                    lineHeight: 1.5,
                  }}
                >
                  Existing allocation records are not changed when a
                  category is added, edited, activated, or deactivated.
                </div>
              </div>

              <div
                style={{
                  padding: "15px 20px",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                  style={{
                    ...styles.button,
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={createCategory}
                  disabled={saving}
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
                    ...(saving ? styles.disabledButton : {}),
                  }}
                >
                  <Plus size={15} />
                  {saving ? "Creating..." : "Create Category"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            INFO
        ==================================================== */}

        <div style={styles.infoBox}>
          <Info
            size={17}
            style={{
              flexShrink: 0,
              marginTop: "1px",
            }}
          />

          <div>
            <strong>
              Allocation Rule
            </strong>

            <div>
              Every donation marked as{" "}
              <strong>Received</strong>{" "}
              is automatically divided according
              to the configured allocation
              percentages. The active categories
              must total exactly{" "}
              <strong>100%</strong>.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Categories;