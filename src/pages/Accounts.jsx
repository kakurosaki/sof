import "./Inventory.css";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "./ToastContext";

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("");
  const [pendingAccountTypeFilter, setPendingAccountTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const { notify } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    account_type: "customer",
  });

  async function loadAccounts(q = "") {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (q.trim()) params.set("search", q.trim());

    try {
      const res = await fetch(`/api/accounts?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load accounts");
      setAccounts(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  const typeOptions = useMemo(() => {
    const types = accounts
      .map((account) => account.account_type)
      .filter((type) => Boolean(type && String(type).trim()));

    return [...new Set(types)].sort((a, b) =>
      String(a).localeCompare(String(b)),
    );
  }, [accounts]);

  const sortedAccounts = useMemo(() => {
    const filtered = accountTypeFilter
      ? accounts.filter(
          (account) =>
            String(account.account_type || "").toLowerCase() ===
            String(accountTypeFilter).toLowerCase(),
        )
      : accounts;

    const copy = [...filtered];

    copy.sort((a, b) => {
      const aValue = a?.[sortBy];
      const bValue = b?.[sortBy];

      if (aValue === null || aValue === undefined)
        return sortDirection === "asc" ? -1 : 1;
      if (bValue === null || bValue === undefined)
        return sortDirection === "asc" ? 1 : -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aText = String(aValue).toLowerCase();
      const bText = String(bValue).toLowerCase();
      const compare = aText.localeCompare(bText, undefined, { numeric: true });
      return sortDirection === "asc" ? compare : -compare;
    });

    return copy;
  }, [accounts, accountTypeFilter, sortBy, sortDirection]);

  function handleSort(column) {
    setSortBy((prev) => {
      if (prev === column) {
        setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
        return prev;
      }

      setSortDirection("asc");
      return column;
    });
  }

  function getSortIcon(column) {
    if (sortBy !== column) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  }

  async function handleDelete(account) {
    const ok = confirm(`Delete "${account.name}"?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete account");
      }
      notify({
        title: "Account deleted",
        message: `${account.name} was removed.`,
        variant: "warning",
      });
      loadAccounts(search);
    } catch (e) {
      alert(e.message);
    }
  }

  function startCreate() {
    setEditingAccount(null);
    setForm({ name: "", email: "", phone: "", account_type: "customer" });
    setShowForm(true);
  }

  function startEdit(account) {
    setEditingAccount(account.id);
    setForm({
      name: account.name || "",
      email: account.email || "",
      phone: account.phone || "",
      account_type: account.account_type || "customer",
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      account_type: form.account_type,
    };

    if (!payload.name) {
      setError("Account name is required");
      return;
    }

    try {
      const isEditing = Number.isFinite(editingAccount);
      const res = await fetch(
        isEditing ? `/api/accounts/${editingAccount}` : "/api/accounts",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save account");

      notify({
        title: Number.isFinite(editingAccount) ? "Account updated" : "Account created",
        message: `${payload.name} was saved successfully.`,
        variant: Number.isFinite(editingAccount) ? "info" : "success",
      });
      setShowForm(false);
      setEditingAccount(null);
      setForm({ name: "", email: "", phone: "", account_type: "customer" });
      loadAccounts(search);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="col-9 container-fluid p-5">
      <h1 className="display-4">Accounts</h1>

      <div className="table-box">
        <div className="container-fluid d-flex justify-content-between px-4 py-3">
          <form
            className="d-flex"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              loadAccounts(search);
            }}
          >
            <input
              className="form-control"
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary me-2"
              disabled={loading}
            >
              <i className="bi bi-search"></i>
            </button>

            <div className="dropdown">
              <button
                className="btn btn-secondary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Filter
              </button>
              <div className="dropdown-menu p-3 inventory-filter-menu">
                <div className="mb-3">
                  <label className="form-label mb-1">Type</label>
                  <select
                    className="form-select form-select-sm"
                    value={pendingAccountTypeFilter}
                    onChange={(e) =>
                      setPendingAccountTypeFilter(e.target.value)
                    }
                  >
                    <option value="">All types</option>
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    onClick={() =>
                      setAccountTypeFilter(pendingAccountTypeFilter)
                    }
                  >
                    Apply
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => {
                      setAccountTypeFilter("");
                      setPendingAccountTypeFilter("");
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="d-flex justify-content-between gap-1">
            <button className="btn btn-primary" onClick={startCreate}>
              Create Account
            </button>
          </div>
        </div>

        <div
          className={`modal fade ${showForm ? "show" : ""}`}
          id="accountFormModal"
          tabIndex="-1"
          aria-labelledby="accountFormModalLabel"
          aria-hidden={!showForm}
          style={{ display: showForm ? "block" : "none" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="accountFormModalLabel">
                  {Number.isFinite(editingAccount)
                    ? "Edit Account"
                    : "Create Account"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAccount(null);
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <form className="row g-2" onSubmit={handleSubmit}>
                  <div className="col-md-4">
                    <input
                      className="form-control"
                      placeholder="Account Name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      className="form-control"
                      placeholder="Email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-2">
                    <input
                      className="form-control"
                      placeholder="Phone"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={form.account_type}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          account_type: e.target.value,
                        }))
                      }
                    >
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                  <div className="col-12 d-flex gap-2 justify-content-end mt-3">
                    <button className="btn btn-primary" type="submit">
                      {Number.isFinite(editingAccount) ? "Save" : "Add"}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingAccount(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        {showForm && <div className="modal-backdrop fade show"></div>}

        <div className="px-4">
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {loading && <div className="text-muted">Loading...</div>}
        </div>

        <div>
          <table className="table">
            <thead className="table-secondary">
              <tr>
                <th scope="col">
                  <button
                    className="btn btn-link p-0 text-dark header-sort-btn"
                    type="button"
                    onClick={() => handleSort("id")}
                  >
                    # {getSortIcon("id")}
                  </button>
                </th>
                <th scope="col">
                  <button
                    className="btn btn-link p-0 text-dark header-sort-btn"
                    type="button"
                    onClick={() => handleSort("name")}
                  >
                    Name{getSortIcon("name")}
                  </button>
                </th>
                <th scope="col">
                  <button
                    className="btn btn-link p-0 text-dark header-sort-btn"
                    type="button"
                    onClick={() => handleSort("email")}
                  >
                    Email{getSortIcon("email")}
                  </button>
                </th>
                <th scope="col">
                  <button
                    className="btn btn-link p-0 text-dark header-sort-btn"
                    type="button"
                    onClick={() => handleSort("phone")}
                  >
                    Phone{getSortIcon("phone")}
                  </button>
                </th>
                <th scope="col">
                  <button
                    className="btn btn-link p-0 text-dark header-sort-btn"
                    type="button"
                    onClick={() => handleSort("account_type")}
                  >
                    Type{getSortIcon("account_type")}
                  </button>
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedAccounts.map((account) => (
                <tr key={account.id}>
                  <th scope="row">{account.id}</th>
                  <td>{account.name}</td>
                  <td>{account.email || "-"}</td>
                  <td>{account.phone || "-"}</td>
                  <td>{account.account_type}</td>
                  <td>
                    <button
                      className="btn btn-white btn-outline-secondary me-2"
                      type="button"
                      onClick={() => {
                        startEdit(account);
                      }}
                      title="Edit"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => handleDelete(account)}
                      title="Delete"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && sortedAccounts.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No accounts found
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

export default Accounts;
