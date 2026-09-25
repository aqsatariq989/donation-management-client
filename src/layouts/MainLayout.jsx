import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function MainLayout() {
  return (
    <div
      className="d-flex min-vh-100 w-100"
      style={{
        margin: 0,
        padding: 0,
        backgroundColor: "#f5f7fa",
        overflowX: "hidden",
      }}
    >
      <Sidebar />

      <main
        className="flex-grow-1 min-vh-100"
        style={{
          marginLeft: "260px",
          width: "auto",
          minWidth: 0,
          maxWidth: "none",
          padding: 0,
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;