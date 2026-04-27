import "./Inventory.css";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import AddProductForm from "./AddProductForm";
import EditProductForm from "./EditProductForm";

function Inventory() {
  const { user } = useAuth();
  const isAdmin = user?.account_type === "admin";
  const isReadOnly = !isAdmin;
  
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);

  async function loadProducts(
    q = "",
    supplierId = supplierFilter,
    category = categoryFilter
  ) {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (q.trim()) params.set("search", q.trim());
    if (supplierId) params.set("supplier_id", supplierId);
    if (category) params.set("category", category);

    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load products");
      setProducts(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await fetch("/api/suppliers");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed to load suppliers");
        setSuppliers(json.data || []);
      } catch (_err) {
        setSuppliers([]);
      }
    }

    loadSuppliers();
  }, []);

  const sortedProducts = useMemo(() => {
    const copy = [...products];

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
  }, [products, sortBy, sortDirection]);

  const categoryOptions = useMemo(() => {
    const categories = products
      .map((product) => product.category)
      .filter((category) => Boolean(category && String(category).trim()));

    return [...new Set(categories)].sort((a, b) => String(a).localeCompare(String(b)));
  }, [products]);

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

  async function handleDelete(product) {
    const ok = confirm(`Delete "${product.name}"?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete product");
      }
      loadProducts(search);
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="col-9 container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1 className="display-4">Inventory</h1>
        {isReadOnly && <span className="badge bg-warning">Read-Only (Staff)</span>}
      </div>

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
            <button type="submit" className="btn btn-primary me-2" disabled={loading}>
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
                <div className="mb-2">
                  <label className="form-label mb-1">Supplier</label>
                  <select
                    className="form-select form-select-sm"
                    value={supplierFilter}
                    onChange={(e) => setSupplierFilter(e.target.value)}
                  >
                    <option value="">All suppliers</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label mb-1">Category</label>
                  <select
                    className="form-select form-select-sm"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All categories</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    onClick={() => loadProducts(search, supplierFilter, categoryFilter)}
                  >
                    Apply
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => {
                      setSupplierFilter("");
                      setCategoryFilter("");
                      loadProducts(search, "", "");
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="d-flex justify-content-between gap-1">
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingProduct(null);
                setShowAdd(true);
              }}
              disabled={isReadOnly}
              title={isReadOnly ? "Staff cannot add products" : ""}
            >
              Add Product
            </button>
          </div>
        </div>

        <div
          className={`modal fade ${showAdd ? "show" : ""}`}
          id="addProductModal"
          tabIndex="-1"
          aria-labelledby="addProductModalLabel"
          aria-hidden={!showAdd}
          style={{ display: showAdd ? "block" : "none" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="addProductModalLabel">Add Product</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAdd(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <AddProductForm
                  embedded
                  onClose={() => setShowAdd(false)}
                  onCreated={() => loadProducts(search)}
                />
              </div>
            </div>
          </div>
        </div>
        {showAdd && <div className="modal-backdrop fade show"></div>}

        {editingProduct && (
          <EditProductForm
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
            onUpdated={() => loadProducts(search)}
          />
        )}

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
                  <button className="btn btn-link p-0 text-dark header-sort-btn" type="button" onClick={() => handleSort("sku")}>SKU{getSortIcon("sku")}</button>
                </th>
                <th scope="col">
                  <button className="btn btn-link p-0 text-dark header-sort-btn" type="button" onClick={() => handleSort("name")}>Name{getSortIcon("name")}</button>
                </th>
                <th scope="col">
                  <button className="btn btn-link p-0 text-dark header-sort-btn" type="button" onClick={() => handleSort("category")}>Category{getSortIcon("category")}</button>
                </th>
                <th scope="col">
                  <button className="btn btn-link p-0 text-dark header-sort-btn" type="button" onClick={() => handleSort("supplier_name")}>Supplier{getSortIcon("supplier_name")}</button>
                </th>
                <th scope="col">
                  <button className="btn btn-link p-0 text-dark header-sort-btn" type="button" onClick={() => handleSort("stock_on_hand")}>Stock{getSortIcon("stock_on_hand")}</button>
                </th>
                <th scope="col">
                  <button className="btn btn-link p-0 text-dark header-sort-btn" type="button" onClick={() => handleSort("min_stock_level")}>Min Stock{getSortIcon("min_stock_level")}</button>
                </th>
                <th scope="col">
                  <button className="btn btn-link p-0 text-dark header-sort-btn" type="button" onClick={() => handleSort("unit_price")}>Unit Price{getSortIcon("unit_price")}</button>
                </th>
                <th scope="col">
                  <button className="btn btn-link p-0 text-dark header-sort-btn" type="button" onClick={() => handleSort("unit_cost")}>Cost{getSortIcon("unit_cost")}</button>
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedProducts.map((p) => (
                <tr key={p.id}>
                  <th scope="row">{p.id}</th>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.category || "-"}</td>
                  <td>{p.supplier_name || "-"}</td>
                  <td>{p.stock_on_hand}</td>
                  <td>{p.min_stock_level}</td>
                  <td>{p.unit_price}</td>
                  <td>{p.unit_cost}</td>
                  <td>
                    <button
                      className="btn btn-white btn-outline-secondary me-2"
                      type="button"
                      onClick={() => {
                        setShowAdd(false);
                        setEditingProduct(p);
                      }}
                      disabled={isReadOnly}
                      title={isReadOnly ? "Staff cannot edit products" : "Edit"}
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => handleDelete(p)}
                      disabled={isReadOnly}
                      title={isReadOnly ? "Staff cannot delete products" : "Delete"}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && sortedProducts.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-4">
                    No products found
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

export default Inventory;