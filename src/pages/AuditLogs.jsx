import React, { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  User,
  Calendar,
  FileText,
} from "lucide-react";

const API_URL =
  "https://donation-management-server-production.up.railway.app/api";

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
};

const formatData = (value) => {
  if (value === null || value === undefined) {
    return "No data";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const getUserName = (log) => {
  if (!log) return "-";

  if (log.userId && typeof log.userId === "object") {
    return (
      log.userId.name ||
      log.userId.fullName ||
      log.userId.username ||
      log.userId.email ||
      "-"
    );
  }

  return (
    log.userName ||
    log.createdByName ||
    log.userEmail ||
    "-"
  );
};

const getUserEmail = (log) => {
  if (!log) return "";

  if (log.userId && typeof log.userId === "object") {
    return log.userId.email || "";
  }

  return log.userEmail || "";
};

const getEntityId = (log) => {
  if (!log) return "-";

  if (
    log.entityId &&
    typeof log.entityId === "object"
  ) {
    return (
      log.entityId._id ||
      log.entityId.id ||
      "-"
    );
  }

  return log.entityId || "-";
};

const getActionStyle = (action) => {
  const value = String(action || "").toLowerCase();

  if (value.includes("create")) {
    return {
      background: "#dcfce7",
      color: "#166534",
    };
  }

  if (value.includes("delete")) {
    return {
      background: "#fee2e2",
      color: "#991b1b",
    };
  }

  if (
    value.includes("update") ||
    value.includes("edit")
  ) {
    return {
      background: "#dbeafe",
      color: "#1e40af",
    };
  }

  if (value.includes("status")) {
    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  }

  return {
    background: "#f3f4f6",
    color: "#374151",
  };
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const [page, setPage] = useState(1);
  const limit = 10;

  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const params = new URLSearchParams();

      params.append("page", page);
      params.append("limit", limit);

      if (search.trim()) {
        params.append(
          "search",
          search.trim()
        );
      }

      if (actionFilter) {
        params.append(
          "action",
          actionFilter
        );
      }

      if (entityFilter) {
        params.append(
          "entityType",
          entityFilter
        );
      }

      const response = await fetch(
        `${API_URL}/audit-logs?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Failed to load audit logs."
        );
      }

      const records =
        result?.data?.logs ||
        result?.data?.auditLogs ||
        result?.data?.records ||
        result?.data ||
        result?.logs ||
        result?.auditLogs ||
        result?.records ||
        [];

      const safeRecords = Array.isArray(records)
        ? records
        : [];

      setLogs(safeRecords);

      const pagination =
        result?.pagination ||
        result?.data?.pagination ||
        {};

      const total =
        pagination?.totalRecords ??
        pagination?.total ??
        result?.totalRecords ??
        result?.total ??
        safeRecords.length;

      const pages =
        pagination?.totalPages ??
        result?.totalPages ??
        Math.max(
          1,
          Math.ceil(Number(total) / limit)
        );

      setTotalRecords(
        Number(total) || 0
      );

      setTotalPages(
        Number(pages) || 1
      );
    } catch (err) {
      console.error(
        "AUDIT LOG ERROR:",
        err
      );

      setLogs([]);
      setTotalRecords(0);
      setTotalPages(1);

      setError(
        err.message ||
          "Unable to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    page,
    search,
    actionFilter,
    entityFilter,
  ]);

  const clearFilters = () => {
    setSearch("");
    setActionFilter("");
    setEntityFilter("");
    setPage(1);
  };

  const previousPage = () => {
    if (page > 1) {
      setPage((value) => value - 1);
    }
  };

  const nextPage = () => {
    if (page < totalPages) {
      setPage((value) => value + 1);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        background: "#f5f7fa",
        padding: "28px",
        boxSizing: "border-box",
      }}
    >
      {/* PAGE HEADER */}
      <div
        style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto 24px auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#e6a726",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00142b",
              flexShrink: 0,
            }}
          >
            <ClipboardList size={23} />
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                padding: 0,
                fontSize: "28px",
                lineHeight: "36px",
                fontWeight: 700,
                color: "#00142b",
                textAlign: "left",
              }}
            >
              Audit Logs
            </h1>

            <p
              style={{
                margin: "3px 0 0 0",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Track important system activities
              and changes
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minWidth: "110px",
            height: "42px",
            padding: "0 16px",
            border: "none",
            borderRadius: "8px",
            background: "#00142b",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 600,
            cursor: loading
              ? "not-allowed"
              : "pointer",
            opacity: loading ? 0.65 : 1,
          }}
        >
          <RefreshCw
            size={17}
            style={{
              animation: loading
                ? "spin 1s linear infinite"
                : "none",
            }}
          />
          Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div
        style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto 20px auto",
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "16px",
        }}
      >
        {/* TOTAL LOGS */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
            minHeight: "105px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "6px",
              }}
            >
              Total Logs
            </div>

            <div
              style={{
                fontSize: "26px",
                lineHeight: "32px",
                fontWeight: 700,
                color: "#00142b",
              }}
            >
              {totalRecords}
            </div>
          </div>

          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText
              size={21}
              color="#00142b"
            />
          </div>
        </div>

        {/* CURRENT PAGE */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
            minHeight: "105px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "6px",
              }}
            >
              Current Page
            </div>

            <div
              style={{
                fontSize: "26px",
                lineHeight: "32px",
                fontWeight: 700,
                color: "#00142b",
              }}
            >
              {page}
            </div>
          </div>

          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ClipboardList
              size={21}
              color="#2563eb"
            />
          </div>
        </div>

        {/* TOTAL PAGES */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
            minHeight: "105px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "6px",
              }}
            >
              Total Pages
            </div>

            <div
              style={{
                fontSize: "26px",
                lineHeight: "32px",
                fontWeight: 700,
                color: "#00142b",
              }}
            >
              {totalPages}
            </div>
          </div>

          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#fffbeb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calendar
              size={21}
              color="#d97706"
            />
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div
        style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto 20px auto",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
          boxSizing: "border-box",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(250px, 2fr) repeat(2, minmax(160px, 1fr)) 140px",
            gap: "12px",
            alignItems: "center",
          }}
        >
          {/* SEARCH */}
          <div
            style={{
              position: "relative",
              width: "100%",
            }}
          >
            <Search
              size={17}
              color="#9ca3af"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform:
                  "translateY(-50%)",
              }}
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search audit logs..."
              style={{
                width: "100%",
                height: "42px",
                boxSizing: "border-box",
                border:
                  "1px solid #d1d5db",
                borderRadius: "8px",
                padding:
                  "0 12px 0 38px",
                fontSize: "14px",
                outline: "none",
                color: "#111827",
                background: "#ffffff",
              }}
            />
          </div>

          {/* ACTION FILTER */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(
                e.target.value
              );
              setPage(1);
            }}
            style={{
              width: "100%",
              height: "42px",
              border:
                "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "0 12px",
              fontSize: "14px",
              color: "#374151",
              background: "#ffffff",
              outline: "none",
            }}
          >
            <option value="">
              All Actions
            </option>
            <option value="Create">
              Create
            </option>
            <option value="Update">
              Update
            </option>
            <option value="Delete">
              Delete
            </option>
            <option value="Status Change">
              Status Change
            </option>
          </select>

          {/* ENTITY FILTER */}
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(
                e.target.value
              );
              setPage(1);
            }}
            style={{
              width: "100%",
              height: "42px",
              border:
                "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "0 12px",
              fontSize: "14px",
              color: "#374151",
              background: "#ffffff",
              outline: "none",
            }}
          >
            <option value="">
              All Modules
            </option>
            <option value="Donation">
              Donation
            </option>
            <option value="Distribution">
              Distribution
            </option>
            <option value="Category">
              Category
            </option>
            <option value="Donor">
              Donor
            </option>
            <option value="User">
              User
            </option>
            <option value="Settings">
              Settings
            </option>
          </select>

          {/* CLEAR */}
          <button
            type="button"
            onClick={clearFilters}
            style={{
              width: "100%",
              height: "42px",
              border:
                "1px solid #d1d5db",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#374151",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div
          style={{
            width: "100%",
            maxWidth: "1400px",
            margin: "0 auto 20px auto",
            padding: "13px 16px",
            boxSizing: "border-box",
            borderRadius: "8px",
            border:
              "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "14px",
          }}
        >
          <strong>Error:</strong>{" "}
          {error}
        </div>
      )}

      {/* TABLE */}
      <div
        style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            width: "100%",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: "950px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#00142b",
                  color: "#ffffff",
                }}
              >
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  Date & Time
                </th>

                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  User
                </th>

                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  Module
                </th>

                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  Action
                </th>

                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  Entity ID
                </th>

                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "right",
                    fontSize: "12px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  Details
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      padding: "55px 20px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        gap: "9px",
                      }}
                    >
                      <RefreshCw
                        size={18}
                        style={{
                          animation:
                            "spin 1s linear infinite",
                        }}
                      />
                      Loading audit logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      padding: "55px 20px",
                      textAlign: "center",
                    }}
                  >
                    <ClipboardList
                      size={32}
                      color="#9ca3af"
                    />

                    <p
                      style={{
                        margin:
                          "12px 0 4px 0",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      No audit logs found
                    </p>

                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#9ca3af",
                      }}
                    >
                      Try changing your
                      search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => {
                  const actionStyle =
                    getActionStyle(
                      log.action
                    );

                  return (
                    <tr
                      key={
                        log._id ||
                        log.id ||
                        index
                      }
                      style={{
                        borderBottom:
                          "1px solid #f0f0f0",
                      }}
                    >
                      {/* DATE */}
                      <td
                        style={{
                          padding:
                            "15px 16px",
                          fontSize:
                            "13px",
                          color:
                            "#374151",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {formatDate(
                          log.createdAt ||
                            log.timestamp ||
                            log.date
                        )}
                      </td>

                      {/* USER */}
                      <td
                        style={{
                          padding:
                            "15px 16px",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width:
                                "34px",
                              height:
                                "34px",
                              borderRadius:
                                "50%",
                              background:
                                "#f3f4f6",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              flexShrink: 0,
                            }}
                          >
                            <User
                              size={16}
                              color="#6b7280"
                            />
                          </div>

                          <div>
                            <div
                              style={{
                                fontSize:
                                  "13px",
                                fontWeight:
                                  600,
                                color:
                                  "#111827",
                              }}
                            >
                              {getUserName(
                                log
                              )}
                            </div>

                            {getUserEmail(
                              log
                            ) && (
                              <div
                                style={{
                                  marginTop:
                                    "2px",
                                  fontSize:
                                    "11px",
                                  color:
                                    "#9ca3af",
                                }}
                              >
                                {getUserEmail(
                                  log
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* MODULE */}
                      <td
                        style={{
                          padding:
                            "15px 16px",
                        }}
                      >
                        <span
                          style={{
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            padding:
                              "5px 10px",
                            borderRadius:
                              "999px",
                            background:
                              "#f3f4f6",
                            color:
                              "#374151",
                            fontSize:
                              "12px",
                            fontWeight:
                              600,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {log.entityType ||
                            log.module ||
                            "-"}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td
                        style={{
                          padding:
                            "15px 16px",
                        }}
                      >
                        <span
                          style={{
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            padding:
                              "5px 10px",
                            borderRadius:
                              "999px",
                            background:
                              actionStyle.background,
                            color:
                              actionStyle.color,
                            fontSize:
                              "12px",
                            fontWeight:
                              700,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {log.action ||
                            "-"}
                        </span>
                      </td>

                      {/* ENTITY ID */}
                      <td
                        style={{
                          padding:
                            "15px 16px",
                          maxWidth:
                            "220px",
                          fontFamily:
                            "monospace",
                          fontSize:
                            "11px",
                          color:
                            "#6b7280",
                          wordBreak:
                            "break-all",
                        }}
                      >
                        {getEntityId(
                          log
                        )}
                      </td>

                      {/* VIEW */}
                      <td
                        style={{
                          padding:
                            "15px 16px",
                          textAlign:
                            "right",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedLog(
                              log
                            )
                          }
                          style={{
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            gap: "6px",
                            height:
                              "34px",
                            padding:
                              "0 11px",
                            border:
                              "1px solid #d1d5db",
                            borderRadius:
                              "7px",
                            background:
                              "#ffffff",
                            color:
                              "#374151",
                            fontSize:
                              "12px",
                            fontWeight:
                              600,
                            cursor:
                              "pointer",
                          }}
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading &&
          logs.length > 0 && (
            <div
              style={{
                minHeight:
                  "64px",
                padding:
                  "12px 16px",
                boxSizing:
                  "border-box",
                borderTop:
                  "1px solid #e5e7eb",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap: "15px",
                flexWrap:
                  "wrap",
              }}
            >
              <div
                style={{
                  fontSize:
                    "13px",
                  color:
                    "#6b7280",
                }}
              >
                Page{" "}
                <strong
                  style={{
                    color:
                      "#111827",
                  }}
                >
                  {page}
                </strong>{" "}
                of{" "}
                <strong
                  style={{
                    color:
                      "#111827",
                  }}
                >
                  {totalPages}
                </strong>
                {" • "}
                {totalRecords} total logs
              </div>

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={
                    previousPage
                  }
                  disabled={
                    page <= 1
                  }
                  style={{
                    height:
                      "36px",
                    padding:
                      "0 12px",
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "5px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius:
                      "7px",
                    background:
                      "#ffffff",
                    color:
                      "#374151",
                    fontSize:
                      "13px",
                    fontWeight:
                      600,
                    cursor:
                      page <= 1
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      page <= 1
                        ? 0.45
                        : 1,
                  }}
                >
                  <ChevronLeft
                    size={16}
                  />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={nextPage}
                  disabled={
                    page >=
                    totalPages
                  }
                  style={{
                    height:
                      "36px",
                    padding:
                      "0 12px",
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "5px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius:
                      "7px",
                    background:
                      "#ffffff",
                    color:
                      "#374151",
                    fontSize:
                      "13px",
                    fontWeight:
                      600,
                    cursor:
                      page >=
                      totalPages
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      page >=
                      totalPages
                        ? 0.45
                        : 1,
                  }}
                >
                  Next
                  <ChevronRight
                    size={16}
                  />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* DETAILS MODAL */}
      {selectedLog && (
        <div
          onClick={() =>
            setSelectedLog(null)
          }
          style={{
            position:
              "fixed",
            inset: 0,
            zIndex: 9999,
            background:
              "rgba(0,0,0,0.50)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding:
              "20px",
            boxSizing:
              "border-box",
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width:
                "100%",
              maxWidth:
                "850px",
              maxHeight:
                "90vh",
              background:
                "#ffffff",
              borderRadius:
                "14px",
              overflow:
                "hidden",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                height:
                  "68px",
                padding:
                  "0 20px",
                boxSizing:
                  "border-box",
                background:
                  "#00142b",
                color:
                  "#ffffff",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "18px",
                    lineHeight:
                      "24px",
                    fontWeight:
                      700,
                    color:
                      "#ffffff",
                  }}
                >
                  Audit Log Details
                </h2>

                <div
                  style={{
                    marginTop:
                      "2px",
                    fontSize:
                      "11px",
                    color:
                      "#cbd5e1",
                  }}
                >
                  {formatDate(
                    selectedLog.createdAt
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedLog(
                    null
                  )
                }
                style={{
                  width:
                    "36px",
                  height:
                    "36px",
                  border:
                    "none",
                  borderRadius:
                    "8px",
                  background:
                    "rgba(255,255,255,0.10)",
                  color:
                    "#ffffff",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  cursor:
                    "pointer",
                }}
              >
                <X size={19} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div
              style={{
                maxHeight:
                  "calc(90vh - 68px)",
                overflowY:
                  "auto",
                padding:
                  "20px",
                boxSizing:
                  "border-box",
              }}
            >
              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap:
                    "12px",
                }}
              >
                <div
                  style={{
                    border:
                      "1px solid #e5e7eb",
                    borderRadius:
                      "9px",
                    padding:
                      "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "11px",
                      color:
                        "#9ca3af",
                      textTransform:
                        "uppercase",
                      fontWeight:
                        700,
                    }}
                  >
                    User
                  </div>

                  <div
                    style={{
                      marginTop:
                        "5px",
                      fontSize:
                        "14px",
                      fontWeight:
                        600,
                      color:
                        "#111827",
                    }}
                  >
                    {getUserName(
                      selectedLog
                    )}
                  </div>

                  {getUserEmail(
                    selectedLog
                  ) && (
                    <div
                      style={{
                        marginTop:
                          "2px",
                        fontSize:
                          "12px",
                        color:
                          "#6b7280",
                      }}
                    >
                      {getUserEmail(
                        selectedLog
                      )}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    border:
                      "1px solid #e5e7eb",
                    borderRadius:
                      "9px",
                    padding:
                      "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "11px",
                      color:
                        "#9ca3af",
                      textTransform:
                        "uppercase",
                      fontWeight:
                        700,
                    }}
                  >
                    Action
                  </div>

                  <div
                    style={{
                      marginTop:
                        "8px",
                    }}
                  >
                    <span
                      style={{
                        display:
                          "inline-flex",
                        padding:
                          "5px 10px",
                        borderRadius:
                          "999px",
                        background:
                          getActionStyle(
                            selectedLog.action
                          ).background,
                        color:
                          getActionStyle(
                            selectedLog.action
                          ).color,
                        fontSize:
                          "12px",
                        fontWeight:
                          700,
                      }}
                    >
                      {selectedLog.action ||
                        "-"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    border:
                      "1px solid #e5e7eb",
                    borderRadius:
                      "9px",
                    padding:
                      "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "11px",
                      color:
                        "#9ca3af",
                      textTransform:
                        "uppercase",
                      fontWeight:
                        700,
                    }}
                  >
                    Module
                  </div>

                  <div
                    style={{
                      marginTop:
                        "5px",
                      fontSize:
                        "14px",
                      fontWeight:
                        600,
                      color:
                        "#111827",
                    }}
                  >
                    {selectedLog.entityType ||
                      selectedLog.module ||
                      "-"}
                  </div>
                </div>

                <div
                  style={{
                    border:
                      "1px solid #e5e7eb",
                    borderRadius:
                      "9px",
                    padding:
                      "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "11px",
                      color:
                        "#9ca3af",
                      textTransform:
                        "uppercase",
                      fontWeight:
                        700,
                    }}
                  >
                    Entity ID
                  </div>

                  <div
                    style={{
                      marginTop:
                        "5px",
                      fontFamily:
                        "monospace",
                      fontSize:
                        "11px",
                      color:
                        "#374151",
                      wordBreak:
                        "break-all",
                    }}
                  >
                    {getEntityId(
                      selectedLog
                    )}
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              {(selectedLog.description ||
                selectedLog.message) && (
                <div
                  style={{
                    marginTop:
                      "16px",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius:
                      "9px",
                    padding:
                      "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "11px",
                      color:
                        "#9ca3af",
                      textTransform:
                        "uppercase",
                      fontWeight:
                        700,
                    }}
                  >
                    Description
                  </div>

                  <div
                    style={{
                      marginTop:
                        "7px",
                      fontSize:
                        "13px",
                      color:
                        "#374151",
                      lineHeight:
                        "20px",
                    }}
                  >
                    {selectedLog.description ||
                      selectedLog.message}
                  </div>
                </div>
              )}

              {/* OLD DATA */}
              <div
                style={{
                  marginTop:
                    "18px",
                }}
              >
                <div
                  style={{
                    marginBottom:
                      "7px",
                    fontSize:
                      "13px",
                    fontWeight:
                      700,
                    color:
                      "#374151",
                  }}
                >
                  Old Data
                </div>

                <pre
                  style={{
                    margin: 0,
                    maxHeight:
                      "260px",
                    overflow:
                      "auto",
                    padding:
                      "14px",
                    borderRadius:
                      "9px",
                    background:
                      "#111827",
                    color:
                      "#e5e7eb",
                    fontFamily:
                      "Consolas, monospace",
                    fontSize:
                      "11px",
                    lineHeight:
                      "18px",
                    whiteSpace:
                      "pre-wrap",
                    wordBreak:
                      "break-word",
                  }}
                >
                  {formatData(
                    selectedLog.oldData
                  )}
                </pre>
              </div>

              {/* NEW DATA */}
              <div
                style={{
                  marginTop:
                    "18px",
                }}
              >
                <div
                  style={{
                    marginBottom:
                      "7px",
                    fontSize:
                      "13px",
                    fontWeight:
                      700,
                    color:
                      "#374151",
                  }}
                >
                  New Data
                </div>

                <pre
                  style={{
                    margin: 0,
                    maxHeight:
                      "260px",
                    overflow:
                      "auto",
                    padding:
                      "14px",
                    borderRadius:
                      "9px",
                    background:
                      "#111827",
                    color:
                      "#e5e7eb",
                    fontFamily:
                      "Consolas, monospace",
                    fontSize:
                      "11px",
                    lineHeight:
                      "18px",
                    whiteSpace:
                      "pre-wrap",
                    wordBreak:
                      "break-word",
                  }}
                >
                  {formatData(
                    selectedLog.newData
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESPONSIVE + SPIN */}
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 1100px) {
            .audit-filter-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }

          @media (max-width: 800px) {
            .audit-summary-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 650px) {
            .audit-filter-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
}