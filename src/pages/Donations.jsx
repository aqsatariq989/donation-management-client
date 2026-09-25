import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CalendarDays,
  User,
  UserPlus,
  Phone,
  Mail,
  CreditCard,
  FileText,
  DollarSign,
} from "lucide-react";
import { Receipt } from "lucide-react";

const API_URL = "http://localhost:5000/api";

const NAVY = "#00142b";
const GOLD = "#e6a726";
const LIGHT_BG = "#f5f7fa";

function Donations() {
  // =====================================================
  // LIST STATE
  // =====================================================

  const [donations, setDonations] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // FILTER STATE
  // =====================================================

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
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
  // ADD DONATION MODAL
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
    donorId: "",
    donationDate:
      new Date().toISOString().split("T")[0],

    donorName: "",
    donorPhone: "",
    donorEmail: "",
    amount: "",
    paymentMethod: "Cash",
    status: "Pending",
    referenceNumber: "",
    notes: "",
  });

  // =====================================================
  // DONOR SELECTION / ADD DONOR
  // =====================================================

  const [donorsList, setDonorsList] = useState([]);
  const [donorSearch, setDonorSearch] = useState("");
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  const [savingDonor, setSavingDonor] = useState(false);
  const [donorSaveError, setDonorSaveError] = useState("");
  const [donorForm, setDonorForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // =====================================================
  // VIEW DONATION MODAL
  // =====================================================

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [selectedDonation, setSelectedDonation] =
    useState(null);

  const [viewLoading, setViewLoading] =
    useState(false);

  const [viewError, setViewError] =
    useState("");

  // =====================================================
  // PAYMENT RECEIPT CONFIRMATION
  // =====================================================

  const [showReceiveModal, setShowReceiveModal] =
    useState(false);

  const [pendingDonation, setPendingDonation] =
    useState(null);

  const [receivingDonation, setReceivingDonation] =
    useState(false);

  const [receiveError, setReceiveError] =
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
  // DECIMAL128 SAFE VALUE
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
  // FORMAT CURRENCY
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
  // FORMAT DATE
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
  // FETCH DONATIONS
  // =====================================================

  const fetchDonations = async (
    requestedPage = page,
    isRefresh = false
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

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (status) {
        params.set(
          "status",
          status
        );
      }

      if (paymentMethod) {
        params.set(
          "paymentMethod",
          paymentMethod
        );
      }

      if (startDate) {
        params.set(
          "startDate",
          startDate
        );
      }

      if (endDate) {
        params.set(
          "endDate",
          endDate
        );
      }

      if (minAmount !== "") {
        params.set(
          "minAmount",
          minAmount
        );
      }

      if (maxAmount !== "") {
        params.set(
          "maxAmount",
          maxAmount
        );
      }

      const response = await fetch(
        `${API_URL}/donations?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to fetch donations."
        );
      }

      setDonations(
        Array.isArray(result.data)
          ? result.data
          : []
      );

      setPagination(
        result.pagination || {
          currentPage: requestedPage,
          totalPages: 1,
          totalRecords: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );

      setPage(
        result.pagination?.currentPage ||
          requestedPage
      );
    } catch (err) {
      console.error(
        "Donations error:",
        err
      );

      setError(
        err.message ||
          "Failed to load donations."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

   const handleGenerateReceipt = async (donation) => {
  try {
    setSaveError("");

    const token = getToken();

    if (!token) {
      throw new Error("Authentication token not found.");
    }

    const donationId =
      donation?._id || donation?.id;

    if (!donationId) {
      throw new Error("Donation ID not found.");
    }

    // Receipt is only available for Received donations
    if (donation.status !== "Received") {
      throw new Error(
        "Receipt can only be generated for received donations."
      );
    }

    const response = await fetch(
      `${API_URL}/donations/${donationId}/receipt`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      let errorMessage =
        "Failed to generate donation receipt.";

      try {
        const errorData = JSON.parse(errorText);

        errorMessage =
          errorData.message || errorMessage;
      } catch {
        // Server returned non-JSON response
      }

      throw new Error(errorMessage);
    }

    // Convert response to PDF blob
    const blob = await response.blob();

    // Create temporary download URL
    const downloadUrl =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = downloadUrl;

    link.download =
      `Donation_Receipt_${donation.referenceNumber || donationId}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(downloadUrl);

    setSaveSuccess(
      "Donation receipt generated successfully."
    );

  } catch (error) {
    console.error(
      "Generate receipt error:",
      error
    );

    setSaveError(
      error.message ||
        "Failed to generate donation receipt."
    );
  }
};

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchDonations(1);
  }, []);

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = (event) => {
    event.preventDefault();

    fetchDonations(1);
  };

  // =====================================================
  // FILTERS
  // =====================================================

  const handleApplyFilters = () => {
    fetchDonations(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setPaymentMethod("");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");

    setShowFilters(false);

    setTimeout(() => {
      fetchDonations(1);
    }, 0);
  };

  // =====================================================
  // PAGINATION
  // =====================================================

  const handlePageChange = (
    newPage
  ) => {
    if (
      newPage < 1 ||
      newPage > pagination.totalPages
    ) {
      return;
    }

    fetchDonations(newPage);
  };

  // =====================================================
  // FETCH DONORS FOR DONATION FORM
  // =====================================================

  const fetchDonorsForSelect = async (requestedSearch = "") => {
    try {
      setDonorsLoading(true);

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "100");

      if (requestedSearch.trim()) {
        params.set("search", requestedSearch.trim());
      }

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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load donors."
        );
      }

      const data = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.donors)
        ? result.donors
        : [];

      setDonorsList(data);
    } catch (err) {
      console.error("Load donation donors error:", err);
    } finally {
      setDonorsLoading(false);
    }
  };

  // =====================================================
  // SELECT EXISTING DONOR
  // =====================================================

  const handleSelectDonor = (event) => {
    const donorId = event.target.value;

    if (!donorId) {
      setForm((previous) => ({
        ...previous,
        donorId: "",
        donorName: "",
        donorPhone: "",
        donorEmail: "",
      }));
      return;
    }

    const donor = donorsList.find(
      (item) => String(item._id || item.id) === String(donorId)
    );

    if (!donor) return;

    setForm((previous) => ({
      ...previous,
      donorId: donor._id || donor.id,
      donorName: donor.name || "",
      donorPhone: donor.phone || "",
      donorEmail: donor.email || "",
    }));

    setDonorSearch("");
    setSaveError("");
  };

  // =====================================================
  // OPEN ADD DONOR
  // =====================================================

  const openAddDonorModal = () => {
    setDonorForm({
      name: "",
      phone: "",
      email: "",
    });
    setDonorSaveError("");
    setShowAddDonorModal(true);
  };

  // =====================================================
  // CLOSE ADD DONOR
  // =====================================================

  const closeAddDonorModal = () => {
    if (savingDonor) return;
    setShowAddDonorModal(false);
    setDonorSaveError("");
  };

  // =====================================================
  // CREATE DONOR FROM DONATION FORM
  // =====================================================

  const handleCreateDonor = async (event) => {
    event.preventDefault();

    try {
      setSavingDonor(true);
      setDonorSaveError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const name = donorForm.name.trim();
      const phone = donorForm.phone.trim();
      const email = donorForm.email.trim().toLowerCase();

      if (!name) {
        throw new Error("Donor name is required.");
      }

      const response = await fetch(`${API_URL}/donors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to add donor."
        );
      }

      // Support the existing API response as well as common
      // wrapped response formats.
      const createdDonor =
        result.data?.donor ||
        result.data?.data ||
        result.data ||
        result.donor;

      if (!createdDonor?._id && !createdDonor?.id) {
        throw new Error(
          "Donor was created, but the API did not return a donor ID."
        );
      }

      const createdDonorId =
        createdDonor._id || createdDonor.id;

      setForm((previous) => ({
        ...previous,
        donorId: createdDonorId,
        donorName: createdDonor.name || name,
        donorPhone: createdDonor.phone || phone,
        donorEmail: createdDonor.email || email,
      }));

      setDonorSearch("");
      setDonorsList((previous) => [
        createdDonor,
        ...previous.filter(
          (item) =>
            String(item._id || item.id) !== String(createdDonorId)
        ),
      ]);

      setShowAddDonorModal(false);
      setDonorForm({ name: "", phone: "", email: "" });
      setSaveSuccess("New donor added and selected successfully.");
    } catch (err) {
      console.error("Create donor error:", err);
      setDonorSaveError(
        err.message || "Failed to add donor."
      );
    } finally {
      setSavingDonor(false);
    }
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
  // RESET ADD FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      donorId: "",
      donationDate:
        new Date()
          .toISOString()
          .split("T")[0],

      donorName: "",
      donorPhone: "",
      donorEmail: "",
      amount: "",
      paymentMethod: "Cash",
      status: "Pending",
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
    setDonorSearch("");
    setShowAddModal(true);
    fetchDonorsForSelect();
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
  // CREATE DONATION
  // =====================================================

  const handleCreateDonation = async (
    event
  ) => {
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

      if (
        !form.donorName.trim()
      ) {
        throw new Error(
          "Donor name is required."
        );
      }

      if (
        !form.amount ||
        Number(form.amount) <= 0
      ) {
        throw new Error(
          "Donation amount must be greater than 0."
        );
      }

      const payload = {
        donorId: form.donorId || null,
        donationDate:
          form.donationDate,

        donorName:
          form.donorName.trim(),

        donorPhone:
          form.donorPhone.trim(),

        donorEmail:
          form.donorEmail
            .trim()
            .toLowerCase(),

        amount:
          Number(form.amount),

        paymentMethod:
          form.paymentMethod,

        status:
          form.status,

        referenceNumber:
          form.referenceNumber.trim(),

        notes:
          form.notes.trim(),
      };

      const response =
        await fetch(
          `${API_URL}/donations`,
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
            "Failed to create donation."
        );
      }

      setSaveSuccess(
        result.message ||
          "Donation created successfully."
      );

      // Refresh table
      await fetchDonations(
        1,
        true
      );

      // Close modal shortly after success
      setTimeout(() => {
        setShowAddModal(false);
        resetForm();
      }, 800);
    } catch (err) {
      console.error(
        "Create donation error:",
        err
      );

      setSaveError(
        err.message ||
          "Failed to create donation."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // VIEW DONATION
  // =====================================================

  const openViewModal = async (
    donation
  ) => {
    try {
      setShowViewModal(true);
      setViewLoading(true);
      setViewError("");
      setSelectedDonation(null);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const donationId =
        donation._id ||
        donation.id;

      const response =
        await fetch(
          `${API_URL}/donations/${donationId}`,
          {
            method: "GET",
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
            "Failed to fetch donation."
        );
      }

      setSelectedDonation(
        result.data
      );
    } catch (err) {
      console.error(
        "View donation error:",
        err
      );

      setViewError(
        err.message ||
          "Failed to load donation."
      );
    } finally {
      setViewLoading(false);
    }
  };

  // =====================================================
  // CLOSE VIEW MODAL
  // =====================================================

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedDonation(null);
    setViewError("");
  };

  // =====================================================
  // MARK PENDING DONATION AS RECEIVED
  // =====================================================

  const openReceiveModal = (donation) => {
    if (!donation || donation.status !== "Pending") {
      return;
    }

    setPendingDonation(donation);
    setReceiveError("");
    setShowReceiveModal(true);
  };

  const closeReceiveModal = () => {
    if (receivingDonation) {
      return;
    }

    setShowReceiveModal(false);
    setPendingDonation(null);
    setReceiveError("");
  };

   const handleMarkAsReceived = async () => {
  if (!pendingDonation) {
    return;
  }

  try {
    setReceivingDonation(true);
    setReceiveError("");

    const token = getToken();

    if (!token) {
      throw new Error("Authentication token not found.");
    }

    const donationId =
      pendingDonation._id || pendingDonation.id;

    if (!donationId) {
      throw new Error("Donation ID not found.");
    }

    const endpoint =
      `${API_URL}/donations/${donationId}/convert-to-received`;

    console.log("MARK RECEIVED REQUEST:", endpoint);

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const responseText = await response.text();

    console.log(
      "MARK RECEIVED STATUS:",
      response.status
    );

    console.log(
      "MARK RECEIVED RESPONSE:",
      responseText
    );

    let result = {};

    try {
      result = responseText
        ? JSON.parse(responseText)
        : {};
    } catch (parseError) {
      throw new Error(
        `Server returned non-JSON response (HTTP ${response.status}).`
      );
    }

    if (!response.ok) {
      throw new Error(
        result.message ||
          `Failed to mark donation as received. HTTP ${response.status}`
      );
    }

    setShowReceiveModal(false);
    setPendingDonation(null);

    await fetchDonations(page, true);

    setSaveSuccess(
      "Payment received successfully. The donation has been allocated to all 7 categories."
    );

  } catch (err) {
    console.error(
      "Mark donation as received error:",
      err
    );

    setReceiveError(
      err.message ||
        "Failed to mark donation as received."
    );

  } finally {
    setReceivingDonation(false);
  }
};

  // =====================================================
  // STATUS BADGE
  // =====================================================

  const StatusBadge = ({
    donationStatus,
  }) => {
    const isReceived =
      donationStatus ===
      "Received";

    return (
      <span
        className="badge rounded-pill px-2 py-2 d-inline-flex align-items-center gap-1"
        style={{
          backgroundColor:
            isReceived
              ? "rgba(25,135,84,0.10)"
              : "rgba(230,167,38,0.15)",

          color: isReceived
            ? "#198754"
            : "#9a6a00",

          fontSize: "10px",
          fontWeight: 600,
        }}
      >
        {isReceived ? (
          <CheckCircle
            size={11}
          />
        ) : (
          <Clock size={11} />
        )}

        {donationStatus ||
          "Pending"}
      </span>
    );
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
            Loading donations...
          </div>

        </div>
      </div>
    );
  }

  return (
    <>
      {/* =================================================
          MAIN PAGE
      ================================================= */}

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
            maxWidth: "none",
            margin: 0,
            boxSizing:
              "border-box",
          }}
        >

          {/* =============================================
              HEADER
          ============================================= */}

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
                  Donations
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
                  all recorded
                  donations.
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
                  Add Donation
                </button>

              </div>

            </div>

          </div>

          {/* =============================================
              SEARCH + FILTERS
          ============================================= */}

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
                        placeholder="Search donor, phone, email or reference..."
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
                        height: "40px",
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
                        height: "40px",
                        color: NAVY,
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
                        Status
                      </label>

                      <select
                        className="form-select"
                        value={status}
                        onChange={(e) =>
                          setStatus(
                            e.target.value
                          )
                        }
                      >
                        <option value="">
                          All Status
                        </option>

                        <option value="Received">
                          Received
                        </option>

                        <option value="Pending">
                          Pending
                        </option>
                      </select>

                    </div>

                    <div className="col-12 col-md-6 col-xl-2">

                      <label className="form-label small fw-semibold">
                        Payment Method
                      </label>

                      <select
                        className="form-select"
                        value={
                          paymentMethod
                        }
                        onChange={(e) =>
                          setPaymentMethod(
                            e.target.value
                          )
                        }
                      >
                        <option value="">
                          All Methods
                        </option>

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

                  <div className="d-flex flex-wrap gap-2 mt-3">

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

          {/* =============================================
              ERROR
          ============================================= */}

          {error && (
            <div className="alert alert-danger border-0 shadow-sm">

              <div className="fw-semibold">
                {error}
              </div>

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
                  fetchDonations(
                    page,
                    true
                  )
                }
              >
                Try Again
              </button>

            </div>
          )}

          {/* =============================================
              DONATION TABLE
          ============================================= */}

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
                    Donation Records
                  </h5>

                  <div
                    className="text-secondary"
                    style={{
                      fontSize: "12px",
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
                  onClick={() =>
                    fetchDonations(
                      page,
                      true
                    )
                  }
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
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      DONOR
                    </th>

                    <th
                      className="border-0 py-3"
                      style={{
                        color:
                          "#718096",
                        fontSize:
                          "10px",
                        whiteSpace:
                          "nowrap",
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
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      PAYMENT
                    </th>

                    <th
                      className="border-0 py-3"
                      style={{
                        color:
                          "#718096",
                        fontSize:
                          "10px",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      STATUS
                    </th>

                    <th
                      className="border-0 py-3 text-end"
                      style={{
                        color:
                          "#718096",
                        fontSize:
                          "10px",
                        whiteSpace:
                          "nowrap",
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
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      ACTION
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {donations.length >
                  0 ? (
                    donations.map(
                      (
                        donation,
                        index
                      ) => {

                        const donorName =
                          donation.donorName ||
                          donation
                            .donorId
                            ?.name ||
                          "Unknown Donor";

                        return (
                          <tr
                            key={
                              donation._id ||
                              donation.id ||
                              index
                            }
                          >

                            {/* DONOR */}

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
                                  {donorName
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase()}
                                </div>

                                <div
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
                                        "220px",
                                    }}
                                    title={
                                      donorName
                                    }
                                  >
                                    {
                                      donorName
                                    }
                                  </div>

                                  {donation.referenceNumber && (
                                    <div
                                      className="text-secondary text-truncate"
                                      style={{
                                        fontSize:
                                          "9px",
                                        maxWidth:
                                          "220px",
                                      }}
                                    >
                                      Ref:{" "}
                                      {
                                        donation.referenceNumber
                                      }
                                    </div>
                                  )}

                                </div>

                              </div>

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
                                donation.donationDate
                              )}
                            </td>

                            {/* PAYMENT */}

                            <td>

                              <span
                                className="badge rounded-pill"
                                style={{
                                  backgroundColor:
                                    "rgba(0,20,43,0.07)",
                                  color:
                                    NAVY,
                                  fontSize:
                                    "9px",
                                  fontWeight:
                                    600,
                                }}
                              >
                                {donation.paymentMethod ||
                                  "-"}
                              </span>

                            </td>

                            {/* STATUS */}

                            <td>

                              <StatusBadge
                                donationStatus={
                                  donation.status
                                }
                              />

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
                                donation.amount
                              )}
                            </td>

                            {/* ACTION */}

                            <td className="text-center">

                              <div className="d-flex align-items-center justify-content-center gap-2">

                                <button
                                  type="button"
                                  className="btn btn-sm btn-light border d-inline-flex align-items-center justify-content-center"
                                  style={{
                                    width: "34px",
                                    height: "34px",
                                    color: NAVY,
                                  }}
                                  title="View donation"
                                  onClick={() =>
                                    openViewModal(donation)
                                  }
                                >
                                  <Eye size={15} />
                                </button>

                                {donation.status === "Received" && (
  <button
    type="button"
    onClick={() => handleGenerateReceipt(donation)}
    className="btn btn-sm d-inline-flex align-items-center justify-content-center gap-1"
    style={{
      minHeight: "34px",
      padding: "0 10px",
      backgroundColor: "rgba(0,20,43,0.06)",
      color: NAVY,
      border: "1px solid rgba(0,20,43,0.12)",
      fontSize: "10px",
      fontWeight: 600,
    }}
    title="Generate Donation Receipt"
  >
    <Receipt size={14} />
    Receipt
  </button>
)}

                                {donation.status === "Pending" && (
                                  <button
                                    type="button"
                                    className="btn btn-sm d-inline-flex align-items-center justify-content-center gap-1"
                                    style={{
                                      minHeight: "34px",
                                      padding: "0 10px",
                                      backgroundColor: "rgba(25,135,84,0.10)",
                                      color: "#198754",
                                      border: "1px solid rgba(25,135,84,0.20)",
                                      fontSize: "10px",
                                      fontWeight: 700,
                                    }}
                                    title="Mark payment as received"
                                    onClick={() =>
                                      openReceiveModal(donation)
                                    }
                                  >
                                    <CheckCircle size={13} />
                                    Received
                                  </button>
                                )}

                              </div>

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
                          <Search
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
                          No donations found
                        </div>

                        <div
                          className="text-secondary mt-1"
                          style={{
                            fontSize:
                              "11px",
                          }}
                        >
                          Try changing your
                          search or filters.
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
          ADD DONATION MODAL
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

            {/* MODAL HEADER */}

            <div
              className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom"
              style={{
                borderColor:
                  "#e9ecef",
              }}
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
                  Add New Donation
                </h4>

                <div
                  className="text-secondary"
                  style={{
                    fontSize:
                      "11px",
                  }}
                >
                  Enter donation and
                  donor information
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

            {/* MODAL BODY */}

            <form
              onSubmit={
                handleCreateDonation
              }
            >

              <div className="p-4">

                {/* SUCCESS */}

                {saveSuccess && (
                  <div className="alert alert-success border-0 small">
                    {saveSuccess}
                  </div>
                )}

                {/* ERROR */}

                {saveError && (
                  <div className="alert alert-danger border-0 small">
                    {saveError}
                  </div>
                )}

                <div className="row g-3">

                  {/* DATE */}

                  <div className="col-12 col-md-6">

                    <label className="form-label fw-semibold small">
                      Donation Date
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
                        name="donationDate"
                        className="form-control"
                        value={
                          form.donationDate
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      />

                    </div>

                  </div>

                  {/* DONOR */}

                  <div className="col-12">

                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <label className="form-label fw-semibold small mb-0">
                        Donor
                        <span className="text-danger"> *</span>
                      </label>

                      <button
                        type="button"
                        className="btn btn-sm d-inline-flex align-items-center gap-1"
                        style={{
                          backgroundColor: "rgba(230,167,38,0.12)",
                          color: NAVY,
                          border: "1px solid rgba(230,167,38,0.35)",
                          fontWeight: 600,
                        }}
                        onClick={openAddDonorModal}
                        disabled={saving}
                      >
                        <UserPlus size={14} />
                        Add New Donor
                      </button>
                    </div>

                    <div className="row g-2">
                      <div className="col-12 col-md-5">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search donor name / phone / email"
                          value={donorSearch}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDonorSearch(value);
                            fetchDonorsForSelect(value);
                          }}
                          disabled={donorsLoading || saving}
                        />
                      </div>

                      <div className="col-12 col-md-7">
                        <select
                          className="form-select"
                          value={form.donorId}
                          onChange={handleSelectDonor}
                          required
                          disabled={donorsLoading || saving}
                        >
                          <option value="">
                            {donorsLoading
                              ? "Loading donors..."
                              : "Select an existing donor"}
                          </option>

                          {donorsList.map((donor) => (
                            <option
                              key={donor._id || donor.id}
                              value={donor._id || donor.id}
                            >
                              {donor.name}
                              {donor.phone ? ` — ${donor.phone}` : ""}
                              {donor.email ? ` — ${donor.email}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {form.donorId && (
                      <div
                        className="mt-2 rounded-3 px-3 py-2"
                        style={{
                          backgroundColor: "rgba(0,20,43,0.04)",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <div className="d-flex flex-wrap gap-3 small">
                          <span>
                            <strong style={{ color: NAVY }}>Name:</strong>{" "}
                            {form.donorName || "-"}
                          </span>
                          <span>
                            <strong style={{ color: NAVY }}>Phone:</strong>{" "}
                            {form.donorPhone || "-"}
                          </span>
                          <span>
                            <strong style={{ color: NAVY }}>Email:</strong>{" "}
                            {form.donorEmail || "-"}
                          </span>
                        </div>
                      </div>
                    )}

                    {!form.donorId && (
                      <div className="text-secondary mt-1" style={{ fontSize: "9px" }}>
                        Select an existing donor or use “Add New Donor”.
                      </div>
                    )}

                  </div>

                  {/* PHONE */}

                  <div className="col-12 col-md-6">

                    <label className="form-label fw-semibold small">
                      Phone
                    </label>

                    <div className="input-group">

                      <span className="input-group-text bg-white">
                        <Phone
                          size={16}
                          style={{
                            color:
                              GOLD,
                          }}
                        />
                      </span>

                      <input
                        type="tel"
                        name="donorPhone"
                        className="form-control"
                        placeholder="Phone number"
                        value={
                          form.donorPhone
                        }
                        onChange={
                          handleFormChange
                        }
                      />

                    </div>

                  </div>

                  {/* EMAIL */}

                  <div className="col-12 col-md-6">

                    <label className="form-label fw-semibold small">
                      Email
                    </label>

                    <div className="input-group">

                      <span className="input-group-text bg-white">
                        <Mail
                          size={16}
                          style={{
                            color:
                              GOLD,
                          }}
                        />
                      </span>

                      <input
                        type="email"
                        name="donorEmail"
                        className="form-control"
                        placeholder="Email address"
                        value={
                          form.donorEmail
                        }
                        onChange={
                          handleFormChange
                        }
                      />

                    </div>

                  </div>

                  {/* AMOUNT */}

                  <div className="col-12 col-md-6">

                    <label className="form-label fw-semibold small">
                      Donation Amount
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

                  </div>

                  {/* PAYMENT METHOD */}

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

                  {/* STATUS */}

                  <div className="col-12 col-md-6">

                    <label className="form-label fw-semibold small">
                      Status
                      <span className="text-danger">
                        {" "}
                        *
                      </span>
                    </label>

                    <select
                      name="status"
                      className="form-select"
                      value={
                        form.status
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                    >
                      <option value="Received">
                        Received
                      </option>

                      <option value="Pending">
                        Pending
                      </option>
                    </select>

                    <div
                      className="text-secondary mt-1"
                      style={{
                        fontSize:
                          "9px",
                      }}
                    >
                      Received donations
                      are automatically
                      allocated to the
                      active categories.
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

              {/* MODAL FOOTER */}

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
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle
                        size={16}
                      />
                      Save Donation
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ===================================================
          ADD DONOR MODAL
      =================================================== */}

      {showAddDonorModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            backgroundColor: "rgba(0,0,0,0.60)",
            zIndex: 3000,
          }}
        >
          <div
            className="bg-white shadow-lg"
            style={{
              width: "100%",
              maxWidth: "480px",
              borderRadius: "16px",
            }}
          >
            <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
              <div>
                <h4
                  className="fw-bold mb-1"
                  style={{ color: NAVY, fontSize: "19px" }}
                >
                  Add New Donor
                </h4>
                <div className="text-secondary" style={{ fontSize: "11px" }}>
                  Create a donor record and use it for this donation.
                </div>
              </div>

              <button
                type="button"
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "36px", height: "36px" }}
                onClick={closeAddDonorModal}
                disabled={savingDonor}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDonor}>
              <div className="p-4">
                {donorSaveError && (
                  <div className="alert alert-danger border-0 small">
                    {donorSaveError}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-semibold small">
                    Donor Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter donor name"
                    value={donorForm.name}
                    onChange={(e) =>
                      setDonorForm((previous) => ({
                        ...previous,
                        name: e.target.value,
                      }))
                    }
                    required
                    autoFocus
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Phone number"
                    value={donorForm.phone}
                    onChange={(e) =>
                      setDonorForm((previous) => ({
                        ...previous,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="mb-1">
                  <label className="form-label fw-semibold small">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email address"
                    value={donorForm.email}
                    onChange={(e) =>
                      setDonorForm((previous) => ({
                        ...previous,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 px-4 py-3 border-top">
                <button
                  type="button"
                  className="btn btn-light border px-4"
                  onClick={closeAddDonorModal}
                  disabled={savingDonor}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn px-4 d-flex align-items-center gap-2"
                  style={{
                    backgroundColor: GOLD,
                    color: NAVY,
                    fontWeight: 600,
                  }}
                  disabled={savingDonor}
                >
                  {savingDonor ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Save Donor
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          MARK AS RECEIVED CONFIRMATION MODAL
      =================================================== */}

      {showReceiveModal && pendingDonation && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            zIndex: 2500,
          }}
        >
          <div
            className="bg-white shadow-lg"
            style={{
              width: "100%",
              maxWidth: "500px",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div
              className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom"
              style={{ borderColor: "#e9ecef" }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "42px",
                    height: "42px",
                    backgroundColor: "rgba(25,135,84,0.10)",
                    color: "#198754",
                  }}
                >
                  <CheckCircle size={21} />
                </div>
                <div>
                  <h5
                    className="fw-bold mb-1"
                    style={{ color: NAVY }}
                  >
                    Confirm Payment Receipt
                  </h5>
                  <div className="text-secondary" style={{ fontSize: "11px" }}>
                    This action will finalize the payment.
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "34px", height: "34px" }}
                onClick={closeReceiveModal}
                disabled={receivingDonation}
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-4">
              {receiveError && (
                <div className="alert alert-danger border-0 small mb-3">
                  {receiveError}
                </div>
              )}

              <div
                className="rounded-3 p-3 mb-3"
                style={{
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                }}
              >
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary small">Donor</span>
                  <strong className="small" style={{ color: NAVY }}>
                    {pendingDonation.donorName || "—"}
                  </strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary small">Amount</span>
                  <strong style={{ color: NAVY }}>
                    {formatCurrency(pendingDonation.amount)}
                  </strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary small">Payment Method</span>
                  <span className="small fw-semibold">
                    {pendingDonation.paymentMethod || "—"}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-secondary small">Reference</span>
                  <span className="small fw-semibold text-break text-end ms-3">
                    {pendingDonation.referenceNumber || "Not provided"}
                  </span>
                </div>
              </div>

              <div
                className="rounded-3 p-3"
                style={{
                  backgroundColor: "rgba(230,167,38,0.08)",
                  border: "1px solid rgba(230,167,38,0.20)",
                }}
              >
                <div className="fw-semibold small mb-1" style={{ color: NAVY }}>
                  What happens next?
                </div>
                <div className="text-secondary" style={{ fontSize: "11px", lineHeight: 1.6 }}>
                  The donation will change from <strong>Pending</strong> to <strong>Received</strong>.
                  The system will then update the donor total and create the 7-category allocation.
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 px-4 py-3 border-top">
              <button
                type="button"
                className="btn btn-light border px-4"
                onClick={closeReceiveModal}
                disabled={receivingDonation}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn px-4 d-flex align-items-center gap-2"
                style={{
                  backgroundColor: "#198754",
                  color: "#ffffff",
                  fontWeight: 600,
                }}
                onClick={handleMarkAsReceived}
                disabled={receivingDonation}
              >
                {receivingDonation ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Confirm Received
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          VIEW DONATION MODAL
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
              style={{
                borderColor:
                  "#e9ecef",
              }}
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
                  Donation Details
                </h4>

                <div
                  className="text-secondary"
                  style={{
                    fontSize:
                      "11px",
                  }}
                >
                  Complete donation
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
                    Loading donation...
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
                selectedDonation && (
                  <>

                    {/* AMOUNT HERO */}

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
                            Donation Amount
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
                              selectedDonation.amount
                            )}
                          </div>

                        </div>

                        <StatusBadge
                          donationStatus={
                            selectedDonation.status
                          }
                        />

                      </div>

                    </div>

                    {/* DETAILS */}

                    <div className="row g-3">

                      <div className="col-12 col-md-6">

                        <div
                          className="border rounded-3 p-3 h-100"
                          style={{
                            borderColor:
                              "#e9ecef",
                          }}
                        >

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
                              Donor
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
                            {selectedDonation.donorName ||
                              selectedDonation.donorId
                                ?.name ||
                              "-"}
                          </div>

                        </div>

                      </div>

                      <div className="col-12 col-md-6">

                        <div
                          className="border rounded-3 p-3 h-100"
                          style={{
                            borderColor:
                              "#e9ecef",
                          }}
                        >

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
                              Donation Date
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
                              selectedDonation.donationDate
                            )}
                          </div>

                        </div>

                      </div>

                      <div className="col-12 col-md-6">

                        <div
                          className="border rounded-3 p-3 h-100"
                          style={{
                            borderColor:
                              "#e9ecef",
                          }}
                        >

                          <div className="d-flex align-items-center gap-2 mb-2">

                            <Phone
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
                              Phone
                            </span>

                          </div>

                          <div
                            style={{
                              color:
                                NAVY,
                              fontSize:
                                "13px",
                            }}
                          >
                            {selectedDonation.donorPhone ||
                              selectedDonation.donorId
                                ?.phone ||
                              "-"}
                          </div>

                        </div>

                      </div>

                      <div className="col-12 col-md-6">

                        <div
                          className="border rounded-3 p-3 h-100"
                          style={{
                            borderColor:
                              "#e9ecef",
                          }}
                        >

                          <div className="d-flex align-items-center gap-2 mb-2">

                            <Mail
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
                              Email
                            </span>

                          </div>

                          <div
                            className="text-break"
                            style={{
                              color:
                                NAVY,
                              fontSize:
                                "13px",
                            }}
                          >
                            {selectedDonation.donorEmail ||
                              selectedDonation.donorId
                                ?.email ||
                              "-"}
                          </div>

                        </div>

                      </div>

                      <div className="col-12 col-md-6">

                        <div
                          className="border rounded-3 p-3 h-100"
                          style={{
                            borderColor:
                              "#e9ecef",
                          }}
                        >

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
                            {selectedDonation.paymentMethod ||
                              "-"}
                          </div>

                        </div>

                      </div>

                      <div className="col-12 col-md-6">

                        <div
                          className="border rounded-3 p-3 h-100"
                          style={{
                            borderColor:
                              "#e9ecef",
                          }}
                        >

                          <div className="d-flex align-items-center gap-2 mb-2">

                            <FileText
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
                              Reference
                            </span>

                          </div>

                          <div
                            className="text-break"
                            style={{
                              color:
                                NAVY,
                              fontSize:
                                "13px",
                            }}
                          >
                            {selectedDonation.referenceNumber ||
                              "-"}
                          </div>

                        </div>

                      </div>

                      {/* NOTES */}

                      <div className="col-12">

                        <div
                          className="border rounded-3 p-3"
                          style={{
                            borderColor:
                              "#e9ecef",
                          }}
                        >

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
                            {selectedDonation.notes ||
                              "No notes added."}
                          </div>

                        </div>

                      </div>

                    </div>

                  </>
                )}

            </div>

            {/* FOOTER */}

            <div className="d-flex justify-content-end gap-2 px-4 py-3 border-top">

              {selectedDonation?.status === "Received" && (
                <button
                  type="button"
                  className="btn d-flex align-items-center gap-2 px-4"
                  style={{
                    backgroundColor: GOLD,
                    color: NAVY,
                    fontWeight: 600,
                    border: "none",
                  }}
                  onClick={() =>
                    handleGenerateReceipt(selectedDonation)
                  }
                >
                  <Receipt size={16} />
                  Generate Receipt
                </button>
              )}

              <button
                type="button"
                className="btn px-4"
                style={{
                  backgroundColor: NAVY,
                  color: "#ffffff",
                  fontWeight: 600,
                }}
                onClick={closeViewModal}
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

export default Donations;