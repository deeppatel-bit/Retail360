import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Save } from "lucide-react";
import { useStore } from "../../context/StoreContext";

export default function ProductForm({ onClose, onSave, initial }) {
  const { addOrUpdateProduct, products } = useStore();
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState(() => {
    if (initial) return initial;
    if (id) {
      const p = products.find(x => x.id === id);
      if (p) return p;
    }
    return {
      name: "",
      category: "General",
      unit: "pcs",
      stock: 0,
      costPrice: 0,
      sellPrice: 0,
      reorder: 5,
    };
  });

  const isEdit = !!(initial || id);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (!form.category.trim()) newErrors.category = "Category is required";
    if (form.stock < 0) newErrors.stock = "Stock cannot be negative";
    if (form.costPrice < 0) newErrors.costPrice = "Cost price cannot be negative";
    if (form.sellPrice < 0) newErrors.sellPrice = "Sell price cannot be negative";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const change = (key, val) => {
    setForm((s) => ({ ...s, [key]: val }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl w-full max-w-lg shadow-2xl border border-border">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h3>

          <button
            onClick={() => {
              if (onClose) onClose();
              else navigate("/products");
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <label>
            <div className="text-sm font-medium text-foreground">Product Name</div>
            <input
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
              className={`mt-1 w-full border px-3 py-2 rounded-lg bg-background text-foreground ${errors.name ? "border-destructive" : "border-input"}`}
              placeholder="e.g., Basmati Rice"
            />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label>
              <div className="text-sm font-medium text-foreground">Category</div>
              <input
                value={form.category}
                onChange={(e) => change("category", e.target.value)}
                className={`mt-1 w-full border px-3 py-2 rounded-lg bg-background text-foreground ${errors.category ? "border-destructive" : "border-input"}`}
              />
              {errors.category && <p className="text-destructive text-xs mt-1">{errors.category}</p>}
            </label>

            <label>
              <div className="text-sm font-medium text-foreground">Unit</div>
              <input
                value={form.unit}
                onChange={(e) => change("unit", e.target.value)}
                className="mt-1 w-full border border-input px-3 py-2 rounded-lg bg-background text-foreground"
                placeholder="pcs, kg, box"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <label>
              <div className="text-sm text-foreground">Stock</div>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => change("stock", Number(e.target.value))}
                className={`mt-1 w-full border px-3 py-2 rounded-lg bg-background text-foreground ${errors.stock ? "border-destructive" : "border-input"}`}
              />
              {errors.stock && <p className="text-destructive text-xs mt-1">{errors.stock}</p>}
            </label>

            <label>
              <div className="text-sm text-foreground">Cost ₹</div>
              <input
                type="number"
                value={form.costPrice}
                onChange={(e) => change("costPrice", Number(e.target.value))}
                className={`mt-1 w-full border px-3 py-2 rounded-lg bg-background text-foreground ${errors.costPrice ? "border-destructive" : "border-input"}`}
              />
              {errors.costPrice && <p className="text-destructive text-xs mt-1">{errors.costPrice}</p>}
            </label>

            <label>
              <div className="text-sm text-foreground">Sell ₹</div>
              <input
                type="number"
                value={form.sellPrice}
                onChange={(e) => change("sellPrice", Number(e.target.value))}
                className={`mt-1 w-full border px-3 py-2 rounded-lg bg-background text-foreground ${errors.sellPrice ? "border-destructive" : "border-input"}`}
              />
              {errors.sellPrice && <p className="text-destructive text-xs mt-1">{errors.sellPrice}</p>}
            </label>
          </div>

          <label>
            <div className="text-sm font-medium text-foreground">Reorder Point</div>
            <input
              type="number"
              value={form.reorder}
              onChange={(e) => change("reorder", Number(e.target.value))}
              className="mt-1 w-full border border-input px-3 py-2 rounded-lg bg-background text-foreground"
            />
          </label>
        </div>

        <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3">
          <button
            onClick={() => {
              if (onClose) onClose();
              else navigate("/products");
            }}
            className="px-4 py-2 border border-input rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (validate()) {
                if (onSave) onSave(form);
                else addOrUpdateProduct(form);
                navigate("/products");
              }
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 hover:bg-primary/90"
          >
            <Save className="w-5 h-5" />
            {isEdit ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
