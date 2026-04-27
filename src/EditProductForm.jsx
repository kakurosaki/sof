import { useEffect, useState } from "react";
import { useToast } from "./ToastContext";

export default function EditProductForm({ product, onUpdated, onClose }) {
  const [form, setForm] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { notify } = useToast();

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

  useEffect(() => {
    if (!product) return;

    setForm({
      sku: product.sku ?? "",
      name: product.name ?? "",
      category: product.category ?? "",
      supplier_id: product.supplier_id ?? "",
      unit_price: product.unit_price ?? 0,
      unit_cost: product.unit_cost ?? 0,
      stock_on_hand: product.stock_on_hand ?? 0,
      min_stock_level: product.min_stock_level ?? 0,
    });
    setError("");
  }, [product]);

  if (!product || !form) return null;

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      category: form.category.trim() || null,
      supplier_id: form.supplier_id ? parseInt(form.supplier_id, 10) : null,
      unit_price: Number(form.unit_price || 0),
      unit_cost: Number(form.unit_cost || 0),
      stock_on_hand: parseInt(form.stock_on_hand || "0", 10),
      min_stock_level: parseInt(form.min_stock_level || "0", 10),
    };

    if (!payload.sku || !payload.name) {
      setSaving(false);
      setError("SKU and Name are required.");
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update product");

      notify({
        title: "Product updated",
        message: `${data?.name || form.name.trim()} was saved successfully.`,
        variant: "info",
      });
      onUpdated?.(data);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border rounded p-3 bg-white mx-4 mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="h5 mb-0">Edit Product</h2>
        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <form onSubmit={handleSubmit} className="row g-2">
        <div className="col-md-4">
          <label className="form-label">SKU *</label>
          <input
            className="form-control"
            value={form.sku}
            onChange={(e) => setField("sku", e.target.value)}
          />
        </div>

        <div className="col-md-8">
          <label className="form-label">Name *</label>
          <input
            className="form-control"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Category</label>
          <input
            className="form-control"
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Supplier</label>
          <select
            className="form-select"
            value={form.supplier_id ?? ""}
            onChange={(e) => setField("supplier_id", e.target.value)}
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
            type="number"
            step="0.01"
            className="form-control"
            value={form.unit_price}
            onChange={(e) => setField("unit_price", e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Unit Cost</label>
          <input
            type="number"
            step="0.01"
            className="form-control"
            value={form.unit_cost}
            onChange={(e) => setField("unit_cost", e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Stock</label>
          <input
            type="number"
            className="form-control"
            value={form.stock_on_hand}
            onChange={(e) => setField("stock_on_hand", e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Min Stock</label>
          <input
            type="number"
            className="form-control"
            value={form.min_stock_level}
            onChange={(e) => setField("min_stock_level", e.target.value)}
          />
        </div>

        <div className="col-12 d-flex gap-2 mt-2">
          <button className="btn btn-primary" disabled={saving} type="submit">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}