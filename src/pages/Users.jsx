import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
};

const getCurrentUser = () => {
  try {
    const storedUser =
      localStorage.getItem("user") ||
      localStorage.getItem("currentUser") ||
      sessionStorage.getItem("user") ||
      sessionStorage.getItem("currentUser");

    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const getAuthHeaders = () => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data.message || "Something went wrong";
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "Staff",
  isActive: true,
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  });

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");

  const [form, setForm] = useState(emptyForm);
  const [selectedUser, setSelectedUser] = useState(null);

  const [showPassword, setShowPassword] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [deleteUser, setDeleteUser] = useState(null);
  const [statusUser, setStatusUser] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

   useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchUsers();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (roleFilter) {
        params.append("role", roleFilter);
      }

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      params.append("page", page);
      params.append("limit", limit);

      const response = await fetch(
        `${API_BASE_URL}/users?${params.toString()}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();

      setUsers(data.data || []);

      setPagination(
        data.pagination || {
          page: 1,
          limit,
          totalRecords: 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openCreateModal = () => {
    clearMessages();

    setModalMode("create");
    setSelectedUser(null);
    setForm(emptyForm);
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    clearMessages();

    setModalMode("edit");
    setSelectedUser(user);

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "Staff",
      isActive: user.isActive !== false,
    });

    setShowPassword(false);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedUser(null);
    setForm(emptyForm);
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      clearMessages();

      if (!form.name.trim()) {
        throw new Error("Name is required");
      }

      if (!form.email.trim()) {
        throw new Error("Email is required");
      }

      if (modalMode === "create" && !form.password) {
        throw new Error("Password is required");
      }

      if (modalMode === "create" && form.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        isActive: form.isActive,
      };

      if (modalMode === "create") {
        payload.password = form.password;
      }

      const url =
        modalMode === "create"
          ? `${API_BASE_URL}/users`
          : `${API_BASE_URL}/users/${selectedUser._id}`;

      const response = await fetch(url, {
        method: modalMode === "create" ? "POST" : "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();

      setSuccess(
        data.message ||
          (modalMode === "create"
            ? "User created successfully"
            : "User updated successfully")
      );

      closeModal();
      fetchUsers();
    } catch (err) {
      console.error("Save user error:", err);
      setError(err.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (user) => {
    clearMessages();
    setStatusUser(user);
  };

  const cancelStatusChange = () => {
    if (actionLoadingId) return;
    setStatusUser(null);
  };

  const confirmStatusChange = async () => {
    if (!statusUser) return;

    const nextStatus = statusUser.isActive === false;

    try {
      setActionLoadingId(statusUser._id);
      clearMessages();

      const response = await fetch(
        `${API_BASE_URL}/users/${statusUser._id}/status`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            isActive: nextStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();

      setSuccess(
        data.message || "User status updated successfully"
      );

      setStatusUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Status update error:", err);
      setError(err.message || "Failed to update user status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openResetModal = (user) => {
    clearMessages();

    setResetUser(user);
    setNewPassword("");
    setShowResetPassword(false);
    setShowResetModal(true);
  };

  const closeResetModal = () => {
    if (saving) return;

    setShowResetModal(false);
    setResetUser(null);
    setNewPassword("");
    setShowResetPassword(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      clearMessages();

      if (!newPassword) {
        throw new Error("New password is required");
      }

      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const response = await fetch(
        `${API_BASE_URL}/users/${resetUser._id}/password`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            password: newPassword,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();

      setSuccess(data.message || "Password reset successfully");

      closeResetModal();
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.message || "Failed to reset password");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (user) => {
    clearMessages();
    setDeleteUser(user);
  };

  const cancelDelete = () => {
    if (actionLoadingId) return;
    setDeleteUser(null);
  };

  const handleDelete = async () => {
    if (!deleteUser) return;

    try {
      setActionLoadingId(deleteUser._id);
      clearMessages();

      const response = await fetch(
        `${API_BASE_URL}/users/${deleteUser._id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();

      setSuccess(data.message || "User deleted successfully");
      setDeleteUser(null);

      if (users.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error("Delete user error:", err);
      setError(err.message || "Failed to delete user");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }

    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getUserIdString = (user) => {
    return String(user?._id || user?.id || "");
  };

  const currentUserId = String(
    currentUser?._id || currentUser?.id || ""
  );

  const isCurrentUser = (user) => {
    return getUserIdString(user) === currentUserId;
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>User Management</h1>
          <p style={styles.subtitle}>
            Manage Admin and Staff accounts, access and passwords.
          </p>
        </div>

        <button style={styles.primaryButton} onClick={openCreateModal}>
          <span style={styles.buttonIcon}>+</span>
          Add User
        </button>
      </div>

      {/* MESSAGES */}
      {success && (
        <div style={styles.successAlert}>
          <span>✓</span>
          <span>{success}</span>
          <button
            style={styles.alertClose}
            onClick={() => setSuccess("")}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div style={styles.errorAlert}>
          <span>!</span>
          <span>{error}</span>
          <button
            style={styles.alertClose}
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* STATS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div>
            <div style={styles.statLabel}>Total Users</div>
            <div style={styles.statValue}>
              {pagination.totalRecords || 0}
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>✓</div>
          <div>
            <div style={styles.statLabel}>Active</div>
            <div style={styles.statValue}>
              {users.filter((user) => user.isActive !== false).length}
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>A</div>
          <div>
            <div style={styles.statLabel}>Admins</div>
            <div style={styles.statValue}>
              {users.filter((user) => user.role === "Admin").length}
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>S</div>
          <div>
            <div style={styles.statLabel}>Staff</div>
            <div style={styles.statValue}>
              {users.filter((user) => user.role === "Staff").length}
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div style={styles.filterCard}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />

          {search && (
            <button
              style={styles.clearSearch}
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          style={styles.select}
        >
          <option value="">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Staff">Staff</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={styles.select}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          style={styles.refreshButton}
          onClick={fetchUsers}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* TABLE */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Users</h2>
            <p style={styles.tableSubtitle}>
              {pagination.totalRecords || 0} user
              {pagination.totalRecords === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>👥</div>
            <h3 style={styles.emptyTitle}>No users found</h3>
            <p style={styles.emptyText}>
              Try changing your filters or add a new user.
            </p>

            <button
              style={styles.primaryButton}
              onClick={openCreateModal}
            >
              + Add User
            </button>
          </div>
        ) : (
          <div style={styles.tableScroll}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>USER</th>
                  <th style={styles.th}>EMAIL</th>
                  <th style={styles.th}>ROLE</th>
                  <th style={styles.th}>STATUS</th>
                  <th style={styles.th}>CREATED</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const self = isCurrentUser(user);
                  const active = user.isActive !== false;
                  const busy = actionLoadingId === user._id;

                  return (
                    <tr key={user._id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div style={styles.avatar}>
                            {getInitials(user.name)}
                          </div>

                          <div>
                            <div style={styles.userName}>
                              {user.name || "-"}
                              {self && (
                                <span style={styles.youBadge}>
                                  You
                                </span>
                              )}
                            </div>
                            <div style={styles.userId}>
                              ID: {String(user._id).slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.email}>
                          {user.email || "-"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={
                            user.role === "Admin"
                              ? styles.adminBadge
                              : styles.staffBadge
                          }
                        >
                          {user.role || "Staff"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={
                            active
                              ? styles.activeBadge
                              : styles.inactiveBadge
                          }
                        >
                          <span
                            style={
                              active
                                ? styles.activeDot
                                : styles.inactiveDot
                            }
                          ></span>
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.date}>
                          {formatDate(user.createdAt)}
                        </span>
                      </td>

                      <td style={styles.actionTd}>
                        <div style={styles.actions}>
                          <button
                            style={styles.actionButton}
                            onClick={() => openEditModal(user)}
                            title="Edit User"
                          >
                            Edit
                          </button>

                          <button
                            style={styles.actionButton}
                            onClick={() => openResetModal(user)}
                            title="Reset Password"
                          >
                            Password
                          </button>

                          {!self && (
                            <button
                              style={
                                active
                                  ? styles.warningButton
                                  : styles.successButton
                              }
                              onClick={() =>
                                handleStatusChange(user)
                              }
                              disabled={busy}
                              title={
                                active
                                  ? "Deactivate User"
                                  : "Activate User"
                              }
                            >
                              {busy
                                ? "..."
                                : active
                                ? "Deactivate"
                                : "Activate"}
                            </button>
                          )}

                          {!self && (
                            <button
                              style={styles.deleteButton}
                              onClick={() => confirmDelete(user)}
                              disabled={busy}
                              title="Delete User"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && users.length > 0 && (
          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Showing{" "}
              <strong>
                {(pagination.page - 1) * pagination.limit + 1}
              </strong>{" "}
              to{" "}
              <strong>
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.totalRecords
                )}
              </strong>{" "}
              of{" "}
              <strong>{pagination.totalRecords}</strong>
            </div>

            <div style={styles.paginationButtons}>
              <button
                style={styles.pageButton}
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                ← Previous
              </button>

              <div style={styles.pageNumber}>
                {pagination.page} / {pagination.totalPages}
              </div>

              <button
                style={styles.pageButton}
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {modalMode === "create"
                    ? "Add New User"
                    : "Edit User"}
                </h2>

                <p style={styles.modalSubtitle}>
                  {modalMode === "create"
                    ? "Create an Admin or Staff account."
                    : "Update user account information."}
                </p>
              </div>

              <button
                style={styles.modalClose}
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.formBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Full Name <span style={styles.required}>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="Enter full name"
                    style={styles.input}
                    autoFocus
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Email <span style={styles.required}>*</span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="user@example.com"
                    style={styles.input}
                  />
                </div>

                {modalMode === "create" && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      Password{" "}
                      <span style={styles.required}>*</span>
                    </label>

                    <div style={styles.passwordWrapper}>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleFormChange}
                        placeholder="Minimum 6 characters"
                        style={styles.passwordInput}
                      />

                      <button
                        type="button"
                        style={styles.passwordToggle}
                        onClick={() =>
                          setShowPassword((prev) => !prev)
                        }
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                )}

                <div style={styles.formRow}>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.label}>Role</label>

                    <select
                      name="role"
                      value={form.role}
                      onChange={handleFormChange}
                      style={styles.input}
                      disabled={
                        modalMode === "edit" &&
                        isCurrentUser(selectedUser)
                      }
                    >
                      <option value="Staff">Staff</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.label}>Account Status</label>

                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleFormChange}
                        disabled={
                          modalMode === "edit" &&
                          isCurrentUser(selectedUser)
                        }
                      />

                      <span>
                        {form.isActive ? "Active" : "Inactive"}
                      </span>
                    </label>
                  </div>
                </div>

                {modalMode === "edit" &&
                  isCurrentUser(selectedUser) && (
                    <div style={styles.infoBox}>
                      <strong>Current account:</strong> You cannot
                      change your own role or deactivate your own
                      account.
                    </div>
                  )}
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : modalMode === "create"
                    ? "Create User"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && resetUser && (
        <div style={styles.overlay}>
          <div style={styles.smallModal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Reset Password</h2>

                <p style={styles.modalSubtitle}>
                  Set a new password for{" "}
                  <strong>{resetUser.name}</strong>.
                </p>
              </div>

              <button
                style={styles.modalClose}
                onClick={closeResetModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleResetPassword}>
              <div style={styles.formBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    New Password{" "}
                    <span style={styles.required}>*</span>
                  </label>

                  <div style={styles.passwordWrapper}>
                    <input
                      type={
                        showResetPassword ? "text" : "password"
                      }
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(e.target.value)
                      }
                      placeholder="Minimum 6 characters"
                      style={styles.passwordInput}
                      autoFocus
                    />

                    <button
                      type="button"
                      style={styles.passwordToggle}
                      onClick={() =>
                        setShowResetPassword((prev) => !prev)
                      }
                    >
                      {showResetPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div style={styles.infoBox}>
                  The password will be securely hashed before it is
                  stored.
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={closeResetModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={saving}
                >
                  {saving ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUS CONFIRMATION */}
      {statusUser && (
        <div style={styles.overlay}>
          <div style={styles.confirmModal}>
            <div
              style={
                statusUser.isActive === false
                  ? styles.confirmIcon
                  : styles.warningConfirmIcon
              }
            >
              {statusUser.isActive === false ? "✓" : "!"}
            </div>

            <h2 style={styles.confirmTitle}>
              {statusUser.isActive === false
                ? "Activate User?"
                : "Deactivate User?"}
            </h2>

            <p style={styles.confirmText}>
              Are you sure you want to{" "}
              {statusUser.isActive === false
                ? "activate"
                : "deactivate"}{" "}
              <strong>{statusUser.name}</strong>?
            </p>

            <div style={styles.confirmActions}>
              <button
                style={styles.cancelButton}
                onClick={cancelStatusChange}
                disabled={!!actionLoadingId}
              >
                Cancel
              </button>

              <button
                style={
                  statusUser.isActive === false
                    ? styles.activateConfirmButton
                    : styles.deleteConfirmButton
                }
                onClick={confirmStatusChange}
                disabled={!!actionLoadingId}
              >
                {actionLoadingId
                  ? "Processing..."
                  : statusUser.isActive === false
                  ? "Activate User"
                  : "Deactivate User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteUser && (
        <div style={styles.overlay}>
          <div style={styles.confirmModal}>
            <div style={styles.confirmIcon}>!</div>

            <h2 style={styles.confirmTitle}>Delete User?</h2>

            <p style={styles.confirmText}>
              Are you sure you want to delete{" "}
              <strong>{deleteUser.name}</strong>?
              <br />
              This action cannot be undone.
            </p>

            <div style={styles.confirmActions}>
              <button
                style={styles.cancelButton}
                onClick={cancelDelete}
                disabled={!!actionLoadingId}
              >
                Cancel
              </button>

              <button
                style={styles.deleteConfirmButton}
                onClick={handleDelete}
                disabled={!!actionLoadingId}
              >
                {actionLoadingId ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   STYLES
============================================================ */

const styles = {
  page: {
    padding: "28px",
    background: "#f6f8fb",
    minHeight: "100vh",
    boxSizing: "border-box",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#00142b",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 750,
    letterSpacing: "-0.5px",
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#667085",
    fontSize: "14px",
  },

  primaryButton: {
    border: "none",
    borderRadius: "9px",
    padding: "11px 17px",
    background: "#00142b",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 650,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    whiteSpace: "nowrap",
  },

  buttonIcon: {
    fontSize: "19px",
    lineHeight: 1,
  },

  successAlert: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 15px",
    marginBottom: "18px",
    borderRadius: "9px",
    background: "#ecfdf3",
    border: "1px solid #abefc6",
    color: "#067647",
    fontSize: "14px",
  },

  errorAlert: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 15px",
    marginBottom: "18px",
    borderRadius: "9px",
    background: "#fef3f2",
    border: "1px solid #fecdca",
    color: "#b42318",
    fontSize: "14px",
  },

  alertClose: {
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    fontSize: "19px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e5e9f0",
    borderRadius: "12px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.03)",
  },

  statIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    fontWeight: 750,
  },

  statLabel: {
    fontSize: "12px",
    color: "#667085",
    marginBottom: "4px",
  },

  statValue: {
    fontSize: "23px",
    fontWeight: 750,
  },

  filterCard: {
    background: "#fff",
    border: "1px solid #e5e9f0",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.03)",
  },

  searchWrapper: {
    position: "relative",
    flex: 1,
    minWidth: "220px",
  },

  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#98a2b3",
    fontSize: "21px",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    height: "42px",
    padding: "0 38px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    outline: "none",
    fontSize: "14px",
    color: "#101828",
  },

  clearSearch: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#667085",
    cursor: "pointer",
    fontSize: "19px",
  },

  select: {
    height: "42px",
    minWidth: "135px",
    padding: "0 11px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    background: "#fff",
    color: "#344054",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
  },

  refreshButton: {
    height: "42px",
    padding: "0 14px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    background: "#fff",
    color: "#344054",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  tableCard: {
    background: "#fff",
    border: "1px solid #e5e9f0",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.03)",
  },

  tableHeader: {
    padding: "19px 20px",
    borderBottom: "1px solid #eaecf0",
  },

  tableTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 700,
  },

  tableSubtitle: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#667085",
  },

  tableScroll: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1050px",
  },

  th: {
    padding: "12px 18px",
    textAlign: "left",
    background: "#f9fafb",
    color: "#667085",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.4px",
    borderBottom: "1px solid #eaecf0",
  },

  tr: {
    borderBottom: "1px solid #f0f2f5",
  },

  td: {
    padding: "15px 18px",
    verticalAlign: "middle",
    fontSize: "13px",
    color: "#344054",
  },

  actionTd: {
    padding: "12px 18px",
    textAlign: "right",
    verticalAlign: "middle",
  },

  userCell: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  avatar: {
    width: "38px",
    height: "38px",
    minWidth: "38px",
    borderRadius: "50%",
    background: "#e8b700",
    color: "#00142b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 750,
    fontSize: "12px",
  },

  userName: {
    fontWeight: 650,
    color: "#101828",
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },

  userId: {
    marginTop: "3px",
    fontSize: "10px",
    color: "#98a2b3",
    fontFamily: "monospace",
  },

  youBadge: {
    padding: "2px 6px",
    borderRadius: "5px",
    background: "#eef4ff",
    color: "#175cd3",
    fontSize: "9px",
    fontWeight: 700,
  },

  email: {
    color: "#475467",
  },

  adminBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#fff4cc",
    color: "#7a5b00",
    fontSize: "11px",
    fontWeight: 700,
  },

  staffBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#eef4ff",
    color: "#175cd3",
    fontSize: "11px",
    fontWeight: 700,
  },

  activeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#ecfdf3",
    color: "#067647",
    fontSize: "11px",
    fontWeight: 650,
  },

  inactiveBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#f2f4f7",
    color: "#667085",
    fontSize: "11px",
    fontWeight: 650,
  },

  activeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#12b76a",
  },

  inactiveDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#98a2b3",
  },

  date: {
    color: "#667085",
    whiteSpace: "nowrap",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },

  actionButton: {
    border: "1px solid #d0d5dd",
    background: "#fff",
    color: "#344054",
    borderRadius: "7px",
    padding: "6px 9px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },

  warningButton: {
    border: "1px solid #fedf89",
    background: "#fffaeb",
    color: "#b54708",
    borderRadius: "7px",
    padding: "6px 9px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },

  successButton: {
    border: "1px solid #abefc6",
    background: "#ecfdf3",
    color: "#067647",
    borderRadius: "7px",
    padding: "6px 9px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },

  deleteButton: {
    border: "1px solid #fecdca",
    background: "#fff",
    color: "#b42318",
    borderRadius: "7px",
    padding: "6px 9px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },

  loadingContainer: {
    minHeight: "300px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#667085",
    fontSize: "14px",
  },

  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid #e4e7ec",
    borderTop: "3px solid #00142b",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: "12px",
  },

  emptyState: {
    minHeight: "330px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "38px",
    marginBottom: "10px",
  },

  emptyTitle: {
    margin: "0 0 6px",
    fontSize: "17px",
  },

  emptyText: {
    margin: "0 0 18px",
    color: "#667085",
    fontSize: "13px",
  },

  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    padding: "14px 18px",
    borderTop: "1px solid #eaecf0",
  },

  paginationInfo: {
    color: "#667085",
    fontSize: "12px",
  },

  paginationButtons: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  pageButton: {
    border: "1px solid #d0d5dd",
    background: "#fff",
    borderRadius: "7px",
    padding: "7px 11px",
    color: "#344054",
    fontSize: "12px",
    cursor: "pointer",
  },

  pageNumber: {
    minWidth: "60px",
    textAlign: "center",
    fontSize: "12px",
    color: "#475467",
    fontWeight: 600,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 20, 43, 0.48)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
    boxSizing: "border-box",
  },

  modal: {
    width: "100%",
    maxWidth: "570px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.18)",
  },

  smallModal: {
    width: "100%",
    maxWidth: "470px",
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.18)",
  },

  confirmModal: {
    width: "100%",
    maxWidth: "430px",
    background: "#fff",
    borderRadius: "14px",
    padding: "28px",
    textAlign: "center",
    boxSizing: "border-box",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.18)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    padding: "20px 22px",
    borderBottom: "1px solid #eaecf0",
  },

  modalTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: 750,
    color: "#101828",
  },

  modalSubtitle: {
    margin: "5px 0 0",
    color: "#667085",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  modalClose: {
    width: "32px",
    height: "32px",
    border: "none",
    borderRadius: "7px",
    background: "#f2f4f7",
    color: "#667085",
    fontSize: "22px",
    cursor: "pointer",
    lineHeight: 1,
  },

  formBody: {
    padding: "22px",
  },

  formGroup: {
    marginBottom: "17px",
  },

  formRow: {
    display: "flex",
    gap: "15px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontSize: "12px",
    fontWeight: 650,
    color: "#344054",
  },

  required: {
    color: "#d92d20",
  },

  input: {
    width: "100%",
    height: "42px",
    boxSizing: "border-box",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    padding: "0 11px",
    fontSize: "13px",
    color: "#101828",
    outline: "none",
    background: "#fff",
  },

  passwordWrapper: {
    display: "flex",
    alignItems: "stretch",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    overflow: "hidden",
  },

  passwordInput: {
    flex: 1,
    height: "40px",
    border: "none",
    outline: "none",
    padding: "0 11px",
    fontSize: "13px",
    minWidth: 0,
  },

  passwordToggle: {
    border: "none",
    borderLeft: "1px solid #d0d5dd",
    background: "#f9fafb",
    color: "#344054",
    padding: "0 12px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 650,
  },

  checkboxLabel: {
    height: "42px",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "0 11px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    color: "#344054",
    fontSize: "13px",
    cursor: "pointer",
    boxSizing: "border-box",
  },

  infoBox: {
    padding: "11px 13px",
    borderRadius: "8px",
    background: "#f2f4f7",
    color: "#475467",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "9px",
    padding: "15px 22px",
    borderTop: "1px solid #eaecf0",
  },

  cancelButton: {
    border: "1px solid #d0d5dd",
    background: "#fff",
    color: "#344054",
    borderRadius: "8px",
    padding: "10px 15px",
    fontSize: "13px",
    fontWeight: 650,
    cursor: "pointer",
  },

  confirmIcon: {
    width: "48px",
    height: "48px",
    margin: "0 auto 14px",
    borderRadius: "50%",
    background: "#fef3f2",
    color: "#d92d20",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    fontWeight: 750,
  },

  warningConfirmIcon: {
    width: "48px",
    height: "48px",
    margin: "0 auto 14px",
    borderRadius: "50%",
    background: "#fffaeb",
    color: "#b54708",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    fontWeight: 750,
  },

  activateConfirmButton: {
    border: "none",
    background: "#067647",
    color: "#fff",
    borderRadius: "8px",
    padding: "10px 15px",
    fontSize: "13px",
    fontWeight: 650,
    cursor: "pointer",
  },

  confirmTitle: {
    margin: "0 0 8px",
    fontSize: "19px",
    color: "#101828",
  },

  confirmText: {
    margin: "0 0 23px",
    color: "#667085",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  confirmActions: {
    display: "flex",
    justifyContent: "center",
    gap: "9px",
  },

  deleteConfirmButton: {
    border: "none",
    background: "#d92d20",
    color: "#fff",
    borderRadius: "8px",
    padding: "10px 15px",
    fontSize: "13px",
    fontWeight: 650,
    cursor: "pointer",
  },

};

export default Users;