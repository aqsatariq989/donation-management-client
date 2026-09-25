import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Download,
  RefreshCw,
  CalendarDays,
  DollarSign,
  Wallet,
  ArrowDownToLine,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";

import api from "../services/api";

const NAVY = "#00142b";
const GOLD = "#e6a726";
const LIGHT_BG = "#f5f7fa";
const BORDER = "#dbe2ea";
const MUTED = "#718096";

function Reports() {
  const currentDate = new Date();

  const [month, setMonth] = useState(
    String(currentDate.getMonth() + 1)
  );

  const [year, setYear] = useState(
    String(currentDate.getFullYear())
  );

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // TOKEN
  // =========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      ""
    );
  };

  // =========================================================
  // MONTH NAME
  // =========================================================

  const monthName = useMemo(() => {
    return new Date(
      Number(year),
      Number(month) - 1,
      1
    ).toLocaleString("en-US", {
      month: "long",
    });
  }, [month, year]);

  // =========================================================
  // NUMBER NORMALIZER
  // =========================================================

  const normalizeNumber = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    if (
      typeof value === "object" &&
      value.$numberDecimal !== undefined
    ) {
      const numberValue = Number(value.$numberDecimal);

      return Number.isFinite(numberValue)
        ? numberValue
        : 0;
    }

    const numberValue = Number(value);

    return Number.isFinite(numberValue)
      ? numberValue
      : 0;
  };

  // =========================================================
  // MONEY FORMAT
  // =========================================================

  const formatMoney = (value) => {
    const numberValue = normalizeNumber(value);

    return numberValue.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // =========================================================
  // GET REPORT DATA
  // =========================================================

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response = await api.get(
        `/reports/monthly?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to generate monthly report."
        );
      }

      // =====================================================
      // IMPORTANT:
      //
      // Backend response:
      //
      // {
      //   success: true,
      //   data: {
      //      summary: {...},
      //      categoryBreakdown: [...],
      //      donations: [...],
      //      distributions: [...]
      //   }
      // }
      //
      // Therefore we MUST use result.data.
      // =====================================================

      const reportData = result.data || {};

      setReport(reportData);
    } catch (err) {
      console.error(
        "===================================="
      );

      console.error(
        "REPORT FETCH ERROR:",
        err
      );

      console.error(
        "===================================="
      );

      setReport(null);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load monthly report."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchReport();
  }, []);

  // =========================================================
  // GENERATE REPORT
  // =========================================================

  const handleGenerateReport = () => {
    fetchReport();
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = () => {
    fetchReport();
  };

  // =========================================================
  // SUMMARY
  // =========================================================

  const summary = report?.summary || {};

  const totalDonations = normalizeNumber(
    summary.totalDonations
  );

  const totalDistributed = normalizeNumber(
    summary.totalDistributed
  );

  const monthlyRemaining = normalizeNumber(
    summary.monthlyRemaining
  );

  const currentCategoryBalance = normalizeNumber(
    summary.currentCategoryBalance
  );

  const donationCount = normalizeNumber(
    summary.donationCount
  );

  const distributionCount = normalizeNumber(
    summary.distributionCount
  );

  // =========================================================
  // CATEGORY BREAKDOWN
  // =========================================================

  const categoryBreakdown = Array.isArray(
    report?.categoryBreakdown
  )
    ? report.categoryBreakdown
    : [];

  // =========================================================
  // DONATIONS
  // =========================================================

  const donations = Array.isArray(
    report?.donations
  )
    ? report.donations
    : [];

  // =========================================================
  // DISTRIBUTIONS
  // =========================================================

  const distributions = Array.isArray(
    report?.distributions
  )
    ? report.distributions
    : [];

  // =========================================================
  // EXPORT
  // =========================================================

 const downloadFile = async (type) => {
  try {
    setExporting(type);
    setError("");

    const token = getToken();

    if (!token) {
      throw new Error(
        "Authentication token not found. Please login again."
      );
    }

    const endpoint =
      type === "excel"
        ? `/reports/monthly/excel?month=${month}&year=${year}`
        : `/reports/monthly/pdf?month=${month}&year=${year}`;

    const response = await api.get(endpoint, {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept:
          type === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf",
      },
    });

    const blob = new Blob([response.data], {
      type:
        type === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      type === "excel"
        ? `Donation_Monthly_Report_${year}_${String(month).padStart(
            2,
            "0"
          )}.xlsx`
        : `Donation_Monthly_Report_${year}_${String(month).padStart(
            2,
            "0"
          )}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Report export error:", err);

    let message = `Failed to export ${type.toUpperCase()} report.`;

    if (err?.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const data = JSON.parse(text);

        message =
          data?.message ||
          data?.error ||
          message;
      } catch {
        // Keep default message
      }
    } else {
      message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        message;
    }

    setError(message);
  } finally {
    setExporting("");
  }
};

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading && !report) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{
          backgroundColor: LIGHT_BG,
        }}
      >
        <div className="text-center">
          <div
            className="spinner-border"
            style={{
              color: GOLD,
              width: "2.5rem",
              height: "2.5rem",
            }}
          />

          <div
            className="mt-3 fw-semibold"
            style={{
              color: NAVY,
            }}
          >
            Loading report...
          </div>

          <div
            className="small mt-1"
            style={{
              color: MUTED,
            }}
          >
            Please wait while we prepare your report.
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className="min-vh-100"
      style={{
        backgroundColor: LIGHT_BG,
        padding: "32px 28px 60px",
      }}
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <div
            className="fw-semibold text-uppercase mb-2"
            style={{
              color: GOLD,
              fontSize: "13px",
              letterSpacing: "2px",
            }}
          >
            Administration
          </div>

          <h1
            className="fw-bold mb-2"
            style={{
              color: NAVY,
              fontSize: "34px",
              letterSpacing: "-0.5px",
            }}
          >
            Reports
          </h1>

          <p
            className="mb-0"
            style={{
              color: MUTED,
              fontSize: "16px",
            }}
          >
            Review donation activity, distributions and
            category balances.
          </p>
        </div>

        <button
          type="button"
          className="btn d-flex align-items-center gap-2"
          onClick={handleRefresh}
          disabled={loading}
          style={{
            backgroundColor: "#ffffff",
            color: NAVY,
            border: `1px solid ${BORDER}`,
            borderRadius: "10px",
            padding: "11px 18px",
            fontWeight: "600",
          }}
        >
          <RefreshCw
            size={17}
            className={
              loading ? "spin" : ""
            }
          />

          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div
          className="alert alert-danger border-0 shadow-sm mb-4"
          style={{
            borderRadius: "12px",
          }}
        >
          <div className="fw-semibold">
            {error}
          </div>
        </div>
      )}

      {/* ====================================================
          FILTER CARD
      ==================================================== */}

      <div
        className="card border-0 shadow-sm mb-4"
        style={{
          borderRadius: "16px",
        }}
      >
        <div className="card-body p-4">
          <div className="row g-3 align-items-end">
            {/* MONTH */}

            <div className="col-md-5">
              <label
                className="form-label fw-semibold"
                style={{
                  color: NAVY,
                }}
              >
                <CalendarDays
                  size={16}
                  className="me-2"
                  style={{
                    color: GOLD,
                  }}
                />

                Month
              </label>

              <select
                className="form-select"
                value={month}
                onChange={(e) =>
                  setMonth(e.target.value)
                }
                style={{
                  borderRadius: "10px",
                  minHeight: "46px",
                  borderColor: BORDER,
                }}
              >
                {Array.from(
                  { length: 12 },
                  (_, index) => {
                    const value = String(
                      index + 1
                    );

                    const label = new Date(
                      2000,
                      index,
                      1
                    ).toLocaleString(
                      "en-US",
                      {
                        month: "long",
                      }
                    );

                    return (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    );
                  }
                )}
              </select>
            </div>

            {/* YEAR */}

            <div className="col-md-4">
              <label
                className="form-label fw-semibold"
                style={{
                  color: NAVY,
                }}
              >
                Year
              </label>

              <select
                className="form-select"
                value={year}
                onChange={(e) =>
                  setYear(e.target.value)
                }
                style={{
                  borderRadius: "10px",
                  minHeight: "46px",
                  borderColor: BORDER,
                }}
              >
                {Array.from(
                  { length: 7 },
                  (_, index) => {
                    const value =
                      Number(
                        currentDate.getFullYear()
                      ) - index;

                    return (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    );
                  }
                )}
              </select>
            </div>

            {/* GENERATE */}

            <div className="col-md-3">
              <button
                type="button"
                onClick={
                  handleGenerateReport
                }
                disabled={loading}
                className="btn w-100"
                style={{
                  backgroundColor: GOLD,
                  color: NAVY,
                  minHeight: "46px",
                  borderRadius: "10px",
                  fontWeight: "700",
                  border: "none",
                }}
              >
                {loading
                  ? "Loading..."
                  : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================
          REPORT TITLE + EXPORT
      ==================================================== */}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <div>
          <h4
            className="fw-bold mb-1"
            style={{
              color: NAVY,
              fontSize: "25px",
            }}
          >
            {monthName} {year} Report
          </h4>

          <span
            style={{
              color: MUTED,
              fontSize: "14px",
            }}
          >
            Monthly financial summary
          </span>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn d-flex align-items-center gap-2"
            onClick={() =>
              downloadFile("excel")
            }
            disabled={!!exporting}
            style={{
              backgroundColor: "#ffffff",
              border: `1px solid ${BORDER}`,
              color: NAVY,
              borderRadius: "10px",
              fontWeight: "600",
              padding: "10px 16px",
            }}
          >
            <Download size={16} />

            {exporting === "excel"
              ? "Exporting..."
              : "Excel"}
          </button>

          <button
            type="button"
            className="btn d-flex align-items-center gap-2"
            onClick={() =>
              downloadFile("pdf")
            }
            disabled={!!exporting}
            style={{
              backgroundColor: GOLD,
              color: NAVY,
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              padding: "10px 17px",
            }}
          >
            <FileText size={16} />

            {exporting === "pdf"
              ? "Generating..."
              : "PDF"}
          </button>
        </div>
      </div>

      {/* ====================================================
          SUMMARY CARDS
      ==================================================== */}

      <div className="row g-3 mb-4">
        <SummaryCard
          title="Total Donations"
          value={formatMoney(
            totalDonations
          )}
          icon={
            <DollarSign size={22} />
          }
          iconBackground="#eef3f8"
          iconColor={NAVY}
        />

        <SummaryCard
          title="Total Distributed"
          value={formatMoney(
            totalDistributed
          )}
          icon={
            <ArrowDownToLine
              size={22}
            />
          }
          iconBackground="#fff5df"
          iconColor={GOLD}
        />

        <SummaryCard
          title="Monthly Remaining"
          value={formatMoney(
            monthlyRemaining
          )}
          icon={<Wallet size={22} />}
          iconBackground="#eef3f8"
          iconColor={NAVY}
        />

        <SummaryCard
          title="Donation Records"
          value={donationCount}
          icon={
            <TrendingUp size={22} />
          }
          iconBackground="#fff5df"
          iconColor={GOLD}
        />
      </div>

      {/* ====================================================
          TRANSACTION COUNTS
      ==================================================== */}

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <InfoCard
            title="Donation Transactions"
            value={donationCount}
            icon={
              <DollarSign size={22} />
            }
            background="#eef3f8"
            color={NAVY}
          />
        </div>

        <div className="col-md-6">
          <InfoCard
            title="Distribution Transactions"
            value={distributionCount}
            icon={
              <ArrowDownToLine
                size={22}
              />
            }
            background="#fff5df"
            color={GOLD}
          />
        </div>
      </div>

      {/* ====================================================
          CURRENT CATEGORY BALANCE
      ==================================================== */}

      <div
        className="card border-0 shadow-sm mb-4"
        style={{
          borderRadius: "16px",
        }}
      >
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div
                className="small mb-1"
                style={{
                  color: MUTED,
                }}
              >
                Current Category Balance
              </div>

              <div
                className="fw-bold"
                style={{
                  color: NAVY,
                  fontSize: "28px",
                }}
              >
                {formatMoney(
                  currentCategoryBalance
                )}
              </div>
            </div>

            <div
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{
                width: "52px",
                height: "52px",
                backgroundColor:
                  "#eef3f8",
                color: NAVY,
              }}
            >
              <Wallet size={23} />
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================
          CATEGORY BREAKDOWN
      ==================================================== */}

      <div
        className="card border-0 shadow-sm mb-4"
        style={{
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <div className="card-header bg-white border-0 p-4 pb-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{
                width: "44px",
                height: "44px",
                backgroundColor:
                  "#eef3f8",
                color: NAVY,
              }}
            >
              <PieChartIcon size={21} />
            </div>

            <div>
              <h5
                className="fw-bold mb-1"
                style={{
                  color: NAVY,
                }}
              >
                Category Breakdown
              </h5>

              <div
                className="small"
                style={{
                  color: MUTED,
                }}
              >
                Allocated, distributed and
                remaining amounts
              </div>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr
                style={{
                  backgroundColor:
                    "#f8fafc",
                  color: "#64748b",
                }}
              >
                <th className="px-4 py-3">
                  CATEGORY
                </th>

                <th className="py-3">
                  ALLOCATION %
                </th>

                <th className="py-3">
                  ALLOCATED
                </th>

                <th className="py-3">
                  DISTRIBUTED
                </th>

                <th className="py-3">
                  REMAINING
                </th>
              </tr>
            </thead>

            <tbody>
              {categoryBreakdown.length >
              0 ? (
                categoryBreakdown.map(
                  (category) => {
                    const allocated =
                      normalizeNumber(
                        category.monthlyAllocatedAmount
                      );

                    const distributed =
                      normalizeNumber(
                        category.monthlyDistributedAmount
                      );

                    const remaining =
                      normalizeNumber(
                        category.monthlyRemaining
                      );

                    const percentage =
                      normalizeNumber(
                        category.allocationPercentage
                      );

                    return (
                      <tr
                        key={
                          category.categoryId ||
                          category._id ||
                          category.categoryName
                        }
                      >
                        <td
                          className="px-4 py-3 fw-semibold"
                          style={{
                            color: NAVY,
                          }}
                        >
                          {
                            category.categoryName
                          }
                        </td>

                        <td>
                          {percentage.toFixed(
                            2
                          )}
                          %
                        </td>

                        <td>
                          {formatMoney(
                            allocated
                          )}
                        </td>

                        <td>
                          {formatMoney(
                            distributed
                          )}
                        </td>

                        <td>
                          <span
                            className="fw-bold"
                            style={{
                              color: NAVY,
                            }}
                          >
                            {formatMoney(
                              remaining
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-5"
                    style={{
                      color: MUTED,
                    }}
                  >
                    {loading
                      ? "Loading report..."
                      : "No category report data available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================
          DONATION TRANSACTIONS
      ==================================================== */}

      <div
        className="card border-0 shadow-sm mb-4"
        style={{
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <div className="card-header bg-white border-0 p-4">
          <h5
            className="fw-bold mb-1"
            style={{
              color: NAVY,
            }}
          >
            Donation Transactions
          </h5>

          <div
            className="small"
            style={{
              color: MUTED,
            }}
          >
            Received donations for {monthName}{" "}
            {year}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr
                style={{
                  backgroundColor:
                    "#f8fafc",
                }}
              >
                <th className="px-4 py-3">
                  DATE
                </th>

                <th className="py-3">
                  DONOR
                </th>

                <th className="py-3">
                  PAYMENT METHOD
                </th>

                <th className="py-3">
                  REFERENCE
                </th>

                <th className="py-3">
                  AMOUNT
                </th>
              </tr>
            </thead>

            <tbody>
              {donations.length > 0 ? (
                donations.map(
                  (donation) => (
                    <tr
                      key={
                        donation._id ||
                        donation.id
                      }
                    >
                      <td className="px-4">
                        {formatDate(
                          donation.donationDate
                        )}
                      </td>

                      <td>
                        <div
                          className="fw-semibold"
                          style={{
                            color: NAVY,
                          }}
                        >
                          {donation.donorName ||
                            donation.donorId
                              ?.name ||
                            "-"}
                        </div>
                      </td>

                      <td>
                        {donation.paymentMethod ||
                          "-"}
                      </td>

                      <td>
                        {donation.referenceNumber ||
                          "-"}
                      </td>

                      <td className="fw-bold">
                        {formatMoney(
                          donation.amount
                        )}
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-5"
                    style={{
                      color: MUTED,
                    }}
                  >
                    No donation transactions
                    found for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================
          DISTRIBUTION TRANSACTIONS
      ==================================================== */}

      <div
        className="card border-0 shadow-sm"
        style={{
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <div className="card-header bg-white border-0 p-4">
          <h5
            className="fw-bold mb-1"
            style={{
              color: NAVY,
            }}
          >
            Distribution Transactions
          </h5>

          <div
            className="small"
            style={{
              color: MUTED,
            }}
          >
            Distributions for {monthName}{" "}
            {year}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr
                style={{
                  backgroundColor:
                    "#f8fafc",
                }}
              >
                <th className="px-4 py-3">
                  DATE
                </th>

                <th className="py-3">
                  CATEGORY
                </th>

                <th className="py-3">
                  BENEFICIARY
                </th>

                <th className="py-3">
                  PURPOSE
                </th>

                <th className="py-3">
                  PAYMENT
                </th>

                <th className="py-3">
                  AMOUNT
                </th>
              </tr>
            </thead>

            <tbody>
              {distributions.length >
              0 ? (
                distributions.map(
                  (distribution) => (
                    <tr
                      key={
                        distribution._id ||
                        distribution.id
                      }
                    >
                      <td className="px-4">
                        {formatDate(
                          distribution.distributionDate
                        )}
                      </td>

                      <td>
                        <span
                          className="fw-semibold"
                          style={{
                            color: NAVY,
                          }}
                        >
                          {distribution
                            .categoryId
                            ?.name ||
                            distribution.categoryName ||
                            "-"}
                        </span>
                      </td>

                      <td>
                        {distribution.beneficiaryName ||
                          "-"}
                      </td>

                      <td>
                        {distribution.purpose ||
                          "-"}
                      </td>

                      <td>
                        {distribution.paymentMethod ||
                          "-"}
                      </td>

                      <td className="fw-bold">
                        {formatMoney(
                          distribution.amount
                        )}
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-5"
                    style={{
                      color: MUTED,
                    }}
                  >
                    No distribution
                    transactions found for
                    this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  icon,
  iconBackground,
  iconColor,
}) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div
        className="card border-0 shadow-sm h-100"
        style={{
          borderRadius: "16px",
        }}
      >
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div
                className="mb-2"
                style={{
                  color: MUTED,
                  fontSize: "14px",
                }}
              >
                {title}
              </div>

              <div
                className="fw-bold"
                style={{
                  color: "#000000",
                  fontSize: "24px",
                }}
              >
                {value}
              </div>
            </div>

            <div
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{
                width: "48px",
                height: "48px",
                backgroundColor:
                  iconBackground,
                color: iconColor,
              }}
            >
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
  title,
  value,
  icon,
  background,
  color,
}) {
  return (
    <div
      className="card border-0 shadow-sm"
      style={{
        borderRadius: "14px",
      }}
    >
      <div className="card-body p-4 d-flex justify-content-between align-items-center">
        <div>
          <div
            className="small mb-1"
            style={{
              color: MUTED,
            }}
          >
            {title}
          </div>

          <div
            className="fw-bold fs-4"
            style={{
              color: NAVY,
            }}
          >
            {value}
          </div>
        </div>

        <div
          className="rounded-3 d-flex align-items-center justify-content-center"
          style={{
            width: "48px",
            height: "48px",
            backgroundColor: background,
            color,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default Reports;