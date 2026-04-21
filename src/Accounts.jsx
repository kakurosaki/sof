import "./Inventory.css";
import { useEffect, useState } from "react";

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
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
      const res = await fetch(isEditing ? `/api/accounts/${editingAccount}` : "/api/accounts", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save account");

      setShowForm(false);
      setEditingAccount(null);
      setForm({ name: "", email: "", phone: "", account_type: "customer" });
      loadAccounts(search);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="col-9 container-fluid p-4">
      <h1 className="display-4">Accounts</h1>

      <div className="table-box">
        <div className="container-fluid d-flex justify-content-between px-4 py-3">
          <form
            className="d-flex"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              loadProducts(search);
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
              <ul className="dropdown-menu">
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => loadProducts("")}
                  >
                    Clear filter
                  </button>
                </li>
              </ul>
            </div>
          </form>

          <div className="d-flex justify-content-between gap-1">
            <button
              className="btn btn-primary"
              onClick={startCreate}
            >
              Create Account
            </button>
          </div>
        </div>

        {showForm && (
          <form className="row g-2 px-4 pb-3" onSubmit={handleSubmit}>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Account Name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="col-md-2">
              <input
                className="form-control"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={form.account_type}
                onChange={(e) => setForm((prev) => ({ ...prev, account_type: e.target.value }))}
              >
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="col-md-1 d-grid gap-2 d-md-flex">
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
        )}

        <div className="px-4">
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {loading && <div className="text-muted">Loading...</div>}
        </div>

        <div>
          <table className="table">
            <thead className="table-secondary">
              <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Type</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {accounts.map((account, idx) => (
                <tr key={account.id}>
                  <th scope="row">{idx + 1}</th>
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

              {!loading && accounts.length === 0 && (
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
