import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./layouts/MainLayout";
import Donations from "./pages/Donations";
import Distributions from "./pages/Distributions";
import Donors from "./pages/Donors";
import Reports from "./pages/Reports";
import Categories from "./pages/Categories";
import AuditLogs from "./pages/AuditLogs";
import Users from "./pages/Users";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================================
            LOGIN
        ========================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* =========================================
            MAIN APPLICATION
            SIDEBAR INCLUDED
        ========================================= */}

        <Route element={<MainLayout />}>

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Reports */}
          <Route
            path="/reports"
            element={<Reports />}
          />

          {/* Donations */}
          <Route
            path="/donations"
            element={<Donations />}
          />

          {/* Donors */}
          <Route
            path="/donors"
            element={<Donors />}
          />

          {/* Distributions */}
          <Route
            path="/distributions"
            element={<Distributions />}
          />

          {/* Categories */}
          <Route
            path="/categories"
            element={<Categories />}
          />

          {/* Audit Logs */}
          <Route
            path="/audit-logs"
            element={<AuditLogs />}
          />

          {/* User Management */}
          <Route
            path="/users"
            element={<Users />}
          />

          {/* Settings */}
          <Route
  path="/settings"
  element={<Settings />}
/>

        </Route>

        {/* =========================================
            DEFAULT
        ========================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        {/* =========================================
            FALLBACK
        ========================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;