import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  HandCoins,
  Send,
  Users,
  BarChart3,
  FolderTree,
  Settings,
  ClipboardList,
  LogOut,
  UserCog,
} from "lucide-react";

function Sidebar() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const userRole = user?.role || "Admin";

  const isAdmin =
    userRole === "Admin" ||
    userRole === "admin";

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Donations",
      path: "/donations",
      icon: HandCoins,
    },
    {
      label: "Distributions",
      path: "/distributions",
      icon: Send,
    },
    {
      label: "Donors",
      path: "/donors",
      icon: Users,
    },
    {
      label: "Reports",
      path: "/reports",
      icon: BarChart3,
    },
    {
      label: "Categories",
      path: "/categories",
      icon: FolderTree,
    },
    {
      label: "Audit Logs",
      path: "/audit-logs",
      icon: ClipboardList,
    },

    // =====================================================
    // USER MANAGEMENT — ADMIN ONLY
    // =====================================================
    ...(isAdmin
      ? [
          {
            label: "User Management",
            path: "/users",
            icon: UserCog,
          },
        ]
      : []),

    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("adminToken");

    navigate("/login", {
      replace: true,
    });
  };

  const userName =
    user?.name || "Administrator";

  const userInitial =
    userName.charAt(0).toUpperCase();

  return (
    <aside
      className="d-flex flex-column position-fixed top-0 start-0 vh-100"
      style={{
        width: "260px",
        backgroundColor: "#00142b",
        zIndex: 1030,
        overflow: "hidden",
      }}
    >
      {/* =====================================================
          BRAND HEADER
      ===================================================== */}

      <div
        className="px-3 py-4 border-bottom text-center"
        style={{
          borderColor: "rgba(255,255,255,0.10)",
        }}
      >
        {/* BRAND ICON */}

        <div
          className="mx-auto d-flex align-items-center justify-content-center fw-bold"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            backgroundColor: "#e6a726",
            color: "#00142b",
            boxShadow:
              "0 6px 18px rgba(230,167,38,0.20)",
            fontSize: "28px",
            lineHeight: 1,
          }}
        >
          D
        </div>

        {/* BRAND TEXT */}

        <div className="mt-3">
          <div
            className="text-white fw-bold"
            style={{
              fontSize: "17px",
              lineHeight: "1.2",
            }}
          >
            Donation Management
          </div>
        </div>
      </div>

      {/* =====================================================
          MAIN MENU
      ===================================================== */}

      <div
        className="flex-grow-1 overflow-auto px-3 py-4"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor:
            "rgba(255,255,255,0.30) transparent",
        }}
      >
        <nav className="d-flex flex-column gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="text-decoration-none"
              >
                {({ isActive }) => (
                  <div
                    className="d-flex align-items-center gap-3 rounded-3 px-3 py-3"
                    style={{
                      backgroundColor:
                        isActive
                          ? "#e6a726"
                          : "transparent",

                      color:
                        isActive
                          ? "#00142b"
                          : "rgba(255,255,255,0.78)",

                      minHeight: "50px",

                      transition:
                        "background-color 0.2s ease",
                    }}
                  >
                    <Icon
                      size={19}
                      strokeWidth={
                        isActive ? 2.4 : 2
                      }
                    />

                    <span
                      className="fw-semibold"
                      style={{
                        fontSize: "14px",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* =====================================================
          USER PROFILE
      ===================================================== */}

      <div
        className="p-3 border-top"
        style={{
          borderColor:
            "rgba(255,255,255,0.10)",
        }}
      >
        <div className="d-flex align-items-center gap-3 px-2 mb-3">
          {/* USER AVATAR */}

          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#e6a726",
              color: "#00142b",
              fontSize: "16px",
            }}
          >
            {userInitial}
          </div>

          {/* USER INFO */}

          <div
            className="overflow-hidden"
            style={{
              minWidth: 0,
            }}
          >
            <div
              className="text-white fw-semibold text-truncate"
              style={{
                fontSize: "13px",
              }}
            >
              {userName}
            </div>

            <div
              className="text-capitalize"
              style={{
                color:
                  "rgba(255,255,255,0.55)",
                fontSize: "12px",
              }}
            >
              {userRole}
            </div>
          </div>
        </div>

        {/* LOGOUT */}

        <button
          type="button"
          className="btn w-100 d-flex align-items-center justify-content-center gap-2 rounded-2 fw-semibold"
          style={{
            height: "40px",
            color:
              "rgba(255,255,255,0.75)",
            backgroundColor:
              "rgba(255,255,255,0.05)",
            border:
              "1px solid rgba(255,255,255,0.10)",
            fontSize: "13px",
          }}
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;