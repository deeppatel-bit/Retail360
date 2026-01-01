import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Save, ScanBarcode, Camera } from "lucide-react"; 
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import BarcodeScanner from "../common/BarcodeScanner"; 

export default function ProductForm({ onClose, onSave, initial }) {
  const { addOrUpdateProduct, products } = useStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const stockInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const barcodeInputRef = useRef(null);

  // Camera State
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
    gstPercent: 0, 
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
            stock: p.stock !== undefined ? p.stock : "", 
            costPrice: p.costPrice !== undefined ? p.costPrice : "",
            sellPrice: p.sellPrice !== undefined ? p.sellPrice : "",
            gstPercent: p.gstPercent || 0 
        });
      }
    }
  }, [initial, id, products]);

  const isEdit = !!(initial || id || form.id); // form.id check added specifically for scan case

  // ✅ NEW LOGIC: Scan to Increment Quantity
  const processBarcode = (code) => {
    if (!code) return;

    // 1. Check if product exists in database
    const foundProduct = products.find(p => p.barcode === code);

    if (foundProduct) {
      // Logic: જો પ્રોડક્ટ મળે તો Quantity વધારવી
      
      // ચેક કરો કે શું અત્યારે ફોર્મમાં આ જ પ્રોડક્ટ લોડ થયેલી છે?
      if (form.id === foundProduct.id) {
         // જો હા, તો ખાલી સ્ટોક વધારો (Increment existing input)
         const currentStock = Number(form.stock) || 0;
         setForm(prev => ({ ...prev, stock: currentStock + 1 }));
         toast.success(`Stock incremented: ${currentStock + 1}`);
      } else {
         // જો ના (મતલબ નવી પ્રોડક્ટ સ્કેન કરી), તો પ્રોડક્ટ લોડ કરો અને સ્ટોક = જૂનો સ્ટોક + 1 કરો
         const dbStock = Number(foundProduct.stock) || 0;
         setForm({
            ...foundProduct,
            id: foundProduct.id,
            _id: undefined, // Avoid conflict if using MongoDB _id
            stock: dbStock + 1, // જૂનો સ્ટોક + 1
            gstPercent: foundProduct.gstPercent || 0
         });
         toast.success(`Product found: ${foundProduct.name}. Stock updated to ${dbStock + 1}`);
      }
      
      // ફોકસ સ્ટોક પર રાખો જેથી મેન્યુઅલી બદલવું હોય તો બદલી શકાય
      setTimeout(() => stockInputRef.current?.focus(), 100);

    } else {
      // 2. New Product Logic (જો પ્રોડક્ટ ન મળે તો નવી એન્ટ્રી)
      setForm(prev => ({ 
          ...prev, 
          barcode: code,
          name: "", 
          category: "General", 
          unit: "pcs", 
          stock: "", 
          costPrice: "", 
          sellPrice: "", 
          gstPercent: 0,
          id: undefined // Clear ID implies new product
      }));
      toast.info("New Product detected! Please enter details.");
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  };

  const handleInputScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = e.target.value.trim();
      processBarcode(code);
      // Optional: Clear input if you want to scan continuously without backspace
      // but usually for form logic, we keep the barcode visible
    }
  };

  const handleCameraScan = (code) => {
    setShowScanner(false); 
    processBarcode(code);  
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name || !form.name.trim()) newErrors.name = "Product name is required";
    if (!form.category || !form.category.trim()) newErrors.category = "Category is required";
    
    if (Number(form.stock) < 0) newErrors.stock = "Stock cannot be negative";
    if (Number(form.costPrice) < 0) newErrors.costPrice = "Cost price cannot be negative";
    if (Number(form.sellPrice) < 0) newErrors.sellPrice = "Sell price cannot be negative";

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
      if (!form.id && products) {
        const exists = products.find(
          (p) => p.name.toLowerCase().trim() === form.name.toLowerCase().trim()
        );
        if (exists && exists.barcode !== form.barcode) {
          toast.error("Product name already exists with a different barcode!");
          return;
        }
      }

      const finalForm = {
          ...form,
          stock: Number(form.stock) || 0,
          costPrice: Number(form.costPrice) || 0,
          sellPrice: Number(form.sellPrice) || 0
      };

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
            {/* Logic change to show Update if ID exists */}
            {form.id ? "Update Product / Stock" : "Add New Product"}
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
          
          {/* Scanner Input */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
             <ScanBarcode className="text-indigo-600 dark:text-indigo-400" size={24} />
             <div className="flex-1">
                <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                    Scan to Add Stock
                </label>
                <div className="flex gap-2">
                    <input
                        ref={barcodeInputRef}
                        value={form.barcode}
                        onChange={(e) => change("barcode", e.target.value)}
                        onKeyDown={handleInputScan}
                        className="flex-1 bg-transparent border-b border-indigo-300 outline-none text-lg font-medium text-foreground placeholder-muted-foreground/50 focus:border-indigo-600"
                        placeholder="Scan item..."
                        autoFocus
                    />
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
              ref={nameInputRef}
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
                onChange={(e) => change("costPrice", e.target.value)}
                className="w-full border border-input px-3 py-2 rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="0.00"
              />
            </label>

            {/* Stock */}
            <label className="block">
              <div className="text-sm text-foreground mb-1 font-bold text-indigo-600">
                 Stock (+1 on Scan)
              </div>
              <input
                ref={stockInputRef}
                type="number"
                value={form.stock}
                onChange={(e) => change("stock", e.target.value)}
                className={`w-full border px-3 py-2 rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.stock ? "border-destructive" : "border-input"
                }`}
                placeholder="0" 
              />
            </label>

            {/* Sell Price */}
            <label className="block">
              <div className="text-sm text-foreground mb-1 font-bold text-green-600">Sell ₹</div>
              <input
                type="number"
                value={form.sellPrice}
                onChange={(e) => change("sellPrice", e.target.value)}
                className="w-full border border-input px-3 py-2 rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="0.00"
              />
            </label>
          </div>

          {/* GST Selection & Reorder Point */}
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
            {isEdit ? "Update Stock / Product" : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}