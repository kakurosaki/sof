import { useEffect, useState } from "react";

export default function AddProductForm({ onCreated, onClose, embedded = false }) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [suppliers, setSuppliers] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await fetch("/api/suppliers");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load suppliers");
        setSuppliers(data.data || []);
      } catch (_err) {
        setSuppliers([]);
      }
    }

    loadSuppliers();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      sku: sku.trim(),
      name: name.trim(),
      category: category.trim() || null,
      supplier_id: supplierId ? parseInt(supplierId, 10) : null,
      unit_price: Number(unitPrice || 0),
      unit_cost: Number(unitCost || 0),
      stock_on_hand: parseInt(stock || "0", 10),
      min_stock_level: parseInt(minStock || "0", 10),
    };

    if (!payload.sku || !payload.name) {
      setSaving(false);
      setError("SKU and Name are required.");
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create product");

      onCreated?.(data);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const formContent = (
    <>
      {error && <div className="alert alert-danger py-2 mt-2 mb-0">{error}</div>}

      <form className="row g-2 mt-2" onSubmit={handleSubmit}>
        <div className="col-md-4">
          <label className="form-label">SKU *</label>
          <input className="form-control" value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>

        <div className="col-md-8">
          <label className="form-label">Name *</label>
          <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="col-md-6">
          <label className="form-label">Category</label>
          <input
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Supplier</label>
          <select
            className="form-select"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">No supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label">Unit Price</label>
          <input
            className="form-control"
            type="number"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Unit Cost</label>
          <input
            className="form-control"
            type="number"
            step="0.01"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Stock</label>
          <input
            className="form-control"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Min Stock</label>
          <input
            className="form-control"
            type="number"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
          />
        </div>

        <div className="col-12 d-flex gap-2 mt-2">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Add"}
          </button>
        </div>
      </form>
    </>
  );

  if (embedded) return formContent;

  return (
    <div className="border rounded p-3 bg-white mx-4 mb-3">
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="h5 mb-0">Add Product</h2>
        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {formContent}
    </div>
  );
}