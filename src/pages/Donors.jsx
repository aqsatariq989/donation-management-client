import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  Users,
  DollarSign,
  CalendarDays,
  X,
  Plus,
  Pencil,
  Trash2,
  Filter,
  Mail,
  Phone,
} from "lucide-react";

const API_URL =
  "https://donation-management-server-production.up.railway.app/api";

const NAVY = "#00142b";
const GOLD = "#e6a726";
const LIGHT_BG = "#f5f7fa";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken") ||
    ""
  );
}

// ======================================================
// DECIMAL128 SAFE CURRENCY
// ======================================================

function formatCurrency(value) {
  let rawValue = value;

  if (
    rawValue &&
    typeof rawValue === "object" &&
    rawValue.$numberDecimal !== undefined
  ) {
    rawValue = rawValue.$numberDecimal;
  }

  const amount = Number(rawValue);

  if (!Number.isFinite(amount)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ======================================================
// DATE
// ======================================================

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

// ======================================================
// DONORS
// ======================================================

function Donors() {
  const [donors, setDonors] = useState([]);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    minDonated: "",
    maxDonated: "",
    minDonations: "",
    maxDonations: "",
    firstDonationStart: "",
    firstDonationEnd: "",
    lastDonationStart: "",
    lastDonationEnd: "",
  });

  const [showFilters, setShowFilters] =
    useState(false);

  const [page, setPage] = useState(1);

  const [pagination, setPagination] =
    useState({
      currentPage: 1,
      perPage: 10,
      totalRecords: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  // ====================================================
  // ADD / EDIT MODAL
  // ====================================================

  const [showDonorModal, setShowDonorModal] =
    useState(false);

  const [editingDonor, setEditingDonor] =
    useState(null);

  const [donorForm, setDonorForm] =
    useState({
      name: "",
      phone: "",
      email: "",
    });

  const [savingDonor, setSavingDonor] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // ====================================================
  // HISTORY MODAL
  // ====================================================

  const [selectedDonor, setSelectedDonor] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyError, setHistoryError] =
    useState("");

  const [showHistory, setShowHistory] =
    useState(false);

  // ====================================================
  // DELETE
  // ====================================================

  const [deletingDonorId, setDeletingDonorId] =
    useState(null);

  // ====================================================
  // FETCH DONORS
  // ====================================================

  const fetchDonors = async (
    requestedPage = 1,
    searchOverride = search,
    filtersOverride = filters
  ) => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const params =
        new URLSearchParams();

      params.set(
        "page",
        String(requestedPage)
      );

      params.set("limit", "10");

      if (
        String(searchOverride).trim()
      ) {
        params.set(
          "search",
          String(searchOverride).trim()
        );
      }

      Object.entries(
        filtersOverride
      ).forEach(([key, value]) => {
        if (
          String(value || "").trim()
        ) {
          params.set(
            key,
            String(value).trim()
          );
        }
      });

      console.log(
        "DONOR FILTER REQUEST:",
        params.toString()
      );

      const response = await fetch(
        `${API_URL}/donors?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load donors."
        );
      }

      const data = Array.isArray(
        result.data
      )
        ? result.data
        : Array.isArray(
            result.donors
          )
        ? result.donors
        : [];

      setDonors(data);

      const meta =
        result.pagination ||
        result.meta ||
        {};

      const currentPage =
        Number(
          meta.currentPage ??
            requestedPage
        ) || 1;

      const perPage =
        Number(
          meta.perPage ?? 10
        ) || 10;

      const totalRecords =
        Number(
          meta.totalRecords ??
            result.totalRecords ??
            data.length
        ) || 0;

      const totalPages =
        Number(
          meta.totalPages ??
            Math.max(
              Math.ceil(
                totalRecords /
                  perPage
              ),
              1
            )
        ) || 1;

      setPagination({
        currentPage,
        perPage,
        totalRecords,
        totalPages,
        hasNextPage:
          meta.hasNextPage !==
          undefined
            ? Boolean(
                meta.hasNextPage
              )
            : currentPage <
              totalPages,
        hasPreviousPage:
          meta.hasPreviousPage !==
          undefined
            ? Boolean(
                meta.hasPreviousPage
              )
            : currentPage > 1,
      });

      setPage(currentPage);
    } catch (err) {
      console.error(
        "Donors error:",
        err
      );

      setError(
        err.message ||
          "Failed to load donors."
      );

      setDonors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    fetchDonors(
      1,
      "",
      {
        minDonated: "",
        maxDonated: "",
        minDonations: "",
        maxDonations: "",
        firstDonationStart: "",
        firstDonationEnd: "",
        lastDonationStart: "",
        lastDonationEnd: "",
      }
    );
  }, []);

  // ====================================================
  // SEARCH
  // ====================================================

  const handleSearch = (
    event
  ) => {
    event.preventDefault();

    setPage(1);

    fetchDonors(
      1,
      search,
      filters
    );
  };

  // ====================================================
  // CLEAR ALL
  // ====================================================

  const handleClearAll = () => {
    const emptyFilters = {
      minDonated: "",
      maxDonated: "",
      minDonations: "",
      maxDonations: "",
      firstDonationStart: "",
      firstDonationEnd: "",
      lastDonationStart: "",
      lastDonationEnd: "",
    };

    setSearch("");
    setFilters(emptyFilters);
    setPage(1);

    fetchDonors(
      1,
      "",
      emptyFilters
    );
  };

  // ====================================================
  // APPLY FILTERS
  // ====================================================

  const handleApplyFilters = () => {
    setPage(1);

    fetchDonors(
      1,
      search,
      filters
    );
  };

  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchDonors(
      page,
      search,
      filters
    );
  };

  // ====================================================
  // PAGINATION
  // ====================================================

  const handlePageChange = (
    newPage
  ) => {
    if (
      newPage < 1 ||
      newPage >
        pagination.totalPages
    ) {
      return;
    }

    fetchDonors(
      newPage,
      search,
      filters
    );
  };

  // ====================================================
  // OPEN ADD
  // ====================================================

  const openAddDonor = () => {
    setEditingDonor(null);

    setDonorForm({
      name: "",
      phone: "",
      email: "",
    });

    setFormError("");

    setShowDonorModal(true);
  };

  // ====================================================
  // OPEN EDIT
  // ====================================================

  const openEditDonor = (
    donor
  ) => {
    setEditingDonor(donor);

    setDonorForm({
      name:
        donor.name || "",
      phone:
        donor.phone || "",
      email:
        donor.email || "",
    });

    setFormError("");

    setShowDonorModal(true);
  };

  // ====================================================
  // CLOSE ADD / EDIT
  // ====================================================

  const closeDonorModal = () => {
    if (savingDonor) return;

    setShowDonorModal(false);
    setEditingDonor(null);
    setFormError("");
  };

  // ====================================================
  // FORM CHANGE
  // ====================================================

  const handleDonorFormChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setDonorForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ====================================================
  // SAVE DONOR
  // ====================================================

  const handleSaveDonor = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSavingDonor(true);
      setFormError("");
      setSuccessMessage("");

      if (
        !donorForm.name.trim()
      ) {
        setFormError(
          "Donor name is required."
        );

        return;
      }

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const isEditing =
        Boolean(editingDonor);

      const url = isEditing
        ? `${API_URL}/donors/${editingDonor._id}`
        : `${API_URL}/donors`;

      const response =
        await fetch(url, {
          method: isEditing
            ? "PUT"
            : "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },

          body: JSON.stringify({
            name:
              donorForm.name.trim(),

            phone:
              donorForm.phone.trim(),

            email:
              donorForm.email
                .trim()
                .toLowerCase(),
          }),
        });

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to save donor."
        );
      }

      setShowDonorModal(false);
      setEditingDonor(null);

      setSuccessMessage(
        isEditing
          ? "Donor updated successfully."
          : "Donor added successfully."
      );

      await fetchDonors(
        page,
        search,
        filters
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (err) {
      console.error(
        "Save donor error:",
        err
      );

      setFormError(
        err.message ||
          "Failed to save donor."
      );
    } finally {
      setSavingDonor(false);
    }
  };

  // ====================================================
  // DELETE DONOR
  // ====================================================

  const handleDeleteDonor = async (
    donor
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${donor.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingDonorId(
        donor._id
      );
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const response =
        await fetch(
          `${API_URL}/donors/${donor._id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept:
                "application/json",
            },
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to delete donor."
        );
      }

      setSuccessMessage(
        "Donor deleted successfully."
      );

      await fetchDonors(
        page,
        search,
        filters
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (err) {
      console.error(
        "Delete donor error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete donor."
      );
    } finally {
      setDeletingDonorId(null);
    }
  };

  // ====================================================
  // VIEW HISTORY
  // ====================================================

  const handleViewHistory = async (
    donor
  ) => {
    try {
      setSelectedDonor(donor);
      setShowHistory(true);
      setHistoryLoading(true);
      setHistoryError("");
      setHistory([]);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const response =
        await fetch(
          `${API_URL}/donors/${donor._id}/donations`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept:
                "application/json",
            },
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load donation history."
        );
      }

      const data =
        Array.isArray(
          result.data
        )
          ? result.data
          : [];

      setHistory(data);
    } catch (err) {
      console.error(
        "Donor history error:",
        err
      );

      setHistoryError(
        err.message ||
          "Failed to load donor history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // ====================================================
  // CLOSE HISTORY
  // ====================================================

  const closeHistory = () => {
    setShowHistory(false);
    setSelectedDonor(null);
    setHistory([]);
    setHistoryError("");
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (
    loading &&
    donors.length === 0
  ) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{
          backgroundColor:
            LIGHT_BG,
        }}
      >
        <div className="text-center">
          <div
            className="spinner-border"
            style={{
              color: GOLD,
              width: "3rem",
              height: "3rem",
            }}
          />

          <div
            className="mt-3 fw-semibold"
            style={{
              color: NAVY,
            }}
          >
            Loading donors...
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <div
      className="min-vh-100"
      style={{
        backgroundColor:
          LIGHT_BG,
      }}
    >
      <div className="container-fluid px-3 px-xl-4 py-4">

        {/* HEADER */}

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">

          <div>
            <div
              className="text-uppercase small fw-semibold mb-1"
              style={{
                color: GOLD,
                letterSpacing:
                  "1.5px",
              }}
            >
              Administration
            </div>

            <h1
              className="mb-1"
              style={{
                color: NAVY,
                fontWeight: 750,
                fontSize:
                  "2rem",
              }}
            >
              Donors
            </h1>

            <p className="text-secondary mb-0">
              Manage donors, contributions
              and complete donation history.
            </p>
          </div>

          <div className="d-flex gap-2">

            <button
              type="button"
              className="btn d-flex align-items-center gap-2"
              onClick={
                handleRefresh
              }
              disabled={
                refreshing
              }
              style={{
                backgroundColor:
                  "#ffffff",
                border:
                  "1px solid #d9dee7",
                color: NAVY,
                borderRadius:
                  "9px",
                fontWeight: 600,
                padding:
                  "10px 16px",
              }}
            >
              <RefreshCw
                size={17}
              />

              Refresh
            </button>

            <button
              type="button"
              className="btn d-flex align-items-center gap-2"
              onClick={
                openAddDonor
              }
              style={{
                backgroundColor:
                  GOLD,
                color: NAVY,
                border: "none",
                borderRadius:
                  "9px",
                fontWeight: 700,
                padding:
                  "10px 18px",
              }}
            >
              <Plus size={18} />

              Add Donor
            </button>

          </div>
        </div>

        {/* SUCCESS */}

        {successMessage && (
          <div
            className="alert alert-success border-0 shadow-sm"
            style={{
              borderRadius:
                "10px",
            }}
          >
            {successMessage}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div
            className="alert alert-danger border-0 shadow-sm"
            style={{
              borderRadius:
                "10px",
            }}
          >
            {error}
          </div>
        )}

        {/* SEARCH */}

        <div
          className="card border-0 shadow-sm mb-3"
          style={{
            borderRadius:
              "16px",
            border:
              "1px solid #e9edf3",
          }}
        >
          <div className="card-body p-3 p-lg-4">

            <form
              onSubmit={
                handleSearch
              }
              className="d-flex flex-column flex-lg-row gap-2"
            >

              <div className="position-relative flex-grow-1">

                <Search
                  size={19}
                  className="position-absolute top-50 translate-middle-y"
                  style={{
                    left: "15px",
                    color:
                      "#7a869a",
                  }}
                />

                <input
                  type="text"
                  className="form-control"
                  value={search}
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search donor by name, phone or email..."
                  style={{
                    height:
                      "46px",
                    paddingLeft:
                      "45px",
                    borderRadius:
                      "9px",
                    borderColor:
                      "#d9dee7",
                  }}
                />

              </div>

              <button
                type="submit"
                className="btn"
                style={{
                  minWidth:
                    "110px",
                  backgroundColor:
                    NAVY,
                  color:
                    "#ffffff",
                  borderRadius:
                    "9px",
                  fontWeight: 600,
                }}
              >
                Search
              </button>

              <button
                type="button"
                className="btn d-flex align-items-center justify-content-center gap-2"
                onClick={() =>
                  setShowFilters(
                    !showFilters
                  )
                }
                style={{
                  border:
                    "1px solid #d9dee7",
                  backgroundColor:
                    showFilters
                      ? "#eef3f8"
                      : "#ffffff",
                  color: NAVY,
                  borderRadius:
                    "9px",
                  fontWeight: 600,
                }}
              >
                <Filter
                  size={17}
                />

                Filters
              </button>

              {(search ||
                Object.values(
                  filters
                ).some(
                  (value) =>
                    value !== ""
                )) && (
                <button
                  type="button"
                  className="btn d-flex align-items-center justify-content-center gap-1"
                  onClick={
                    handleClearAll
                  }
                  style={{
                    border:
                      "1px solid #d9dee7",
                    backgroundColor:
                      "#ffffff",
                    color: NAVY,
                    borderRadius:
                      "9px",
                  }}
                >
                  <X size={16} />
                  Clear
                </button>
              )}

            </form>

          </div>
        </div>

        {/* FILTER PANEL */}

        {showFilters && (
          <div
            className="card border-0 shadow-sm mb-4"
            style={{
              borderRadius:
                "16px",
              border:
                "1px solid #e9edf3",
            }}
          >
            <div className="card-body p-3 p-lg-4">

              <div className="row g-3">

                {/* MIN DONATED */}

                <div className="col-12 col-md-6 col-lg-3">
                  <label className="form-label small fw-semibold">
                    Min Total Donated
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={
                      filters.minDonated
                    }
                    onChange={(
                      event
                    ) =>
                      setFilters(
                        {
                          ...filters,
                          minDonated:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    placeholder="0.00"
                  />
                </div>

                {/* MAX DONATED */}

                <div className="col-12 col-md-6 col-lg-3">
                  <label className="form-label small fw-semibold">
                    Max Total Donated
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={
                      filters.maxDonated
                    }
                    onChange={(
                      event
                    ) =>
                      setFilters(
                        {
                          ...filters,
                          maxDonated:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    placeholder="0.00"
                  />
                </div>

                {/* MIN DONATIONS */}

                <div className="col-12 col-md-6 col-lg-3">
                  <label className="form-label small fw-semibold">
                    Min Donations
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="form-control"
                    value={
                      filters.minDonations
                    }
                    onChange={(
                      event
                    ) =>
                      setFilters(
                        {
                          ...filters,
                          minDonations:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    placeholder="0"
                  />
                </div>

                {/* MAX DONATIONS */}

                <div className="col-12 col-md-6 col-lg-3">
                  <label className="form-label small fw-semibold">
                    Max Donations
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="form-control"
                    value={
                      filters.maxDonations
                    }
                    onChange={(
                      event
                    ) =>
                      setFilters(
                        {
                          ...filters,
                          maxDonations:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    placeholder="0"
                  />
                </div>

                {/* FIRST START */}

                <div className="col-12 col-md-6 col-lg-3">
                  <label className="form-label small fw-semibold">
                    First Donation From
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={
                      filters.firstDonationStart
                    }
                    onChange={(
                      event
                    ) =>
                      setFilters(
                        {
                          ...filters,
                          firstDonationStart:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                  />
                </div>

                {/* FIRST END */}

                <div className="col-12 col-md-6 col-lg-3">
                  <label className="form-label small fw-semibold">
                    First Donation To
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={
                      filters.firstDonationEnd
                    }
                    onChange={(
                      event
                    ) =>
                      setFilters(
                        {
                          ...filters,
                          firstDonationEnd:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                  />
                </div>

                {/* LAST START */}

                <div className="col-12 col-md-6 col-lg-3">
                  <label className="form-label small fw-semibold">
                    Last Donation From
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={
                      filters.lastDonationStart
                    }
                    onChange={(
                      event
                    ) =>
                      setFilters(
                        {
                          ...filters,
                          lastDonationStart:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                  />
                </div>

                {/* LAST END */}

                <div className="col-12 col-md-6 col-lg-3">
                  <label className="form-label small fw-semibold">
                    Last Donation To
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={
                      filters.lastDonationEnd
                    }
                    onChange={(
                      event
                    ) =>
                      setFilters(
                        {
                          ...filters,
                          lastDonationEnd:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                  />
                </div>

              </div>

              <div className="d-flex gap-2 mt-4">

                <button
                  type="button"
                  className="btn"
                  onClick={
                    handleApplyFilters
                  }
                  style={{
                    backgroundColor:
                      GOLD,
                    color: NAVY,
                    fontWeight: 700,
                    borderRadius:
                      "8px",
                  }}
                >
                  Apply Filters
                </button>

                <button
                  type="button"
                  className="btn btn-light"
                  onClick={
                    handleClearAll
                  }
                >
                  Clear
                </button>

              </div>

            </div>
          </div>
        )}

        {/* SUMMARY */}

        <div className="row g-3 mb-4">

          <div className="col-12 col-md-4">

            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius:
                  "16px",
              }}
            >
              <div className="card-body d-flex align-items-center gap-3">

                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor:
                      "#eef3f8",
                    color: NAVY,
                  }}
                >
                  <Users size={24} />
                </div>

                <div>
                  <div className="small text-secondary">
                    Total Donors
                  </div>

                  <div
                    className="fs-4 fw-bold"
                    style={{
                      color: NAVY,
                    }}
                  >
                    {
                      pagination.totalRecords
                    }
                  </div>
                </div>

              </div>
            </div>

          </div>

          <div className="col-12 col-md-4">

            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius:
                  "16px",
              }}
            >
              <div className="card-body d-flex align-items-center gap-3">

                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor:
                      "#fff6df",
                    color: GOLD,
                  }}
                >
                  <DollarSign
                    size={24}
                  />
                </div>

                <div>
                  <div className="small text-secondary">
                    Showing
                  </div>

                  <div
                    className="fs-4 fw-bold"
                    style={{
                      color: NAVY,
                    }}
                  >
                    {donors.length}
                  </div>
                </div>

              </div>
            </div>

          </div>

          <div className="col-12 col-md-4">

            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius:
                  "16px",
              }}
            >
              <div className="card-body d-flex align-items-center gap-3">

                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor:
                      "#eef3f8",
                    color: NAVY,
                  }}
                >
                  <CalendarDays
                    size={24}
                  />
                </div>

                <div>
                  <div className="small text-secondary">
                    Current Page
                  </div>

                  <div
                    className="fs-4 fw-bold"
                    style={{
                      color: NAVY,
                    }}
                  >
                    {
                      pagination.currentPage
                    }{" "}
                    /{" "}
                    {
                      pagination.totalPages
                    }
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* TABLE */}

        <div
          className="card border-0 shadow-sm"
          style={{
            borderRadius:
              "16px",
            overflow: "hidden",
            border:
              "1px solid #e9edf3",
          }}
        >

          <div className="card-header bg-white border-bottom py-3 px-4">

            <div className="d-flex justify-content-between align-items-center">

              <div>
                <h5
                  className="mb-1"
                  style={{
                    color: NAVY,
                    fontWeight: 700,
                  }}
                >
                  Donor Records
                </h5>

                <div className="small text-secondary">
                  {
                    pagination.totalRecords
                  }{" "}
                  total donors
                </div>
              </div>

              {loading && (
                <div
                  className="spinner-border spinner-border-sm"
                  style={{
                    color: GOLD,
                  }}
                />
              )}

            </div>

          </div>

          <div className="table-responsive">

            <table className="table align-middle mb-0">

              <thead>

                <tr
                  style={{
                    backgroundColor:
                      "#f7f9fc",
                  }}
                >

                  <th className="px-4 py-3 small text-uppercase text-secondary">
                    Donor
                  </th>

                  <th className="py-3 small text-uppercase text-secondary">
                    Contact
                  </th>

                  <th className="py-3 small text-uppercase text-secondary">
                    Total Donated
                  </th>

                  <th className="py-3 small text-uppercase text-secondary">
                    Donations
                  </th>

                  <th className="py-3 small text-uppercase text-secondary">
                    First Donation
                  </th>

                  <th className="py-3 small text-uppercase text-secondary">
                    Last Donation
                  </th>

                  <th className="text-end px-4 py-3 small text-uppercase text-secondary">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {donors.length === 0 ? (
                  <tr>

                    <td
                      colSpan="7"
                      className="text-center py-5"
                    >
                      <Users
                        size={42}
                        className="text-secondary mb-2"
                      />

                      <div className="fw-semibold">
                        No donors found
                      </div>

                      <div className="small text-secondary">
                        Try changing your search
                        or filters.
                      </div>
                    </td>

                  </tr>
                ) : (
                  donors.map(
                    (donor) => {

                      const name =
                        donor.name ||
                        "Unknown Donor";

                      return (
                        <tr
                          key={
                            donor._id
                          }
                        >

                          <td className="px-4 py-3">

                            <div className="d-flex align-items-center gap-3">

                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                style={{
                                  width:
                                    "42px",
                                  height:
                                    "42px",
                                  backgroundColor:
                                    "#fff1cf",
                                  color:
                                    NAVY,
                                }}
                              >
                                {name
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>

                              <div>

                                <div
                                  className="fw-semibold"
                                  style={{
                                    color:
                                      NAVY,
                                  }}
                                >
                                  {name}
                                </div>

                                <div className="small text-secondary">
                                  ID:{" "}
                                  {String(
                                    donor._id
                                  ).slice(
                                    -8
                                  )}
                                </div>

                              </div>

                            </div>

                          </td>

                          <td className="py-3">

                            <div className="small d-flex align-items-center gap-1">
                              <Phone
                                size={
                                  13
                                }
                              />

                              {donor.phone ||
                                "-"}
                            </div>

                            <div className="small text-secondary d-flex align-items-center gap-1 mt-1">
                              <Mail
                                size={
                                  13
                                }
                              />

                              {donor.email ||
                                "-"}
                            </div>

                          </td>

                          <td
                            className="py-3 fw-bold"
                            style={{
                              color:
                                NAVY,
                            }}
                          >
                            {formatCurrency(
                              donor.totalDonated
                            )}
                          </td>

                          <td className="py-3">

                            <span
                              className="badge rounded-pill"
                              style={{
                                backgroundColor:
                                  "#eef3f8",
                                color:
                                  NAVY,
                                padding:
                                  "7px 11px",
                              }}
                            >
                              {
                                donor.donationCount
                              }
                            </span>

                          </td>

                          <td className="py-3">
                            {formatDate(
                              donor.firstDonationDate
                            )}
                          </td>

                          <td className="py-3">
                            {formatDate(
                              donor.lastDonationDate
                            )}
                          </td>

                          <td className="text-end px-4 py-3">

                            <div className="d-flex justify-content-end gap-1">

                              <button
                                type="button"
                                className="btn btn-sm"
                                title="View Donation History"
                                onClick={() =>
                                  handleViewHistory(
                                    donor
                                  )
                                }
                                style={{
                                  border:
                                    "1px solid #d9dee7",
                                  color:
                                    NAVY,
                                  backgroundColor:
                                    "#ffffff",
                                  borderRadius:
                                    "7px",
                                }}
                              >
                                <Eye
                                  size={
                                    15
                                  }
                                />
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm"
                                title="Edit Donor"
                                onClick={() =>
                                  openEditDonor(
                                    donor
                                  )
                                }
                                style={{
                                  border:
                                    "1px solid #d9dee7",
                                  color:
                                    NAVY,
                                  backgroundColor:
                                    "#ffffff",
                                  borderRadius:
                                    "7px",
                                }}
                              >
                                <Pencil
                                  size={
                                    15
                                  }
                                />
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm"
                                title="Delete Donor"
                                disabled={
                                  deletingDonorId ===
                                  donor._id
                                }
                                onClick={() =>
                                  handleDeleteDonor(
                                    donor
                                  )
                                }
                                style={{
                                  border:
                                    "1px solid #ead8d8",
                                  color:
                                    "#a33a3a",
                                  backgroundColor:
                                    "#fffafa",
                                  borderRadius:
                                    "7px",
                                }}
                              >
                                {deletingDonorId ===
                                donor._id ? (
                                  <span
                                    className="spinner-border spinner-border-sm"
                                  />
                                ) : (
                                  <Trash2
                                    size={
                                      15
                                    }
                                  />
                                )}
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>

          {/* PAGINATION */}

          {pagination.totalRecords >
            0 && (
            <div className="card-footer bg-white border-0 px-4 py-3">

              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">

                <div className="small text-secondary">
                  Page{" "}
                  <strong>
                    {
                      pagination.currentPage
                    }
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {
                      pagination.totalPages
                    }
                  </strong>
                </div>

                <div className="d-flex gap-2">

                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={
                      !pagination.hasPreviousPage
                    }
                    onClick={() =>
                      handlePageChange(
                        pagination.currentPage -
                          1
                      )
                    }
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={
                      !pagination.hasNextPage
                    }
                    onClick={() =>
                      handlePageChange(
                        pagination.currentPage +
                          1
                      )
                    }
                    style={{
                      backgroundColor:
                        NAVY,
                      color:
                        "#ffffff",
                    }}
                  >
                    Next
                  </button>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* ==================================================
          ADD / EDIT DONOR MODAL
      ================================================== */}

      {showDonorModal && (
        <div
          className="modal d-block"
          style={{
            backgroundColor:
              "rgba(0, 20, 43, 0.55)",
          }}
        >

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content border-0 shadow-lg">

              <div
                className="modal-header"
                style={{
                  backgroundColor:
                    NAVY,
                  color:
                    "#ffffff",
                }}
              >

                <div>
                  <h5 className="modal-title mb-1">
                    {editingDonor
                      ? "Edit Donor"
                      : "Add Donor"}
                  </h5>

                  <div
                    className="small"
                    style={{
                      color:
                        "#d9e1eb",
                    }}
                  >
                    {editingDonor
                      ? "Update donor information."
                      : "Create a new donor record."}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={
                    closeDonorModal
                  }
                />

              </div>

              <form
                onSubmit={
                  handleSaveDonor
                }
              >

                <div className="modal-body p-4">

                  {formError && (
                    <div className="alert alert-danger">
                      {formError}
                    </div>
                  )}

                  <div className="mb-3">

                    <label className="form-label fw-semibold">
                      Donor Name{" "}
                      <span className="text-danger">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={
                        donorForm.name
                      }
                      onChange={
                        handleDonorFormChange
                      }
                      placeholder="Enter donor name"
                      required
                    />

                  </div>

                  <div className="mb-3">

                    <label className="form-label fw-semibold">
                      Phone
                    </label>

                    <input
                      type="text"
                      name="phone"
                      className="form-control"
                      value={
                        donorForm.phone
                      }
                      onChange={
                        handleDonorFormChange
                      }
                      placeholder="Enter phone number"
                    />

                  </div>

                  <div className="mb-3">

                    <label className="form-label fw-semibold">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={
                        donorForm.email
                      }
                      onChange={
                        handleDonorFormChange
                      }
                      placeholder="Enter email address"
                    />

                  </div>

                </div>

                <div className="modal-footer">

                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={
                      closeDonorModal
                    }
                    disabled={
                      savingDonor
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn"
                    disabled={
                      savingDonor
                    }
                    style={{
                      backgroundColor:
                        GOLD,
                      color:
                        NAVY,
                      fontWeight:
                        700,
                    }}
                  >
                    {savingDonor ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Saving...
                      </>
                    ) : editingDonor ? (
                      "Update Donor"
                    ) : (
                      "Add Donor"
                    )}
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>
      )}

      {/* ==================================================
          DONATION HISTORY MODAL
      ================================================== */}

      {showHistory && (
        <div
          className="modal d-block"
          style={{
            backgroundColor:
              "rgba(0, 20, 43, 0.55)",
          }}
        >

          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">

            <div className="modal-content border-0 shadow-lg">

              <div
                className="modal-header"
                style={{
                  backgroundColor:
                    NAVY,
                  color:
                    "#ffffff",
                }}
              >

                <div>

                  <h5 className="modal-title mb-1">
                    Donation History
                  </h5>

                  <div
                    className="small"
                    style={{
                      color:
                        "#d9e1eb",
                    }}
                  >
                    {selectedDonor?.name ||
                      "Donor"}
                  </div>

                </div>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={
                    closeHistory
                  }
                />

              </div>

              <div className="modal-body p-4">

                {historyLoading && (
                  <div className="text-center py-5">

                    <div
                      className="spinner-border"
                      style={{
                        color:
                          GOLD,
                      }}
                    />

                    <div className="mt-3 text-secondary">
                      Loading donation history...
                    </div>

                  </div>
                )}

                {historyError && (
                  <div className="alert alert-danger">
                    {historyError}
                  </div>
                )}

                {!historyLoading &&
                  !historyError &&
                  history.length ===
                    0 && (
                    <div className="text-center py-5">

                      <DollarSign
                        size={42}
                        className="text-secondary mb-2"
                      />

                      <div className="fw-semibold">
                        No donation history found
                      </div>

                    </div>
                  )}

                {!historyLoading &&
                  !historyError &&
                  history.length >
                    0 && (
                    <div className="table-responsive">

                      <table className="table align-middle">

                        <thead>

                          <tr>
                            <th>
                              Date
                            </th>

                            <th>
                              Amount
                            </th>

                            <th>
                              Payment
                            </th>

                            <th>
                              Status
                            </th>

                            <th>
                              Reference
                            </th>

                            <th>
                              Notes
                            </th>
                          </tr>

                        </thead>

                        <tbody>

                          {history.map(
                            (
                              donation
                            ) => (
                              <tr
                                key={
                                  donation._id
                                }
                              >

                                <td>
                                  {formatDate(
                                    donation.donationDate
                                  )}
                                </td>

                                <td className="fw-bold">
                                  {formatCurrency(
                                    donation.amount
                                  )}
                                </td>

                                <td>
                                  {
                                    donation.paymentMethod
                                  }
                                </td>

                                <td>

                                  <span
                                    className="badge rounded-pill"
                                    style={{
                                      backgroundColor:
                                        donation.status ===
                                        "Received"
                                          ? "#e8f5e9"
                                          : "#fff3cd",

                                      color:
                                        donation.status ===
                                        "Received"
                                          ? "#26733a"
                                          : "#856404",
                                    }}
                                  >
                                    {
                                      donation.status
                                    }
                                  </span>

                                </td>

                                <td>
                                  {
                                    donation.referenceNumber ||
                                    "-"
                                  }
                                </td>

                                <td>
                                  {
                                    donation.notes ||
                                    "-"
                                  }
                                </td>

                              </tr>
                            )
                          )}

                        </tbody>

                      </table>

                    </div>
                  )}

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn"
                  onClick={
                    closeHistory
                  }
                  style={{
                    backgroundColor:
                      NAVY,
                    color:
                      "#ffffff",
                    borderRadius:
                      "8px",
                  }}
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Donors;