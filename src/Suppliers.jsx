import "./Inventory.css";
import { useEffect, useState } from "react";
import AddProductForm from "./AddProductForm";
import EditProductForm from "./EditProductForm";

function Suppliers() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);

  async function loadProducts(q = "") {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (q.trim()) params.set("search", q.trim());

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

  async function handleDelete(product) {
    const ok = confirm(`Delete "${product.name}"?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
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
      <h1 className="display-4">Suppliers</h1>

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
              onClick={() => {
                setEditingProduct(null);
                setShowAdd(true);
              }}
            >
              Add Product
            </button>
          </div>
        </div>

        {showAdd && (
          <AddProductForm
            onClose={() => setShowAdd(false)}
            onCreated={() => loadProducts(search)}
          />
        )}

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
                <th scope="col">#</th>
                <th scope="col">SKU</th>
                <th scope="col">Name</th>
                <th scope="col">Category</th>
                <th scope="col">Stock</th>
                <th scope="col">Min Stock</th>
                <th scope="col">Unit Price</th>
                <th scope="col">Cost</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p, idx) => (
                <tr key={p.id}>
                  <th scope="row">{idx + 1}</th>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.category || "-"}</td>
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
                      title="Edit"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => handleDelete(p)}
                      title="Delete"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
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

export default Suppliers;
