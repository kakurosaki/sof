import "./Inventory.css";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

function Suppliers() {
  const { user } = useAuth();
  const isAdmin = user?.account_type === "admin";
  const isReadOnly = !isAdmin;
  
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emptyForm = { name: "", email: "", phone: "" };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
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
    setShowForm(true);
  }

  function startEdit(supplier) {
    setEditingSupplierId(supplier.id);
    setForm({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
    });
    setShowForm(true);
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

      setShowForm(false);
      setEditingSupplierId(null);
      setForm(emptyForm);
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

  const sortedSuppliers = useMemo(() => {
    const copy = [...filteredSuppliers];

    copy.sort((a, b) => {
      const aValue = a?.[sortBy];
      const bValue = b?.[sortBy];

      if (aValue === null || aValue === undefined) return sortDirection === "asc" ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortDirection === "asc" ? 1 : -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aText = String(aValue).toLowerCase();
      const bText = String(bValue).toLowerCase();
      const compare = aText.localeCompare(bText, undefined, { numeric: true });
      return sortDirection === "asc" ? compare : -compare;
    });

    return copy;
  }, [filteredSuppliers, sortBy, sortDirection]);

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

        <div
          className={`modal fade ${showForm ? "show" : ""}`}
          id="supplierFormModal"
          tabIndex="-1"
          aria-labelledby="supplierFormModalLabel"
          aria-hidden={!showForm}
          style={{ display: showForm ? "block" : "none" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="supplierFormModalLabel">
                  {Number.isFinite(editingSupplierId) ? "Edit Supplier" : "New Supplier"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSupplierId(null);
                    setForm(emptyForm);
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <form className="row g-2" onSubmit={submitSupplier}>
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
                  <div className="col-md-4">
                    <input
                      className="form-control"
                      placeholder="Phone"
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="col-12 d-flex gap-2 justify-content-end mt-3">
                    <button className="btn btn-primary" type="submit" disabled={isReadOnly}>
                      {Number.isFinite(editingSupplierId) ? "Save" : "Add"}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingSupplierId(null);
                        setForm(emptyForm);
                      }}
                      disabled={isReadOnly}
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
                  <button className="btn btn-link p-0 text-dark header-sort-btn" type="button" onClick={() => handleSort("id")}># {getSortIcon("id")}</button>
                </th>
                <th scope="col">
                  <button className="btn btn-link p-0 text-dark header-sort-btn" type="button" onClick={() => handleSort("name")}>Name{getSortIcon("name")}</button>
                </th>
                <th scope="col">
                  <button className="btn btn-link p-0 text-dark header-sort-btn" type="button" onClick={() => handleSort("email")}>Email{getSortIcon("email")}</button>
                </th>
                <th scope="col">
                  <button className="btn btn-link p-0 text-dark header-sort-btn" type="button" onClick={() => handleSort("phone")}>Phone{getSortIcon("phone")}</button>
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <th scope="row">{supplier.id}</th>
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

              {!loading && sortedSuppliers.length === 0 && (
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
