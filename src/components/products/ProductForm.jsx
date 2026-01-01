import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Save, ScanBarcode, Camera } from "lucide-react"; // ✅ Camera Icon Added
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import BarcodeScanner from "../common/BarcodeScanner"; // ✅ Scanner Import

export default function ProductForm({ onClose, onSave, initial }) {
  const { addOrUpdateProduct, products } = useStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const stockInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const barcodeInputRef = useRef(null);

  // ✅ Camera State
  const [showScanner, setShowScanner] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    barcode: "",
    category: "General",
    unit: "pcs",
    stock: "",
    costPrice: "",
    sellPrice: "",
    gstPercent: "", // ✅ GST Field
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
        setForm({
            ...p,
            gstPercent: p.gstPercent || 0 // Load existing GST or default to 0
        });
      }
    }
  }, [initial, id, products]);

  const isEdit = !!(initial || id);

  // ✅ AUTO-FILL LOGIC: Common Logic for Finding Product (Scanner & Input both use this)
  const processBarcode = (code) => {
    if (!code) return;

    // Find product in database
    const foundProduct = products.find(p => p.barcode === code);

    if (foundProduct) {
      // 1. Existing Product Found: Auto-fill details
      setForm({
        ...foundProduct,
        stock: 0, // Reset stock to 0 for adding NEW stock
        id: foundProduct.id, // Keep ID to update existing product
        _id: undefined,
        gstPercent: foundProduct.gstPercent || 0
      });
      toast.success(`Product found: ${foundProduct.name}. Enter new stock.`);
      // Focus on Stock input
      setTimeout(() => stockInputRef.current?.focus(), 100);
    } else {
      // 2. New Product
      setForm(prev => ({ 
          ...prev, 
          barcode: code,
          name: "", 
          category: "General", 
          unit: "pcs", 
          stock: "", 
          costPrice: "", 
          sellPrice: "", 
          gstPercent: "" 
      }));
      toast.info("New Product detected! Please enter details.");
      // Focus on Name input
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  };

  // ✅ Keyboard Input Handler
  const handleInputScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = e.target.value.trim();
      processBarcode(code);
    }
  };

  // ✅ Camera Scan Handler
  const handleCameraScan = (code) => {
    setShowScanner(false); // Close camera modal
    processBarcode(code);  // Process the scanned code
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
      // Duplicate Check (only for new products creation, not updates)
      if (!form.id && products) {
        const exists = products.find(
          (p) => p.name.toLowerCase().trim() === form.name.toLowerCase().trim()
        );

        if (exists && exists.barcode !== form.barcode) {
          toast.error("Product name already exists with a different barcode!");
          return;
        }
      }

      // Stock Calculation Logic
      let finalForm = { ...form };
      if (form.id) {
          
          const oldProduct = products.find(p => p.id === form.id);
          if (oldProduct) {
            
          }
      }

      if (onSave) {
        onSave(finalForm);
      } else {
        addOrUpdateProduct(finalForm);
      }

      toast.success(form.id ? "Product Updated!" : "Product Added!");

      if (onClose) onClose();
      else navigate("/products");
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      
      {/*  Show Scanner Modal if active */}
      {showScanner && (
        <BarcodeScanner 
          onScanSuccess={handleCameraScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      <div className="bg-card rounded-xl w-full max-w-lg shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground">
            {form.id ? "Update Product" : "Add New Product"}
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
          
          {/*  SCANNER INPUT SECTION */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
             <ScanBarcode className="text-indigo-600 dark:text-indigo-400" size={24} />
             <div className="flex-1">
                <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                    Scan Barcode First
                </label>
                <div className="flex gap-2">
                    <input
                        ref={barcodeInputRef}
                        value={form.barcode}
                        onChange={(e) => change("barcode", e.target.value)}
                        onKeyDown={handleInputScan}
                        className="flex-1 bg-transparent border-b border-indigo-300 outline-none text-lg font-medium text-foreground placeholder-muted-foreground/50 focus:border-indigo-600"
                        placeholder="Scan or type & hit Enter..."
                        autoFocus
                    />
                    {/* Camera Button */}
                    <button 
                        onClick={() => setShowScanner(true)}
                        className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        title="Open Camera"
                    >
                        <Camera size={20} />
                    </button>
                </div>
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
              <div className="text-sm text-foreground mb-1 font-bold text-indigo-600">
                 {form.id ? "Update Stock" : "Stock"}
              </div>
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

          {/*  New Row: GST Selection & Reorder Point */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
                <div className="text-sm font-medium text-foreground mb-1">GST %</div>
                <select
                    value={form.gstPercent}
                    onChange={(e) => change("gstPercent", Number(e.target.value))}
                    className="w-full border border-input px-3 py-2 rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="0">0% (None)</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                </select>
            </label>

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