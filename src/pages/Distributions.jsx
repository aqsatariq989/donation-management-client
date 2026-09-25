import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CalendarDays,
  User,
  CreditCard,
  FileText,
  DollarSign,
  Wallet,
  CheckCircle,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

const NAVY = "#00142b";
const GOLD = "#e6a726";
const LIGHT_BG = "#f5f7fa";

function Distributions() {
  // =====================================================
  // LIST
  // =====================================================

  const [distributions, setDistributions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // FILTERS
  // =====================================================

  const [search, setSearch] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [minAmount, setMinAmount] =
    useState("");

  const [maxAmount, setMaxAmount] =
    useState("");

  const [showFilters, setShowFilters] =
    useState(false);

  // =====================================================
  // PAGINATION
  // =====================================================

  const [page, setPage] = useState(1);

  const [pagination, setPagination] =
    useState({
      currentPage: 1,
      totalPages: 1,
      totalRecords: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  // =====================================================
  // CATEGORIES
  // =====================================================

  const [categories, setCategories] =
    useState([]);

  const [categoryBalances, setCategoryBalances] =
    useState([]);

  // =====================================================
  // ADD MODAL
  // =====================================================

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState("");

  const [saveSuccess, setSaveSuccess] =
    useState("");

  const [form, setForm] = useState({
    distributionDate:
      new Date()
        .toISOString()
        .split("T")[0],

    categoryId: "",
    beneficiaryName: "",
    amount: "",
    purpose: "",
    paymentMethod: "Cash",
    referenceNumber: "",
    notes: "",
  });

  // =====================================================
  // VIEW MODAL
  // =====================================================

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [selectedDistribution, setSelectedDistribution] =
    useState(null);

  const [viewLoading, setViewLoading] =
    useState(false);

  const [viewError, setViewError] =
    useState("");

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      ""
    );
  };

  // =====================================================
  // DECIMAL128 SAFE NUMBER
  // =====================================================

  const getNumericValue = (value) => {
    let amount = value;

    if (
      amount &&
      typeof amount === "object" &&
      amount.$numberDecimal !== undefined
    ) {
      amount = amount.$numberDecimal;
    }

    if (
      amount &&
      typeof amount === "object" &&
      amount.value !== undefined
    ) {
      amount = amount.value;
    }

    amount = Number(amount);

    return Number.isFinite(amount)
      ? amount
      : 0;
  };

  // =====================================================
  // CURRENCY
  // =====================================================

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(
      getNumericValue(value)
    );
  };

  // =====================================================
  // DATE
  // =====================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // CATEGORY NAME
  // =====================================================

  const getCategoryName = (
    category
  ) => {
    return (
      category?.categoryName ||
      category?.name ||
      category?.category?.name ||
      "Unknown Category"
    );
  };

  // =====================================================
  // GET CATEGORY ID
  // =====================================================

  const getCategoryId = (
    category
  ) => {
    return (
      category?.categoryId ||
      category?._id ||
      category?.category?._id ||
      ""
    );
  };

  // =====================================================
  // GET CATEGORY BALANCE
  // =====================================================

  const getCategoryBalance = (
    categoryId
  ) => {
    const balanceRecord =
      categoryBalances.find(
        (item) =>
          String(
            getCategoryId(item)
          ) === String(categoryId)
      );

    if (!balanceRecord) {
      return 0;
    }

    return getNumericValue(
      balanceRecord.remainingBalance ??
        balanceRecord.currentBalance ??
        balanceRecord.balance ??
        balanceRecord.remaining ??
        0
    );
  };

  // =====================================================
  // FETCH CATEGORIES
  // =====================================================

  const fetchCategories = async () => {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      const response =
        await fetch(
          `${API_URL}/categories`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load categories."
        );
      }

      const categoryData =
        Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.data?.categories)
          ? result.data.categories
          : Array.isArray(result.categories)
          ? result.categories
          : Array.isArray(result.data?.data)
          ? result.data.data
          : [];

      setCategories(
        categoryData.filter(
          (category) =>
            category.isActive !== false
        )
      );
    } catch (err) {
      console.error(
        "Categories error:",
        err
      );
    }
  };

  // =====================================================
  // FETCH CATEGORY BALANCES
  // =====================================================

  const fetchCategoryBalances =
    async () => {
      try {
        const token = getToken();

        if (!token) {
          return;
        }

        const response =
          await fetch(
            `${API_URL}/categories/balances`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to load balances."
          );
        }

        const balanceData =
          Array.isArray(result.data)
            ? result.data
            : Array.isArray(result.data?.balances)
            ? result.data.balances
            : Array.isArray(result.balances)
            ? result.balances
            : Array.isArray(result.data?.data)
            ? result.data.data
            : [];

        setCategoryBalances(balanceData);
      } catch (err) {
        console.error(
          "Category balances error:",
          err
        );
      }
    };

  // =====================================================
  // FETCH DISTRIBUTIONS
  // =====================================================

  const fetchDistributions = async (
    requestedPage = 1,
    isRefresh = false,
    filterOverrides = null
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const activeFilters = {
        search: filterOverrides?.search ?? search,
        categoryId: filterOverrides?.categoryId ?? categoryFilter,
        startDate: filterOverrides?.startDate ?? startDate,
        endDate: filterOverrides?.endDate ?? endDate,
        minAmount: filterOverrides?.minAmount ?? minAmount,
        maxAmount: filterOverrides?.maxAmount ?? maxAmount,
      };

      if (
        activeFilters.startDate &&
        activeFilters.endDate &&
        activeFilters.startDate > activeFilters.endDate
      ) {
        throw new Error("Start date cannot be after end date.");
      }

      if (
        activeFilters.minAmount !== "" &&
        activeFilters.maxAmount !== "" &&
        Number(activeFilters.minAmount) > Number(activeFilters.maxAmount)
      ) {
        throw new Error("Minimum amount cannot be greater than maximum amount.");
      }

      const params = new URLSearchParams();
      params.set("page", String(requestedPage));
      params.set("limit", "10");

      if (String(activeFilters.search).trim()) {
        params.set("search", String(activeFilters.search).trim());
      }

      if (activeFilters.categoryId) {
        params.set("categoryId", activeFilters.categoryId);
      }

      if (activeFilters.startDate) {
        params.set("startDate", activeFilters.startDate);
      }

      if (activeFilters.endDate) {
        params.set("endDate", activeFilters.endDate);
      }

      if (activeFilters.minAmount !== "") {
        params.set("minAmount", activeFilters.minAmount);
      }

      if (activeFilters.maxAmount !== "") {
        params.set("maxAmount", activeFilters.maxAmount);
      }

      console.log(
        "DISTRIBUTION FILTER REQUEST:",
        params.toString()
      );

      const response = await fetch(
        `${API_URL}/distributions?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load distributions."
        );
      }

      const data =
        Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.distributions)
          ? result.distributions
          : Array.isArray(result.results)
          ? result.results
          : [];

      setDistributions(data);

      const meta = result.pagination || result.meta || {};
      const currentPage =
        Number(meta.currentPage ?? meta.page ?? requestedPage) || 1;
      const perPage =
        Number(meta.perPage ?? meta.limit ?? 10) || 10;
      const totalRecords =
        Number(
          meta.totalRecords ??
            meta.total ??
            result.totalRecords ??
            result.total ??
            data.length
        ) || 0;
      const totalPages =
        Number(
          meta.totalPages ??
            Math.max(Math.ceil(totalRecords / perPage), 1)
        ) || 1;

      setPagination({
        currentPage,
        perPage,
        totalRecords,
        totalPages,
        hasNextPage:
          meta.hasNextPage !== undefined
            ? Boolean(meta.hasNextPage)
            : currentPage < totalPages,
        hasPreviousPage:
          meta.hasPreviousPage !== undefined
            ? Boolean(meta.hasPreviousPage)
            : currentPage > 1,
      });

      setPage(currentPage);
    } catch (err) {
      console.error("Distribution error:", err);
      setError(
        err.message || "Failed to load distributions."
      );
      setDistributions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchCategories();
    fetchCategoryBalances();
    fetchDistributions(1);
  }, []);

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = (event) => {
    event.preventDefault();

    const filters = {
      search: search.trim(),
      categoryId: categoryFilter,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    };

    setPage(1);
    fetchDistributions(1, false, filters);
  };

  // =====================================================
  // APPLY FILTERS
  // =====================================================

  const handleApplyFilters = () => {
    const filters = {
      search: search.trim(),
      categoryId: categoryFilter,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    };

    setPage(1);
    fetchDistributions(1, false, filters);
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const handleClearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setShowFilters(false);
    setPage(1);

    fetchDistributions(1, false, {
      search: "",
      categoryId: "",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
    });
  };

  // =====================================================
  // PAGE
  // =====================================================

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

    fetchDistributions(newPage, false, {
      search: search.trim(),
      categoryId: categoryFilter,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    });
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleFormChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSaveError("");
    setSaveSuccess("");
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      distributionDate:
        new Date()
          .toISOString()
          .split("T")[0],

      categoryId: "",
      beneficiaryName: "",
      amount: "",
      purpose: "",
      paymentMethod: "Cash",
      referenceNumber: "",
      notes: "",
    });

    setSaveError("");
    setSaveSuccess("");
  };

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // =====================================================
  // CLOSE ADD MODAL
  // =====================================================

  const closeAddModal = () => {
    if (saving) {
      return;
    }

    setShowAddModal(false);
    resetForm();
  };

  // =====================================================
  // CREATE DISTRIBUTION
  // =====================================================

  const handleCreateDistribution =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setSaveError("");
        setSaveSuccess("");

        const token = getToken();

        if (!token) {
          throw new Error(
            "Authentication token not found."
          );
        }

        if (!form.categoryId) {
          throw new Error(
            "Please select a category."
          );
        }

        if (
          !form.beneficiaryName.trim()
        ) {
          throw new Error(
            "Beneficiary name is required."
          );
        }

        if (
          !form.amount ||
          Number(form.amount) <= 0
        ) {
          throw new Error(
            "Amount must be greater than 0."
          );
        }

        if (!form.purpose.trim()) {
          throw new Error(
            "Purpose is required."
          );
        }

        // Frontend balance check
        const availableBalance =
          getCategoryBalance(
            form.categoryId
          );

        const requestedAmount =
          Number(form.amount);

        if (
          availableBalance <
          requestedAmount
        ) {
          throw new Error(
            `Insufficient category balance. Available: ${formatCurrency(
              availableBalance
            )}`
          );
        }

        const payload = {
          date: form.distributionDate,

          categoryId:
            form.categoryId,

          beneficiaryName:
            form.beneficiaryName.trim(),

          amount:
            requestedAmount,

          purpose:
            form.purpose.trim(),

          paymentMethod:
            form.paymentMethod,

          referenceNumber:
            form.referenceNumber.trim(),

          notes:
            form.notes.trim(),
        };

        const response =
          await fetch(
            `${API_URL}/distributions`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify(
                payload
              ),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to create distribution."
          );
        }

        setSaveSuccess(
          result.message ||
            "Distribution created successfully."
        );

        // Refresh everything
        await Promise.all([
          fetchDistributions(1, true),
          fetchCategoryBalances(),
          fetchCategories(),
        ]);

        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
        }, 800);
      } catch (err) {
        console.error(
          "Create distribution error:",
          err
        );

        setSaveError(
          err.message ||
            "Failed to create distribution."
        );
      } finally {
        setSaving(false);
      }
    };

  // =====================================================
  // VIEW DISTRIBUTION
  // =====================================================

  const openViewModal = async (
    distribution
  ) => {
    try {
      setShowViewModal(true);
      setViewLoading(true);
      setViewError("");
      setSelectedDistribution(null);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const distributionId =
        distribution._id ||
        distribution.id;

      const response =
        await fetch(
          `${API_URL}/distributions/${distributionId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load distribution."
        );
      }

      setSelectedDistribution(
        result.data
      );
    } catch (err) {
      console.error(
        "View distribution error:",
        err
      );

      setViewError(
        err.message ||
          "Failed to load distribution."
      );
    } finally {
      setViewLoading(false);
    }
  };

  // =====================================================
  // GENERATE DISTRIBUTION RECEIPT
  // =====================================================

  const handleGenerateReceipt = async (
    distribution
  ) => {
    try {
      setViewError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const distributionId =
        distribution?._id ||
        distribution?.id;

      if (!distributionId) {
        throw new Error(
          "Distribution ID not found."
        );
      }

      const response = await fetch(
        `${API_URL}/distributions/${distributionId}/receipt`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        let errorMessage =
          "Failed to generate distribution receipt.";

        try {
          const errorData =
            JSON.parse(errorText);

          errorMessage =
            errorData.message ||
            errorMessage;
        } catch {
          // Non-JSON response
        }

        throw new Error(errorMessage);
      }

      const blob =
        await response.blob();

      if (
        !blob ||
        blob.size === 0
      ) {
        throw new Error(
          "The receipt PDF is empty."
        );
      }

      const downloadUrl =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = downloadUrl;

      const reference =
        distribution.referenceNumber ||
        distributionId;

      link.download =
        `Distribution_Receipt_${reference}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      setTimeout(() => {
        window.URL.revokeObjectURL(
          downloadUrl
        );
      }, 1000);
    } catch (error) {
      console.error(
        "Generate distribution receipt error:",
        error
      );

      setViewError(
        error.message ||
          "Failed to generate distribution receipt."
      );
    }
  };

  // =====================================================
  // CLOSE VIEW
  // =====================================================

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedDistribution(
      null
    );
    setViewError("");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        className="min-vh-100 w-100 d-flex align-items-center justify-content-center"
        style={{
          backgroundColor:
            LIGHT_BG,
          overflowX: "hidden",
        }}
      >
        <div className="text-center">

          <div
            className="spinner-border"
            style={{
              color: GOLD,
            }}
          />

          <div className="mt-3 text-secondary">
            Loading distributions...
          </div>

        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      <div
        className="min-vh-100 w-100"
        style={{
          backgroundColor:
            LIGHT_BG,
          overflowX: "hidden",
        }}
      >

        <div
          className="w-100 px-3 px-lg-4 pb-4"
          style={{
            boxSizing:
              "border-box",
          }}
        >

          {/* ============================================
              HEADER
          ============================================ */}

          <div className="pt-4 pb-3">

            <div className="row align-items-center g-3 mx-0">

              <div className="col-12 col-md">

                <div
                  className="text-uppercase fw-semibold mb-1"
                  style={{
                    color: GOLD,
                    fontSize: "11px",
                    letterSpacing:
                      "0.09em",
                  }}
                >
                  Administration
                </div>

                <h1
                  className="fw-bold mb-1"
                  style={{
                    color: NAVY,
                    fontSize: "28px",
                  }}
                >
                  Distributions
                </h1>

                <p
                  className="mb-0"
                  style={{
                    color:
                      "#718096",
                    fontSize: "14px",
                  }}
                >
                  Manage and review
                  all fund distributions.
                </p>

              </div>

              <div className="col-12 col-md-auto">

                <button
                  type="button"
                  className="btn d-flex align-items-center justify-content-center gap-2 px-3"
                  style={{
                    backgroundColor:
                      GOLD,
                    color: NAVY,
                    height: "42px",
                    borderRadius:
                      "8px",
                    fontWeight: 600,
                    border: "none",
                  }}
                  onClick={
                    openAddModal
                  }
                >
                  <Plus size={18} />
                  Add Distribution
                </button>

              </div>

            </div>

          </div>

          {/* ============================================
              SEARCH
          ============================================ */}

          <div
            className="card border-0 shadow-sm mb-3"
            style={{
              borderRadius: "14px",
            }}
          >

            <div className="card-body p-3">

              <form
                onSubmit={
                  handleSearch
                }
              >

                <div className="row g-2 align-items-center">

                  <div className="col-12 col-lg">

                    <div className="input-group">

                      <span className="input-group-text bg-white border-end-0">
                        <Search
                          size={17}
                          style={{
                            color:
                              "#718096",
                          }}
                        />
                      </span>

                      <input
                        type="text"
                        className="form-control border-start-0 shadow-none"
                        placeholder="Search beneficiary, purpose or reference..."
                        value={search}
                        onChange={(e) =>
                          setSearch(
                            e.target.value
                          )
                        }
                      />

                    </div>

                  </div>

                  <div className="col-6 col-lg-auto">

                    <button
                      type="submit"
                      className="btn w-100 px-4"
                      style={{
                        backgroundColor:
                          NAVY,
                        color:
                          "#ffffff",
                        height:
                          "40px",
                      }}
                    >
                      Search
                    </button>

                  </div>

                  <div className="col-6 col-lg-auto">

                    <button
                      type="button"
                      className="btn btn-light border w-100 d-flex align-items-center justify-content-center gap-2"
                      style={{
                        height:
                          "40px",
                        color:
                          NAVY,
                      }}
                      onClick={() =>
                        setShowFilters(
                          !showFilters
                        )
                      }
                    >
                      <Filter
                        size={16}
                      />
                      Filters
                    </button>

                  </div>

                </div>

              </form>

              {/* FILTER PANEL */}

              {showFilters && (
                <div className="border-top mt-3 pt-3">

                  <div className="row g-3">

                    <div className="col-12 col-md-6 col-xl-2">

                      <label className="form-label small fw-semibold">
                        Category
                      </label>

                      <select
                        className="form-select"
                        value={
                          categoryFilter
                        }
                        onChange={(e) =>
                          setCategoryFilter(
                            e.target.value
                          )
                        }
                      >
                        <option value="">
                          All Categories
                        </option>

                        {categories.map(
                          (
                            category
                          ) => (
                            <option
                              key={
                                category._id
                              }
                              value={
                                category._id
                              }
                            >
                              {getCategoryName(
                                category
                              )}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    <div className="col-12 col-md-6 col-xl-2">

                      <label className="form-label small fw-semibold">
                        Start Date
                      </label>

                      <input
                        type="date"
                        className="form-control"
                        value={
                          startDate
                        }
                        onChange={(e) =>
                          setStartDate(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="col-12 col-md-6 col-xl-2">

                      <label className="form-label small fw-semibold">
                        End Date
                      </label>

                      <input
                        type="date"
                        className="form-control"
                        value={endDate}
                        onChange={(e) =>
                          setEndDate(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="col-12 col-md-6 col-xl-2">

                      <label className="form-label small fw-semibold">
                        Min Amount
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control"
                        placeholder="0.00"
                        value={
                          minAmount
                        }
                        onChange={(e) =>
                          setMinAmount(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="col-12 col-md-6 col-xl-2">

                      <label className="form-label small fw-semibold">
                        Max Amount
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control"
                        placeholder="0.00"
                        value={
                          maxAmount
                        }
                        onChange={(e) =>
                          setMaxAmount(
                            e.target.value
                          )
                        }
                      />

                    </div>

                  </div>

                  <div className="d-flex gap-2 mt-3">

                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        backgroundColor:
                          GOLD,
                        color: NAVY,
                        fontWeight: 600,
                      }}
                      onClick={
                        handleApplyFilters
                      }
                    >
                      Apply Filters
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-light border d-flex align-items-center gap-1"
                      onClick={
                        handleClearFilters
                      }
                    >
                      <X size={14} />
                      Clear
                    </button>

                  </div>

                </div>
              )}

            </div>

          </div>

          {/* ============================================
              ERROR
          ============================================ */}

          {error && (
            <div className="alert alert-danger border-0 shadow-sm">
              {error}

              <div>
                <button
                  type="button"
                  className="btn btn-sm mt-2"
                  style={{
                    backgroundColor:
                      NAVY,
                    color:
                      "#ffffff",
                  }}
                  onClick={() =>
                    fetchDistributions(
                      page,
                      true
                    )
                  }
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* ============================================
              TABLE
          ============================================ */}

          <div
            className="card border-0 shadow-sm"
            style={{
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >

            {/* TABLE HEADER */}

            <div className="card-body p-3 border-bottom">

              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">

                <div>

                  <h5
                    className="fw-bold mb-1"
                    style={{
                      color: NAVY,
                      fontSize: "18px",
                    }}
                  >
                    Distribution Records
                  </h5>

                  <div
                    className="text-secondary"
                    style={{
                      fontSize:
                        "12px",
                    }}
                  >
                    {pagination.totalRecords ||
                      0}{" "}
                    total records
                  </div>

                </div>

                <button
                  type="button"
                  className="btn btn-light border d-flex align-items-center gap-2 align-self-start"
                  style={{
                    color: NAVY,
                  }}
                  onClick={() => {
                    fetchDistributions(
                      page,
                      true
                    );
                    fetchCategoryBalances();
                  }}
                  disabled={
                    refreshing
                  }
                >
                  <RefreshCw
                    size={15}
                  />
                  Refresh
                </button>

              </div>

            </div>

            {/* TABLE */}

            <div className="table-responsive">

              <table className="table table-hover align-middle mb-0">

                <thead
                  style={{
                    backgroundColor:
                      "#f8f9fa",
                  }}
                >

                  <tr>

                    <th
                      className="border-0 px-3 py-3"
                      style={{
                        color:
                          "#718096",
                        fontSize:
                          "10px",
                      }}
                    >
                      BENEFICIARY
                    </th>

                    <th
                      className="border-0 py-3"
                      style={{
                        color:
                          "#718096",
                        fontSize:
                          "10px",
                      }}
                    >
                      CATEGORY
                    </th>

                    <th
                      className="border-0 py-3"
                      style={{
                        color:
                          "#718096",
                        fontSize:
                          "10px",
                      }}
                    >
                      DATE
                    </th>

                    <th
                      className="border-0 py-3"
                      style={{
                        color:
                          "#718096",
                        fontSize:
                          "10px",
                      }}
                    >
                      PURPOSE
                    </th>

                    <th
                      className="border-0 py-3 text-end"
                      style={{
                        color:
                          "#718096",
                        fontSize:
                          "10px",
                      }}
                    >
                      AMOUNT
                    </th>

                    <th
                      className="border-0 py-3 text-center"
                      style={{
                        color:
                          "#718096",
                        fontSize:
                          "10px",
                      }}
                    >
                      ACTION
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {distributions.length >
                  0 ? (
                    distributions.map(
                      (
                        distribution,
                        index
                      ) => {

                        const beneficiary =
                          distribution.beneficiaryName ||
                          distribution.recipientName ||
                          "Unknown";

                        const categoryName =
                          distribution.categoryName ||
                          distribution.categoryId
                            ?.name ||
                          distribution.category
                            ?.name ||
                          "Unknown Category";

                        return (
                          <tr
                            key={
                              distribution._id ||
                              distribution.id ||
                              index
                            }
                          >

                            {/* BENEFICIARY */}

                            <td className="px-3">

                              <div className="d-flex align-items-center gap-2">

                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                  style={{
                                    width:
                                      "36px",
                                    height:
                                      "36px",
                                    backgroundColor:
                                      "rgba(230,167,38,0.14)",
                                    color:
                                      NAVY,
                                    fontSize:
                                      "12px",
                                  }}
                                >
                                  {beneficiary
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase()}
                                </div>

                                <div
                                  className="overflow-hidden"
                                  style={{
                                    minWidth:
                                      0,
                                  }}
                                >

                                  <div
                                    className="fw-semibold text-truncate"
                                    style={{
                                      color:
                                        NAVY,
                                      fontSize:
                                        "12px",
                                      maxWidth:
                                        "190px",
                                    }}
                                  >
                                    {
                                      beneficiary
                                    }
                                  </div>

                                  {distribution.referenceNumber && (
                                    <div
                                      className="text-secondary text-truncate"
                                      style={{
                                        fontSize:
                                          "9px",
                                      }}
                                    >
                                      Ref:{" "}
                                      {
                                        distribution.referenceNumber
                                      }
                                    </div>
                                  )}

                                </div>

                              </div>

                            </td>

                            {/* CATEGORY */}

                            <td>

                              <span
                                className="badge rounded-pill"
                                style={{
                                  backgroundColor:
                                    "rgba(230,167,38,0.12)",
                                  color:
                                    NAVY,
                                  fontSize:
                                    "9px",
                                  fontWeight:
                                    600,
                                }}
                              >
                                {
                                  categoryName
                                }
                              </span>

                            </td>

                            {/* DATE */}

                            <td
                              className="text-secondary text-nowrap"
                              style={{
                                fontSize:
                                  "11px",
                              }}
                            >
                              {formatDate(
                                distribution.date ||
                                  distribution.distributionDate ||
                                  distribution.createdAt
                              )}
                            </td>

                            {/* PURPOSE */}

                            <td
                              className="text-secondary"
                              style={{
                                fontSize:
                                  "11px",
                                maxWidth:
                                  "220px",
                              }}
                            >
                              <div className="text-truncate">
                                {distribution.purpose ||
                                  "-"}
                              </div>
                            </td>

                            {/* AMOUNT */}

                            <td
                              className="text-end fw-bold text-nowrap"
                              style={{
                                color:
                                  NAVY,
                                fontSize:
                                  "12px",
                              }}
                            >
                              {formatCurrency(
                                distribution.amount
                              )}
                            </td>

                            {/* ACTION */}

                            <td className="text-center">

                              <button
                                type="button"
                                className="btn btn-sm btn-light border d-inline-flex align-items-center justify-content-center"
                                style={{
                                  width:
                                    "34px",
                                  height:
                                    "34px",
                                  color:
                                    NAVY,
                                }}
                                title="View distribution"
                                onClick={() =>
                                  openViewModal(
                                    distribution
                                  )
                                }
                              >
                                <Eye
                                  size={15}
                                />
                              </button>

                            </td>

                          </tr>
                        );
                      }
                    )
                  ) : (
                    <tr>

                      <td
                        colSpan="6"
                        className="text-center py-5"
                      >

                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                          style={{
                            width:
                              "52px",
                            height:
                              "52px",
                            backgroundColor:
                              "rgba(0,20,43,0.06)",
                            color:
                              NAVY,
                          }}
                        >
                          <Wallet
                            size={22}
                          />
                        </div>

                        <div
                          className="fw-semibold"
                          style={{
                            color:
                              NAVY,
                            fontSize:
                              "14px",
                          }}
                        >
                          No distributions found
                        </div>

                        <div
                          className="text-secondary mt-1"
                          style={{
                            fontSize:
                              "11px",
                          }}
                        >
                          No distribution
                          records match
                          your search.
                        </div>

                      </td>

                    </tr>
                  )}

                </tbody>

              </table>

            </div>

            {/* PAGINATION */}

            <div className="card-body p-3 border-top">

              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">

                <div
                  className="text-secondary"
                  style={{
                    fontSize:
                      "11px",
                  }}
                >
                  Page{" "}
                  <strong
                    style={{
                      color:
                        NAVY,
                    }}
                  >
                    {pagination.currentPage ||
                      page}
                  </strong>{" "}
                  of{" "}
                  <strong
                    style={{
                      color:
                        NAVY,
                    }}
                  >
                    {pagination.totalPages ||
                      1}
                  </strong>
                </div>

                <div className="d-flex gap-2">

                  <button
                    type="button"
                    className="btn btn-sm btn-light border d-flex align-items-center gap-1"
                    disabled={
                      !pagination.hasPreviousPage
                    }
                    onClick={() =>
                      handlePageChange(
                        page - 1
                      )
                    }
                  >
                    <ChevronLeft
                      size={15}
                    />
                    Previous
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm d-flex align-items-center gap-1"
                    style={{
                      backgroundColor:
                        NAVY,
                      color:
                        "#ffffff",
                    }}
                    disabled={
                      !pagination.hasNextPage
                    }
                    onClick={() =>
                      handlePageChange(
                        page + 1
                      )
                    }
                  >
                    Next
                    <ChevronRight
                      size={15}
                    />
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>
      </div>

      {/* ===================================================
          ADD DISTRIBUTION MODAL
      =================================================== */}

      {showAddModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            backgroundColor:
              "rgba(0,0,0,0.55)",
            zIndex: 2000,
          }}
        >

          <div
            className="bg-white shadow-lg"
            style={{
              width: "100%",
              maxWidth: "720px",
              maxHeight: "92vh",
              overflowY: "auto",
              borderRadius:
                "16px",
            }}
          >

            {/* HEADER */}

            <div
              className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom"
            >

              <div>

                <h4
                  className="fw-bold mb-1"
                  style={{
                    color: NAVY,
                    fontSize:
                      "20px",
                  }}
                >
                  Add Distribution
                </h4>

                <div
                  className="text-secondary"
                  style={{
                    fontSize:
                      "11px",
                  }}
                >
                  Record a new fund
                  distribution
                </div>

              </div>

              <button
                type="button"
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width:
                    "36px",
                  height:
                    "36px",
                }}
                onClick={
                  closeAddModal
                }
                disabled={saving}
              >
                <X size={18} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleCreateDistribution
              }
            >

              <div className="p-4">

                {saveSuccess && (
                  <div className="alert alert-success border-0 small">
                    {saveSuccess}
                  </div>
                )}

                {saveError && (
                  <div className="alert alert-danger border-0 small">
                    {saveError}
                  </div>
                )}

                <div className="row g-3">

                  {/* DATE */}

                  <div className="col-12 col-md-6">

                    <label className="form-label fw-semibold small">
                      Distribution Date
                      <span className="text-danger">
                        {" "}
                        *
                      </span>
                    </label>

                    <div className="input-group">

                      <span className="input-group-text bg-white">
                        <CalendarDays
                          size={16}
                          style={{
                            color:
                              GOLD,
                          }}
                        />
                      </span>

                      <input
                        type="date"
                        name="distributionDate"
                        className="form-control"
                        value={
                          form.distributionDate
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      />

                    </div>

                  </div>

                  {/* CATEGORY */}

                  <div className="col-12 col-md-6">

                    <label className="form-label fw-semibold small">
                      Category
                      <span className="text-danger">
                        {" "}
                        *
                      </span>
                    </label>

                    <select
                      name="categoryId"
                      className="form-select"
                      value={
                        form.categoryId
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                    >

                      <option value="">
                        Select category
                      </option>

                      {categories.map(
                        (
                          category
                        ) => {

                          const id =
                            getCategoryId(
                              category
                            );

                          return (
                            <option
                              key={id}
                              value={id}
                            >
                              {getCategoryName(
                                category
                              )}{" "}
                              —{" "}
                              {formatCurrency(
                                getCategoryBalance(
                                  id
                                )
                              )}{" "}
                              available
                            </option>
                          );
                        }
                      )}

                    </select>

                    {/* SELECTED BALANCE */}

                    {form.categoryId && (
                      <div
                        className="mt-2 rounded-2 px-3 py-2 d-flex justify-content-between align-items-center"
                        style={{
                          backgroundColor:
                            "rgba(230,167,38,0.10)",
                        }}
                      >

                        <span
                          className="text-secondary"
                          style={{
                            fontSize:
                              "10px",
                          }}
                        >
                          Available Balance
                        </span>

                        <strong
                          style={{
                            color:
                              NAVY,
                            fontSize:
                              "12px",
                          }}
                        >
                          {formatCurrency(
                            getCategoryBalance(
                              form.categoryId
                            )
                          )}
                        </strong>

                      </div>
                    )}

                  </div>

                  {/* BENEFICIARY */}

                  <div className="col-12 col-md-6">

                    <label className="form-label fw-semibold small">
                      Beneficiary / Recipient
                      <span className="text-danger">
                        {" "}
                        *
                      </span>
                    </label>

                    <div className="input-group">

                      <span className="input-group-text bg-white">
                        <User
                          size={16}
                          style={{
                            color:
                              GOLD,
                          }}
                        />
                      </span>

                      <input
                        type="text"
                        name="beneficiaryName"
                        className="form-control"
                        placeholder="Enter beneficiary name"
                        value={
                          form.beneficiaryName
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      />

                    </div>

                  </div>

                  {/* AMOUNT */}

                  <div className="col-12 col-md-6">

                    <label className="form-label fw-semibold small">
                      Distribution Amount
                      <span className="text-danger">
                        {" "}
                        *
                      </span>
                    </label>

                    <div className="input-group">

                      <span className="input-group-text bg-white">
                        <DollarSign
                          size={16}
                          style={{
                            color:
                              GOLD,
                          }}
                        />
                      </span>

                      <input
                        type="number"
                        name="amount"
                        min="0.01"
                        step="0.01"
                        className="form-control"
                        placeholder="0.00"
                        value={
                          form.amount
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      />

                    </div>

                    {form.categoryId &&
                      form.amount && (
                        <>
                          <div
                            className="mt-1"
                            style={{
                              fontSize:
                                "9px",
                              color:
                                Number(
                                  form.amount
                                ) >
                                getCategoryBalance(
                                  form.categoryId
                                )
                                  ? "#dc3545"
                                  : "#198754",
                            }}
                          >
                            {Number(
                              form.amount
                            ) >
                            getCategoryBalance(
                              form.categoryId
                            )
                              ? "Amount exceeds available balance."
                              : "Amount is within available balance."}
                          </div>

                          {Number(form.amount) <=
                            getCategoryBalance(form.categoryId) && (
                            <div
                              className="mt-1"
                              style={{
                                fontSize: "10px",
                                color: NAVY,
                              }}
                            >
                              Remaining after distribution:{" "}
                              <strong>
                                {formatCurrency(
                                  getCategoryBalance(form.categoryId) -
                                    Number(form.amount)
                                )}
                              </strong>
                            </div>
                          )}
                        </>
                      )}

                  </div>

                  {/* PURPOSE */}

                  <div className="col-12">

                    <label className="form-label fw-semibold small">
                      Purpose
                      <span className="text-danger">
                        {" "}
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      name="purpose"
                      className="form-control"
                      placeholder="Enter purpose of distribution"
                      value={
                        form.purpose
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                    />

                  </div>

                  {/* PAYMENT */}

                  <div className="col-12 col-md-6">

                    <label className="form-label fw-semibold small">
                      Payment Method
                      <span className="text-danger">
                        {" "}
                        *
                      </span>
                    </label>

                    <div className="input-group">

                      <span className="input-group-text bg-white">
                        <CreditCard
                          size={16}
                          style={{
                            color:
                              GOLD,
                          }}
                        />
                      </span>

                      <select
                        name="paymentMethod"
                        className="form-select"
                        value={
                          form.paymentMethod
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      >
                        <option value="Cash">
                          Cash
                        </option>

                        <option value="Bank">
                          Bank
                        </option>

                        <option value="Online">
                          Online
                        </option>

                        <option value="Other">
                          Other
                        </option>

                      </select>

                    </div>

                  </div>

                  {/* REFERENCE */}

                  <div className="col-12 col-md-6">

                    <label className="form-label fw-semibold small">
                      Reference Number
                    </label>

                    <div className="input-group">

                      <span className="input-group-text bg-white">
                        <FileText
                          size={16}
                          style={{
                            color:
                              GOLD,
                          }}
                        />
                      </span>

                      <input
                        type="text"
                        name="referenceNumber"
                        className="form-control"
                        placeholder="Receipt / reference number"
                        value={
                          form.referenceNumber
                        }
                        onChange={
                          handleFormChange
                        }
                      />

                    </div>

                  </div>

                  {/* NOTES */}

                  <div className="col-12">

                    <label className="form-label fw-semibold small">
                      Notes
                    </label>

                    <textarea
                      name="notes"
                      className="form-control"
                      rows="3"
                      placeholder="Additional notes..."
                      value={
                        form.notes
                      }
                      onChange={
                        handleFormChange
                      }
                    />

                  </div>

                </div>

              </div>

              {/* FOOTER */}

              <div className="d-flex justify-content-end gap-2 px-4 py-3 border-top">

                <button
                  type="button"
                  className="btn btn-light border px-4"
                  onClick={
                    closeAddModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn px-4 d-flex align-items-center gap-2"
                  style={{
                    backgroundColor:
                      GOLD,
                    color: NAVY,
                    fontWeight: 600,
                  }}
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle
                        size={16}
                      />
                      Save Distribution
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ===================================================
          VIEW DISTRIBUTION MODAL
      =================================================== */}

      {showViewModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            backgroundColor:
              "rgba(0,0,0,0.55)",
            zIndex: 2000,
          }}
        >

          <div
            className="bg-white shadow-lg"
            style={{
              width: "100%",
              maxWidth: "620px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius:
                "16px",
            }}
          >

            {/* HEADER */}

            <div
              className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom"
            >

              <div>

                <h4
                  className="fw-bold mb-1"
                  style={{
                    color: NAVY,
                    fontSize:
                      "20px",
                  }}
                >
                  Distribution Details
                </h4>

                <div
                  className="text-secondary"
                  style={{
                    fontSize:
                      "11px",
                  }}
                >
                  Complete distribution
                  information
                </div>

              </div>

              <button
                type="button"
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width:
                    "36px",
                  height:
                    "36px",
                }}
                onClick={
                  closeViewModal
                }
              >
                <X size={18} />
              </button>

            </div>

            {/* BODY */}

            <div className="p-4">

              {viewLoading && (
                <div className="text-center py-5">

                  <div
                    className="spinner-border"
                    style={{
                      color: GOLD,
                    }}
                  />

                  <div className="text-secondary mt-3 small">
                    Loading distribution...
                  </div>

                </div>
              )}

              {viewError && (
                <div className="alert alert-danger border-0">
                  {viewError}
                </div>
              )}

              {!viewLoading &&
                !viewError &&
                selectedDistribution && (
                  <>

                    {/* AMOUNT */}

                    <div
                      className="rounded-3 p-3 mb-4"
                      style={{
                        backgroundColor:
                          "rgba(230,167,38,0.10)",
                        border:
                          "1px solid rgba(230,167,38,0.20)",
                      }}
                    >

                      <div className="d-flex justify-content-between align-items-center">

                        <div>

                          <div
                            className="text-secondary"
                            style={{
                              fontSize:
                                "10px",
                            }}
                          >
                            Distribution Amount
                          </div>

                          <div
                            className="fw-bold mt-1"
                            style={{
                              color:
                                NAVY,
                              fontSize:
                                "26px",
                            }}
                          >
                            {formatCurrency(
                              selectedDistribution.amount
                            )}
                          </div>

                        </div>

                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width:
                              "46px",
                            height:
                              "46px",
                            backgroundColor:
                              GOLD,
                            color:
                              NAVY,
                          }}
                        >
                          <Wallet
                            size={22}
                          />
                        </div>

                      </div>

                    </div>

                    {/* DETAILS */}

                    <div className="row g-3">

                      <div className="col-12 col-md-6">

                        <div className="border rounded-3 p-3 h-100">

                          <div className="d-flex align-items-center gap-2 mb-2">

                            <User
                              size={15}
                              style={{
                                color:
                                  GOLD,
                              }}
                            />

                            <span
                              className="fw-semibold"
                              style={{
                                color:
                                  NAVY,
                                fontSize:
                                  "11px",
                              }}
                            >
                              Beneficiary
                            </span>

                          </div>

                          <div
                            className="fw-semibold"
                            style={{
                              color:
                                NAVY,
                              fontSize:
                                "14px",
                            }}
                          >
                            {selectedDistribution.beneficiaryName ||
                              "-"}
                          </div>

                        </div>

                      </div>

                      <div className="col-12 col-md-6">

                        <div className="border rounded-3 p-3 h-100">

                          <div className="d-flex align-items-center gap-2 mb-2">

                            <CalendarDays
                              size={15}
                              style={{
                                color:
                                  GOLD,
                              }}
                            />

                            <span
                              className="fw-semibold"
                              style={{
                                color:
                                  NAVY,
                                fontSize:
                                  "11px",
                              }}
                            >
                              Date
                            </span>

                          </div>

                          <div
                            className="fw-semibold"
                            style={{
                              color:
                                NAVY,
                              fontSize:
                                "14px",
                            }}
                          >
                            {formatDate(
                              selectedDistribution.date ||
                              selectedDistribution.distributionDate
                            )}
                          </div>

                        </div>

                      </div>

                      <div className="col-12 col-md-6">

                        <div className="border rounded-3 p-3 h-100">

                          <div className="d-flex align-items-center gap-2 mb-2">

                            <Wallet
                              size={15}
                              style={{
                                color:
                                  GOLD,
                              }}
                            />

                            <span
                              className="fw-semibold"
                              style={{
                                color:
                                  NAVY,
                                fontSize:
                                  "11px",
                              }}
                            >
                              Category
                            </span>

                          </div>

                          <div
                            className="fw-semibold"
                            style={{
                              color:
                                NAVY,
                              fontSize:
                                "13px",
                            }}
                          >
                            {selectedDistribution.categoryName ||
                              selectedDistribution.categoryId
                                ?.name ||
                              selectedDistribution.category
                                ?.name ||
                              "-"}
                          </div>

                        </div>

                      </div>

                      <div className="col-12 col-md-6">

                        <div className="border rounded-3 p-3 h-100">

                          <div className="d-flex align-items-center gap-2 mb-2">

                            <CreditCard
                              size={15}
                              style={{
                                color:
                                  GOLD,
                              }}
                            />

                            <span
                              className="fw-semibold"
                              style={{
                                color:
                                  NAVY,
                                fontSize:
                                  "11px",
                              }}
                            >
                              Payment Method
                            </span>

                          </div>

                          <div
                            className="fw-semibold"
                            style={{
                              color:
                                NAVY,
                              fontSize:
                                "13px",
                            }}
                          >
                            {selectedDistribution.paymentMethod ||
                              "-"}
                          </div>

                        </div>

                      </div>

                      <div className="col-12">

                        <div className="border rounded-3 p-3">

                          <div
                            className="fw-semibold mb-2"
                            style={{
                              color:
                                NAVY,
                              fontSize:
                                "11px",
                            }}
                          >
                            Purpose
                          </div>

                          <div
                            className="text-secondary"
                            style={{
                              fontSize:
                                "12px",
                            }}
                          >
                            {selectedDistribution.purpose ||
                              "-"}
                          </div>

                        </div>

                      </div>

                      <div className="col-12 col-md-6">

                        <div className="border rounded-3 p-3 h-100">

                          <div
                            className="fw-semibold mb-2"
                            style={{
                              color:
                                NAVY,
                              fontSize:
                                "11px",
                            }}
                          >
                            Reference
                          </div>

                          <div
                            className="text-secondary text-break"
                            style={{
                              fontSize:
                                "12px",
                            }}
                          >
                            {selectedDistribution.referenceNumber ||
                              "-"}
                          </div>

                        </div>

                      </div>

                      <div className="col-12 col-md-6">

                        <div className="border rounded-3 p-3 h-100">

                          <div
                            className="fw-semibold mb-2"
                            style={{
                              color:
                                NAVY,
                              fontSize:
                                "11px",
                            }}
                          >
                            Notes
                          </div>

                          <div
                            className="text-secondary"
                            style={{
                              fontSize:
                                "12px",
                              whiteSpace:
                                "pre-wrap",
                            }}
                          >
                            {selectedDistribution.notes ||
                              "No notes added."}
                          </div>

                        </div>

                      </div>

                    </div>

                  </>
                )}

            </div>

            {/* FOOTER */}

            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">

              <div>
                {viewError && (
                  <div
                    className="text-danger"
                    style={{
                      fontSize: "11px",
                      maxWidth: "360px",
                    }}
                  >
                    {viewError}
                  </div>
                )}
              </div>

              <div className="d-flex gap-2">

                <button
                  type="button"
                  className="btn d-inline-flex align-items-center gap-2 px-3"
                  style={{
                    backgroundColor:
                      "#ffffff",
                    color:
                      NAVY,
                    border:
                      `1px solid ${NAVY}`,
                    fontWeight: 600,
                  }}
                  onClick={() =>
                    handleGenerateReceipt(
                      selectedDistribution
                    )
                  }
                  disabled={
                    viewLoading ||
                    !selectedDistribution
                  }
                >
                  <Receipt size={15} />
                  Generate Receipt
                </button>

                <button
                  type="button"
                  className="btn px-4"
                  style={{
                    backgroundColor:
                      NAVY,
                    color:
                      "#ffffff",
                    fontWeight: 600,
                  }}
                  onClick={
                    closeViewModal
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

export default Distributions;