import "./Inventory.css";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

function Suppliers() {
  const { user } = useAuth();
  const isAdmin = user?.account_type === "admin";
  const isReadOnly = !isAdmin;
  
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emptyForm = { name: "", email: "", phone: "" };
  const [form, setForm] = useState(emptyForm);
  const [editingSupplierId, setEditingSupplierId] = useState(null);

  async function loadSuppliers() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/suppliers");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load suppliers");
      setSuppliers(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function handleDelete(supplier) {
    const ok = confirm(`Delete "${supplier.name}"?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete supplier");
      }
      loadSuppliers();
    } catch (e) {
      alert(e.message);
    }
  }

  function startCreate() {
    setEditingSupplierId(null);
    setForm(emptyForm);
  }

  function startEdit(supplier) {
    setEditingSupplierId(supplier.id);
    setForm({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
    });
  }

  async function submitSupplier(e) {
    e.preventDefault();
    setError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
    };

    if (!payload.name) {
      setError("Supplier name is required");
      return;
    }

    try {
      const isEditing = Number.isFinite(editingSupplierId);
      const res = await fetch(isEditing ? `/api/suppliers/${editingSupplierId}` : "/api/suppliers", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save supplier");

      startCreate();
      loadSuppliers();
    } catch (e) {
      setError(e.message);
    }
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      supplier.name?.toLowerCase().includes(q) ||
      supplier.email?.toLowerCase().includes(q) ||
      supplier.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="col-9 container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1 className="display-4">Suppliers</h1>
        {isReadOnly && <span className="badge bg-warning">Read-Only (Staff)</span>}
      </div>

      <div className="table-box">
        <div className="container-fluid d-flex justify-content-between px-4 py-3">
          <form
            className="d-flex"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
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
                    onClick={() => setSearch("")}
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
              disabled={isReadOnly}
              title={isReadOnly ? "Staff cannot add suppliers" : ""}
            >
              New Supplier
            </button>
          </div>
        </div>

        <form className="row g-2 px-4 pb-2" onSubmit={submitSupplier}>
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isReadOnly}
            />
          </div>
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              disabled={isReadOnly}
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={isReadOnly}
            />
          </div>
          <div className="col-md-2 d-grid gap-2 d-md-flex">
            <button className="btn btn-primary" type="submit" disabled={isReadOnly}>
              {Number.isFinite(editingSupplierId) ? "Save" : "Add"}
            </button>
            <button className="btn btn-outline-secondary" type="button" onClick={startCreate} disabled={isReadOnly}>
              Clear
            </button>
          </div>
        </form>

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
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSuppliers.map((supplier, idx) => (
                <tr key={supplier.id}>
                  <th scope="row">{idx + 1}</th>
                  <td>{supplier.name}</td>
                  <td>{supplier.email || "-"}</td>
                  <td>{supplier.phone || "-"}</td>
                  <td>
                    <button
                      className="btn btn-white btn-outline-secondary me-2"
                      type="button"
                      onClick={() => startEdit(supplier)}
                      disabled={isReadOnly}
                      title={isReadOnly ? "Staff cannot edit suppliers" : "Edit"}
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => handleDelete(supplier)}
                      disabled={isReadOnly}
                      title={isReadOnly ? "Staff cannot delete suppliers" : "Delete"}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No suppliers found
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

export default Suppliers;
