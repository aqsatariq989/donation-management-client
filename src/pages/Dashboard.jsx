import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import {
  DollarSign,
  TrendingUp,
  Wallet,
  Heart,
  CalendarDays,
  ArrowDownToLine,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

const NAVY = "#00142b";
const GOLD = "#e6a726";
const LIGHT_BG = "#f5f7fa";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // AUTH TOKEN
  // =========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      ""
    );
  };

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  const fetchDashboard = async (isRefresh = false) => {
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

      const response = await fetch(
        `${API_URL}/dashboard/summary`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

        if (!response.ok) {
        throw new Error(
            data.message || "Failed to load dashboard."
        );
        }

        setDashboard(data.data || data);
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.message || "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // =========================================================
  // DATA
  // =========================================================

  const summary =
    dashboard?.summary || dashboard || {};

  const categoryBalances =
    dashboard?.categoryBalances ||
    dashboard?.categories ||
    [];

  const recentDonations =
    dashboard?.recentDonations || [];

  const recentDistributions =
    dashboard?.recentDistributions || [];

  // =========================================================
  // HELPERS
  // =========================================================

  const formatCurrency = (value) => {
  let amount = value;

  // MongoDB Decimal128 JSON format
  if (
    amount &&
    typeof amount === "object" &&
    amount.$numberDecimal !== undefined
  ) {
    amount = amount.$numberDecimal;
  }

  // Other possible MongoDB Decimal format
  if (
    amount &&
    typeof amount === "object" &&
    amount.value !== undefined
  ) {
    amount = amount.value;
  }

  amount = Number(amount);

  if (!Number.isFinite(amount)) {
    amount = 0;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // FUNDS CHART
  // =========================================================

  const fundsData = useMemo(() => {
    const remaining = Number(
      summary.totalRemaining || 0
    );

    const distributed = Number(
      summary.totalDistributed || 0
    );

    return [
      {
        name: "Remaining",
        value: remaining,
      },
      {
        name: "Distributed",
        value: distributed,
      },
    ];
  }, [
    summary.totalRemaining,
    summary.totalDistributed,
  ]);

  // =========================================================
  // MONTHLY CHART
  // =========================================================

  const monthlyData = useMemo(() => {
    return [
      {
        name: "This Month",
        Donations: Number(
          summary.currentMonthDonations || 0
        ),
        Distribution: Number(
          summary.currentMonthDistribution || 0
        ),
      },
    ];
  }, [
    summary.currentMonthDonations,
    summary.currentMonthDistribution,
  ]);

  // =========================================================
  // CATEGORY CHART
  // =========================================================

  const categoryChartData = useMemo(() => {
    return categoryBalances.map((category) => ({
      name:
        category.categoryName ||
        category.name ||
        category.category?.name ||
        "Category",

      Balance: Number(
        category.remainingBalance ??
          category.remaining ??
          category.balance ??
          0
      ),

      Allocated: Number(
        category.allocatedAmount ??
          category.allocated ??
          0
      ),

      Distributed: Number(
        category.distributedAmount ??
          category.distributed ??
          0
      ),
    }));
  }, [categoryBalances]);

  // =========================================================
  // KPI CARDS
  // =========================================================

  const kpis = [
    {
      title: "Total Donations",
      value: formatCurrency(
        summary.totalDonations
      ),
      subtitle: `${
        summary.totalDonationCount || 0
      } donations`,
      icon: DollarSign,
      color: GOLD,
      background: "rgba(230,167,38,0.13)",
    },

    {
      title: "Total Distributed",
      value: formatCurrency(
        summary.totalDistributed
      ),
      subtitle: `${
        summary.totalDistributionCount || 0
      } distributions`,
      icon: ArrowDownToLine,
      color: NAVY,
      background: "rgba(0,20,43,0.08)",
    },

    {
      title: "Remaining Balance",
      value: formatCurrency(
        summary.totalRemaining
      ),
      subtitle: "Available funds",
      icon: Wallet,
      color: GOLD,
      background: "rgba(230,167,38,0.13)",
    },

    {
      title: "Donation Count",
      value:
        summary.totalDonationCount || 0,
      subtitle: "All recorded donations",
      icon: Heart,
      color: NAVY,
      background: "rgba(0,20,43,0.08)",
    },

    {
      title: "This Month Donations",
      value: formatCurrency(
        summary.currentMonthDonations
      ),
      subtitle: `${
        summary.currentMonthDonationCount || 0
      } this month`,
      icon: CalendarDays,
      color: GOLD,
      background: "rgba(230,167,38,0.13)",
    },

    {
      title: "This Month Distribution",
      value: formatCurrency(
        summary.currentMonthDistribution
      ),
      subtitle: `${
        summary.currentMonthDistributionCount || 0
      } this month`,
      icon: TrendingUp,
      color: NAVY,
      background: "rgba(0,20,43,0.08)",
    },
  ];

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        className="min-vh-100 w-100 d-flex align-items-center justify-content-center"
        style={{
          backgroundColor: LIGHT_BG,
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

          <div className="mt-3 text-secondary fw-semibold">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div
        className="min-vh-100 w-100 p-3 p-lg-4"
        style={{
          backgroundColor: LIGHT_BG,
          overflowX: "hidden",
        }}
      >
        <div className="alert alert-danger border-0 shadow-sm">
          <div className="fw-bold">
            Unable to load dashboard
          </div>

          <div className="mt-1">
            {error}
          </div>

          <button
            type="button"
            className="btn btn-sm mt-3"
            style={{
              backgroundColor: NAVY,
              color: "#ffffff",
            }}
            onClick={() => fetchDashboard(true)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN DASHBOARD
  // =========================================================

  return (
    <div
      className="min-vh-100 w-100"
      style={{
        backgroundColor: LIGHT_BG,
        overflowX: "hidden",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        className="w-100 px-3 px-lg-4 pb-4"
        style={{
          maxWidth: "none",
          margin: 0,
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
      >

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="pt-4 pb-3">
          <div className="row align-items-center g-3 mx-0">

            <div className="col-12 col-md">
              <div
                className="text-uppercase fw-semibold mb-1"
                style={{
                  color: GOLD,
                  fontSize: "11px",
                  letterSpacing: "0.09em",
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
                Dashboard
              </h1>

              <p
                className="mb-0"
                style={{
                  color: "#718096",
                  fontSize: "14px",
                }}
              >
                Overview of donations, distributions
                and available funds.
              </p>
            </div>

            <div className="col-12 col-md-auto">
              <button
                type="button"
                className="btn bg-white d-flex align-items-center justify-content-center gap-2 px-3 shadow-sm"
                style={{
                  color: NAVY,
                  border: "1px solid #dee2e6",
                  height: "42px",
                  borderRadius: "8px",
                }}
                onClick={() =>
                  fetchDashboard(true)
                }
                disabled={refreshing}
              >
                <RefreshCw
                  size={17}
                  className={
                    refreshing
                      ? "spin"
                      : ""
                  }
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>

          </div>
        </div>

        {/* ===================================================
            KPI CARDS
        =================================================== */}

        <div className="row g-3 mx-0 mb-3">

          {kpis.map((item) => {
            const Icon = item.icon;

            return (
              <div
                className="col-12 col-sm-6 col-lg-4 col-xl-2"
                key={item.title}
              >
                <div
                  className="card border-0 shadow-sm h-100"
                  style={{
                    borderRadius: "14px",
                    overflow: "hidden",
                    minWidth: 0,
                  }}
                >
                  <div className="card-body p-3">

                    <div className="d-flex justify-content-between align-items-start gap-2">

                      <div
                        className="flex-grow-1"
                        style={{
                          minWidth: 0,
                        }}
                      >
                        <div
                          className="text-secondary fw-semibold text-truncate"
                          style={{
                            fontSize: "11px",
                          }}
                          title={item.title}
                        >
                          {item.title}
                        </div>

                        <div
                          className="fw-bold mt-2 text-truncate"
                          style={{
                            color: NAVY,
                            fontSize: "20px",
                            lineHeight: "1.2",
                          }}
                          title={item.value}
                        >
                          {item.value}
                        </div>

                        <div
                          className="mt-2 text-secondary text-truncate"
                          style={{
                            fontSize: "10px",
                          }}
                          title={item.subtitle}
                        >
                          {item.subtitle}
                        </div>
                      </div>

                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "42px",
                          height: "42px",
                          backgroundColor:
                            item.background,
                          color: item.color,
                        }}
                      >
                        <Icon size={20} />
                      </div>

                    </div>

                  </div>

                  <div
                    style={{
                      height: "3px",
                      backgroundColor: item.color,
                    }}
                  />

                </div>
              </div>
            );
          })}

        </div>

        {/* ===================================================
            CHARTS
        =================================================== */}

        <div className="row g-3 mx-0 mb-3">

          {/* FUNDS OVERVIEW */}

          <div className="col-12 col-lg-4">

            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >

              <div className="card-body p-3">

                <div className="d-flex justify-content-between align-items-center mb-2">

                  <div>
                    <h5
                      className="fw-bold mb-1"
                      style={{
                        color: NAVY,
                        fontSize: "18px",
                      }}
                    >
                      Funds Overview
                    </h5>

                    <div
                      className="text-secondary"
                      style={{
                        fontSize: "12px",
                      }}
                    >
                      Current fund position
                    </div>
                  </div>

                  <span
                    className="rounded-circle flex-shrink-0"
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: GOLD,
                    }}
                  />

                </div>

                <div
                  className="w-100"
                  style={{
                    height: "250px",
                    minWidth: 0,
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>

                      <Pie
                        data={fundsData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        innerRadius={62}
                        outerRadius={88}
                        paddingAngle={3}
                      >
                        <Cell fill={NAVY} />
                        <Cell fill={GOLD} />
                      </Pie>

                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(value)
                        }
                      />

                      <Legend
                        verticalAlign="bottom"
                        height={30}
                      />

                    </PieChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>

          </div>

          {/* MONTHLY ACTIVITY */}

          <div className="col-12 col-lg-4">

            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >

              <div className="card-body p-3">

                <div className="d-flex justify-content-between align-items-center mb-2">

                  <div>
                    <h5
                      className="fw-bold mb-1"
                      style={{
                        color: NAVY,
                        fontSize: "18px",
                      }}
                    >
                      Monthly Activity
                    </h5>

                    <div
                      className="text-secondary"
                      style={{
                        fontSize: "12px",
                      }}
                    >
                      Donations compared with
                      distributions
                    </div>
                  </div>

                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "38px",
                      height: "38px",
                      backgroundColor:
                        "rgba(230,167,38,0.12)",
                      color: GOLD,
                    }}
                  >
                    <TrendingUp size={18} />
                  </div>

                </div>

                <div
                  className="w-100"
                  style={{
                    height: "250px",
                    minWidth: 0,
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={monthlyData}
                      margin={{
                        top: 10,
                        right: 5,
                        left: -15,
                        bottom: 5,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 10,
                        }}
                      />

                      <YAxis
                        tick={{
                          fontSize: 9,
                        }}
                      />

                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(value)
                        }
                      />

                      <Legend />

                      <Bar
                        dataKey="Donations"
                        fill={NAVY}
                        radius={[
                          5,
                          5,
                          0,
                          0,
                        ]}
                        barSize={42}
                      />

                      <Bar
                        dataKey="Distribution"
                        fill={GOLD}
                        radius={[
                          5,
                          5,
                          0,
                          0,
                        ]}
                        barSize={42}
                      />

                    </BarChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>

          </div>

          {/* CATEGORY BALANCES */}

          <div className="col-12 col-lg-4">

            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >

              <div className="card-body p-3">

                <div className="d-flex justify-content-between align-items-center mb-2">

                  <div>
                    <h5
                      className="fw-bold mb-1"
                      style={{
                        color: NAVY,
                        fontSize: "18px",
                      }}
                    >
                      Category Balances
                    </h5>

                    <div
                      className="text-secondary"
                      style={{
                        fontSize: "12px",
                      }}
                    >
                      Remaining balance across
                      categories
                    </div>
                  </div>

                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "38px",
                      height: "38px",
                      backgroundColor:
                        "rgba(230,167,38,0.12)",
                      color: GOLD,
                    }}
                  >
                    <BarChart3 size={18} />
                  </div>

                </div>

                <div
                  className="w-100"
                  style={{
                    height: "250px",
                    minWidth: 0,
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={categoryChartData}
                      margin={{
                        top: 5,
                        right: 5,
                        left: -15,
                        bottom: 5,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 8,
                        }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={60}
                      />

                      <YAxis
                        tick={{
                          fontSize: 9,
                        }}
                      />

                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(value)
                        }
                      />

                      <Bar
                        dataKey="Balance"
                        fill={GOLD}
                        radius={[
                          4,
                          4,
                          0,
                          0,
                        ]}
                      />

                    </BarChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* ===================================================
            CATEGORY SUMMARY
        =================================================== */}

        <div className="row g-3 mx-0 mb-3">

          <div className="col-12">

            <div
              className="card border-0 shadow-sm"
              style={{
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >

              <div className="card-body p-3">

                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">

                  <div>
                    <h5
                      className="fw-bold mb-1"
                      style={{
                        color: NAVY,
                        fontSize: "18px",
                      }}
                    >
                      Category Summary
                    </h5>

                    <div
                      className="text-secondary"
                      style={{
                        fontSize: "12px",
                      }}
                    >
                      Allocation and remaining
                      balances
                    </div>
                  </div>

                  <span
                    className="badge rounded-pill px-3 py-2 align-self-start align-self-sm-center"
                    style={{
                      backgroundColor:
                        "rgba(230,167,38,0.18)",
                      color: NAVY,
                    }}
                  >
                    {categoryBalances.length}{" "}
                    Categories
                  </span>

                </div>

                <div className="row g-2">

                  {categoryBalances.map(
                    (category, index) => {

                      const name =
                        category.categoryName ||
                        category.name ||
                        category.category?.name ||
                        "Category";

                      const allocated = Number(
                        category.allocatedAmount ??
                          category.allocated ??
                          0
                      );

                      const distributed = Number(
                        category.distributedAmount ??
                          category.distributed ??
                          0
                      );

                      const remaining = Number(
                        category.remainingBalance ??
                          category.remaining ??
                          category.balance ??
                          0
                      );

                      const availablePercent =
                        allocated > 0
                          ? Math.min(
                              100,
                              Math.max(
                                0,
                                (remaining /
                                  allocated) *
                                  100
                              )
                            )
                          : 0;

                      return (
                        <div
                          className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl"
                          key={
                            category._id ||
                            category.id ||
                            index
                          }
                        >

                          <div
                            className="border rounded-3 h-100 p-3"
                            style={{
                              backgroundColor:
                                "#ffffff",
                              borderColor:
                                "#e9ecef",
                              minWidth: 0,
                              overflow: "hidden",
                            }}
                          >

                            <div className="d-flex align-items-center gap-2">

                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                style={{
                                  width: "34px",
                                  height: "34px",
                                  backgroundColor:
                                    index % 2 === 0
                                      ? "rgba(230,167,38,0.15)"
                                      : "rgba(0,20,43,0.08)",
                                  color:
                                    index % 2 === 0
                                      ? GOLD
                                      : NAVY,
                                  fontSize: "11px",
                                }}
                              >
                                {index + 1}
                              </div>

                              <div
                                className="flex-grow-1"
                                style={{
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  className="fw-semibold text-truncate"
                                  title={name}
                                  style={{
                                    color: NAVY,
                                    fontSize: "11px",
                                  }}
                                >
                                  {name}
                                </div>

                                <div
                                  className="text-secondary"
                                  style={{
                                    fontSize: "9px",
                                  }}
                                >
                                  Remaining
                                </div>
                              </div>

                            </div>

                            <div
                              className="fw-bold mt-3 text-truncate"
                              style={{
                                color: NAVY,
                                fontSize: "16px",
                              }}
                            >
                              {formatCurrency(
                                remaining
                              )}
                            </div>

                            <div
                              className="progress mt-2"
                              style={{
                                height: "6px",
                              }}
                            >
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                  width: `${availablePercent}%`,
                                  backgroundColor:
                                    GOLD,
                                }}
                              />
                            </div>

                            <div className="d-flex justify-content-between gap-2 mt-3">

                              <div
                                style={{
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  className="text-secondary"
                                  style={{
                                    fontSize: "8px",
                                  }}
                                >
                                  Allocated
                                </div>

                                <div
                                  className="fw-semibold text-truncate"
                                  style={{
                                    color: NAVY,
                                    fontSize: "9px",
                                  }}
                                >
                                  {formatCurrency(
                                    allocated
                                  )}
                                </div>
                              </div>

                              <div
                                className="text-end"
                                style={{
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  className="text-secondary"
                                  style={{
                                    fontSize: "8px",
                                  }}
                                >
                                  Distributed
                                </div>

                                <div
                                  className="fw-semibold text-truncate"
                                  style={{
                                    color: NAVY,
                                    fontSize: "9px",
                                  }}
                                >
                                  {formatCurrency(
                                    distributed
                                  )}
                                </div>
                              </div>

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            RECENT ACTIVITY
        =================================================== */}

        <div className="row g-3 mx-0">

          {/* RECENT DONATIONS */}

          <div className="col-12 col-xl-6">

            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >

              <div className="card-body p-3">

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <div>
                    <h5
                      className="fw-bold mb-1"
                      style={{
                        color: NAVY,
                        fontSize: "18px",
                      }}
                    >
                      Recent Donations
                    </h5>

                    <div
                      className="text-secondary"
                      style={{
                        fontSize: "12px",
                      }}
                    >
                      Latest recorded donations
                    </div>
                  </div>

                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor:
                        "rgba(230,167,38,0.12)",
                      color: GOLD,
                    }}
                  >
                    <ArrowUpRight size={17} />
                  </div>

                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">

                    <thead>
                      <tr>

                        <th
                          className="border-0 text-secondary"
                          style={{
                            fontSize: "10px",
                          }}
                        >
                          DONOR
                        </th>

                        <th
                          className="border-0 text-secondary"
                          style={{
                            fontSize: "10px",
                          }}
                        >
                          DATE
                        </th>

                        <th
                          className="border-0 text-secondary text-end"
                          style={{
                            fontSize: "10px",
                          }}
                        >
                          AMOUNT
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {recentDonations.length >
                      0 ? (
                        recentDonations.map(
                          (donation, index) => (
                            <tr
                              key={
                                donation._id ||
                                donation.id ||
                                index
                              }
                            >

                              <td>

                                <div className="d-flex align-items-center gap-2">

                                  <div
                                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                    style={{
                                      width: "30px",
                                      height: "30px",
                                      backgroundColor:
                                        "rgba(0,20,43,0.08)",
                                      color: NAVY,
                                      fontSize: "11px",
                                    }}
                                  >
                                    {(
                                      donation.donorName ||
                                      "D"
                                    )
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>

                                  <div
                                    style={{
                                      minWidth: 0,
                                    }}
                                  >

                                    <div
                                      className="fw-semibold text-truncate"
                                      title={
                                        donation.donorName
                                      }
                                      style={{
                                        color: NAVY,
                                        fontSize: "12px",
                                        maxWidth:
                                          "180px",
                                      }}
                                    >
                                      {donation.donorName ||
                                        "Unknown"}
                                    </div>

                                    <div
                                      className="text-secondary"
                                      style={{
                                        fontSize: "9px",
                                      }}
                                    >
                                      {donation.paymentMethod ||
                                        "Payment"}
                                    </div>

                                  </div>

                                </div>

                              </td>

                              <td
                                className="text-secondary text-nowrap"
                                style={{
                                  fontSize: "10px",
                                }}
                              >
                                {formatDate(
                                  donation.donationDate ||
                                    donation.createdAt
                                )}
                              </td>

                              <td
                                className="text-end fw-bold text-nowrap"
                                style={{
                                  color: NAVY,
                                  fontSize: "11px",
                                }}
                              >
                                {formatCurrency(
                                  donation.amount
                                )}
                              </td>

                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            className="text-center text-secondary py-4"
                            style={{
                              fontSize: "11px",
                            }}
                          >
                            No recent donations.
                          </td>
                        </tr>
                      )}

                    </tbody>

                  </table>
                </div>

              </div>

            </div>

          </div>

          {/* RECENT DISTRIBUTIONS */}

          <div className="col-12 col-xl-6">

            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >

              <div className="card-body p-3">

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <div>
                    <h5
                      className="fw-bold mb-1"
                      style={{
                        color: NAVY,
                        fontSize: "18px",
                      }}
                    >
                      Recent Distributions
                    </h5>

                    <div
                      className="text-secondary"
                      style={{
                        fontSize: "12px",
                      }}
                    >
                      Latest fund distributions
                    </div>
                  </div>

                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor:
                        "rgba(0,20,43,0.08)",
                      color: NAVY,
                    }}
                  >
                    <ArrowDownRight size={17} />
                  </div>

                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">

                    <thead>
                      <tr>

                        <th
                          className="border-0 text-secondary"
                          style={{
                            fontSize: "10px",
                          }}
                        >
                          BENEFICIARY
                        </th>

                        <th
                          className="border-0 text-secondary"
                          style={{
                            fontSize: "10px",
                          }}
                        >
                          DATE
                        </th>

                        <th
                          className="border-0 text-secondary text-end"
                          style={{
                            fontSize: "10px",
                          }}
                        >
                          AMOUNT
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {recentDistributions.length >
                      0 ? (
                        recentDistributions.map(
                          (distribution, index) => (
                            <tr
                              key={
                                distribution._id ||
                                distribution.id ||
                                index
                              }
                            >

                              <td>

                                <div
                                  style={{
                                    minWidth: 0,
                                  }}
                                >

                                  <div
                                    className="fw-semibold text-truncate"
                                    title={
                                      distribution.beneficiaryName
                                    }
                                    style={{
                                      color: NAVY,
                                      fontSize: "12px",
                                      maxWidth:
                                        "200px",
                                    }}
                                  >
                                    {distribution.beneficiaryName ||
                                      "Unknown"}
                                  </div>

                                  <div
                                    className="text-secondary text-truncate"
                                    title={
                                      distribution.purpose
                                    }
                                    style={{
                                      maxWidth:
                                        "200px",
                                      fontSize: "9px",
                                    }}
                                  >
                                    {distribution.purpose ||
                                      "Distribution"}
                                  </div>

                                </div>

                              </td>

                              <td
                                className="text-secondary text-nowrap"
                                style={{
                                  fontSize: "10px",
                                }}
                              >
                                {formatDate(
                                  distribution.distributionDate ||
                                    distribution.createdAt
                                )}
                              </td>

                              <td
                                className="text-end fw-bold text-nowrap"
                                style={{
                                  color: NAVY,
                                  fontSize: "11px",
                                }}
                              >
                                {formatCurrency(
                                  distribution.amount
                                )}
                              </td>

                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            className="text-center text-secondary py-4"
                            style={{
                              fontSize: "11px",
                            }}
                          >
                            No recent distributions.
                          </td>
                        </tr>
                      )}

                    </tbody>

                  </table>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="text-center py-3">
          <small
            className="text-secondary"
            style={{
              fontSize: "10px",
            }}
          >
            Donation Management System
          </small>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;