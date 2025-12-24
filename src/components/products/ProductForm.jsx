import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Save, ScanBarcode } from "lucide-react"; // Added ScanBarcode
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";

export default function ProductForm({ onClose, onSave, initial }) {
  const { addOrUpdateProduct, products } = useStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  // Refs for focus management
  const stockInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    barcode: "", // Added barcode field
    category: "General",
    unit: "pcs",
    stock: 0,
    costPrice: 0,
    sellPrice: 0,
    reorder: 5,
  });

  const [errors, setErrors] = useState({});

  // Load Data safely
  useEffect(() => {
    if (initial) {
      setForm(initial);
    } else if (id && products && products.length > 0) {
      const p = products.find((x) => x.id === id);
      if (p) {
        setForm(p);
      }
    }
  }, [initial, id, products]);

  const isEdit = !!(initial || id);

  // Barcode Scan Logic
  const handleScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      const code = e.target.value.trim();
      if (!code) return;

      // Find product in database
      const foundProduct = products.find(p => p.barcode === code);

      if (foundProduct) {
        // 1. Existing Product Found
        setForm({
            ...foundProduct,
            stock: 0, // Reset stock to 0 for adding new stock
            id: undefined, // Remove ID to prevent overwriting (unless intended)
            _id: undefined 
        });
        toast.success("Product found! Enter new stock.");
        // Focus on Stock input
        if (stockInputRef.current) stockInputRef.current.focus();

      } else {
        // 2. New Product
        setForm(prev => ({ ...prev, barcode: code }));
        toast.info("New Product detected! Please enter details.");
        // Focus on Name input
        if (nameInputRef.current) nameInputRef.current.focus();
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name || !form.name.trim()) newErrors.name = "Product name is required";
    if (!form.category || !form.category.trim()) newErrors.category = "Category is required";
    if (form.stock < 0) newErrors.stock = "Stock cannot be negative";
    if (form.costPrice < 0) newErrors.costPrice = "Cost price cannot be negative";
    if (form.sellPrice < 0) newErrors.sellPrice = "Sell price cannot be negative";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const change = (key, val) => {
    setForm((s) => ({ ...s, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const handleSubmit = () => {
    if (validate()) {
      // Duplicate Check (only for new products)
      if (!isEdit && products) {
        const exists = products.find(
          (p) => p.name.toLowerCase().trim() === form.name.toLowerCase().trim()
        );

        // Allow same name only if barcodes are different (e.g. variants)
        // Or strictly block duplicate names based on your requirement
        if (exists && exists.barcode !== form.barcode) {
             toast.error("Product name already exists!");
             return;
        }
      }

      // Save Logic
      if (onSave) {
        onSave(form);
      } else {
        addOrUpdateProduct(form);
      }

      // Success Message & Navigation
      toast.success(isEdit ? "Product Updated!" : "Product Added!");
      
      if (onClose) onClose();
      else navigate("/products");
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl w-full max-w-lg shadow-2xl border border-border">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground">
            {isEdit ? "Edit Product" : "Add Stock / New Product"}
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

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* SCANNER INPUT SECTION */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
             <ScanBarcode className="text-indigo-600 dark:text-indigo-400" size={24} />
             <div className="flex-1">
                <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                    Scan Barcode First
                </label>
                <input
                    value={form.barcode}
                    onChange={(e) => change("barcode", e.target.value)}
                    onKeyDown={handleScan}
                    className="w-full bg-transparent border-none outline-none text-lg font-medium text-foreground placeholder-muted-foreground/50"
                    placeholder="Scan or type barcode & hit Enter..."
                    autoFocus
                />
             </div>
          </div>

          <label className="block">
            <div className="text-sm font-medium text-foreground mb-1">Product Name</div>
            <input
              ref={nameInputRef} // Added ref
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
              className={`w-full border px-3 py-2 rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/50 ${
                errors.name ? "border-destructive" : "border-input"
              }`}
              placeholder="e.g., Basmati Rice"
            />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm font-medium text-foreground mb-1">Category</div>
              <input
                value={form.category}
                onChange={(e) => change("category", e.target.value)}
                className={`w-full border px-3 py-2 rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.category ? "border-destructive" : "border-input"
                }`}
              />
              {errors.category && <p className="text-destructive text-xs mt-1">{errors.category}</p>}
            </label>

            <label className="block">
              <div className="text-sm font-medium text-foreground mb-1">Unit</div>
              <input
                value={form.unit}
                onChange={(e) => change("unit", e.target.value)}
                className="w-full border border-input px-3 py-2 rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="pcs, kg, box"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Cost Price */}
            <label className="block">
              <div className="text-sm text-foreground mb-1">Cost ₹</div>
              <input
                type="number"
                value={form.costPrice}
                onChange={(e) => change("costPrice", Number(e.target.value))}
                className="w-full border border-input px-3 py-2 rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>

            {/* Stock with Ref */}
            <label className="block">
              <div className="text-sm text-foreground mb-1 font-bold text-indigo-600">Stock</div>
              <input
                ref={stockInputRef} // Added ref
                type="number"
                value={form.stock}
                onChange={(e) => change("stock", Number(e.target.value))}
                className={`w-full border px-3 py-2 rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.stock ? "border-destructive" : "border-input"
                }`}
              />
            </label>

            {/* Sell Price */}
            <label className="block">
              <div className="text-sm text-foreground mb-1 font-bold text-green-600">Sell ₹</div>
              <input
                type="number"
                value={form.sellPrice}
                onChange={(e) => change("sellPrice", Number(e.target.value))}
                className="w-full border border-input px-3 py-2 rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>
          </div>

          <label className="block">
            <div className="text-sm font-medium text-foreground mb-1">Reorder Point</div>
            <input
              type="number"
              value={form.reorder}
              onChange={(e) => change("reorder", Number(e.target.value))}
              className="w-full border border-input px-3 py-2 rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={() => {
              if (onClose) onClose();
              else navigate("/products");
            }}
            className="px-4 py-2 border border-input rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Save className="w-5 h-5" />
            {isEdit ? "Save Changes" : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}