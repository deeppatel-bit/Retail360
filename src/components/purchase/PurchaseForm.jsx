import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../context/ToastContext";
import { useStore } from "../../context/StoreContext";
import SearchableDropdown from "../common/SearchableDropdown";

export default function PurchaseForm({ editMode }) {
  const { products, suppliers, addPurchase, updatePurchase, purchases } = useStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // If editMode, fetch existing purchase
  const [initial, setInitial] = useState(null);

  useEffect(() => {
    if (editMode && id) {
      const p = purchases.find((x) => x.purchaseId === id);
      if (p) setInitial(p);
    }
  }, [editMode, id, purchases]);

  const [supplierName, setSupplierName] = useState(initial?.supplierName || "");
  const [billNo, setBillNo] = useState(initial?.billNo || "");
  const [date, setDate] = useState(
    initial ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );

  // ✅ Initialize lines with empty strings for editable fields
  const [lines, setLines] = useState(
    initial?.lines || [
      { productId: "", qty: "", price: "", taxPercent: "", discountPercent: "" }
    ]
  );

  const [taxPercent, setTaxPercent] = useState(initial?.taxPercent || "");
  const [discountPercent, setDiscountPercent] = useState(initial?.discountPercent || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  // ✅ Payment State (Empty string default)
  const [amountPaid, setAmountPaid] = useState(
    initial?.amountPaid !== undefined ? initial.amountPaid : ""
  );
  const [paymentMode, setPaymentMode] = useState(initial?.paymentMode || "Cash");

  useEffect(() => {
    if (initial) {
      setSupplierName(initial.supplierName || "");
      setBillNo(initial.billNo || "");
      setDate(new Date(initial.date).toISOString().slice(0, 10));
      
      const loadedLines = (initial.lines || []).map((ln) => ({
        ...ln,
        // Keep existing values or fetch from product, but convert 0 to "" if needed (optional, keeping as is for edit)
        price: ln.price !== undefined ? ln.price : (products.find((p) => p.id === ln.productId)?.costPrice || ""),
        qty: ln.qty || "",
        taxPercent: ln.taxPercent || "",
        discountPercent: ln.discountPercent || "",
      }));

      setLines(loadedLines.length ? loadedLines : [{ productId: "", qty: "", price: "", taxPercent: "", discountPercent: "" }]);
      setNotes(initial.notes || "");
      setAmountPaid(initial.amountPaid !== undefined ? initial.amountPaid : "");
      setPaymentMode(initial.paymentMode || "Cash");
    } 
    // eslint-disable-next-line
  }, [initial, products]);

  function changeLine(i, key, val) {
    setLines((s) =>
      s.map((ln, idx) => {
        if (idx !== i) return ln;
        const newLn = { ...ln, [key]: val };
        
        // Auto-fill cost price when product selected
        if (key === "productId") {
          const p = products.find((x) => x.id === val);
          newLn.price = p ? p.costPrice : ""; // Set default price
        }
        return newLn;
      })
    );
  }

  function addLine() {
    setLines((s) => [
      ...s,
      { productId: "", qty: "", price: "", taxPercent: "", discountPercent: "" },
    ]);
  }

  function removeLine(idx) {
    setLines((s) => s.filter((_, i) => i !== idx));
  }

  // Calculate totals (Using Number() to handle empty strings safely)
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let totalQty = 0;

  lines.forEach((ln) => {
    const qty = Number(ln.qty || 0);
    const price = Number(ln.price || 0);
    const disc = Number(ln.discountPercent || 0);
    const tax = Number(ln.taxPercent || 0);

    const lineAmount = qty * price;
    const lineDisc = (lineAmount * disc) / 100;
    const lineTax = ((lineAmount - lineDisc) * tax) / 100;

    subtotal += lineAmount;
    totalDiscount += lineDisc;
    totalTax += lineTax;
    totalQty += qty;
  });

  const total = subtotal - totalDiscount + totalTax;

  function handleSave() {
    if (!supplierName) return toast.error("Supplier required");
    if (!lines.length) return toast.error("Add lines");
    for (const ln of lines) {
      if (!ln.productId) return toast.error("Choose product for each line");
    }

    // Convert empty strings to numbers before saving
    const finalAmountPaid = Number(amountPaid) || 0;
    
    let paymentStatus = "Unpaid";
    if (finalAmountPaid >= total) paymentStatus = "Paid";
    else if (finalAmountPaid > 0) paymentStatus = "Partial";
    
    const balanceDue = Math.max(0, total - finalAmountPaid);

    const cleanLines = lines.map(ln => ({
        ...ln,
        qty: Number(ln.qty) || 0,
        price: Number(ln.price) || 0,
        discountPercent: Number(ln.discountPercent) || 0,
        taxPercent: Number(ln.taxPercent) || 0
    }));

    const payload = {
      supplierName,
      billNo,
      date: new Date(date).toISOString(),
      lines: cleanLines,
      taxPercent: 0, // Global fields deprecated
      discountPercent: 0,
      notes,
      amountPaid: finalAmountPaid,
      paymentMode,
      paymentStatus,
      balanceDue,
    };

   if (editMode && id) {
      // ✅ FIX: જો initial ડેટા હોય તો તેનું સાચું _id વાપરો, નહિતર URL id વાપરો
      const dbId = initial?._id || id; 
      
      // સાચા ID સાથે અપડેટ કરો
      updatePurchase(dbId, payload); 
      
      toast.success("Purchase updated successfully");
    } else {
      addPurchase(payload);
      toast.success("Purchase saved successfully");
    }
    navigate("/purchase");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          {editMode ? "Edit Purchase" : "Add Purchase"}
        </h2>
      </div>

      <div className="bg-card p-6 rounded-xl shadow-lg border border-border space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Supplier</label>
            <SearchableDropdown
              options={suppliers.map((sup) => ({ value: sup.name, label: sup.name }))}
              value={supplierName}
              onChange={(val) => setSupplierName(val)}
              placeholder="Search or select supplier..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Bill No</label>
            <input
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
              className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-background text-foreground"
              placeholder="Bill number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-background text-foreground"
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-foreground font-semibold">
              <tr>
                <th className="px-4 py-3 w-[20%]">Product</th>
                <th className="px-4 py-3 w-[10%]">Stock</th>
                <th className="px-4 py-3 w-[15%]">Cost</th>
                <th className="px-4 py-3 w-[10%]">Qty</th>
                <th className="px-4 py-3 w-[10%]">Disc %</th>
                <th className="px-4 py-3 w-[10%]">Tax %</th>
                <th className="px-4 py-3 w-[15%] text-right">Total</th>
                <th className="px-4 py-3 w-[10%] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <AnimatePresence>
                {lines.map((ln, i) => {
                  const p = products.find((x) => x.id === ln.productId);
                  const stock = p ? p.stock : 0;
                  
                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="hover:bg-accent/50"
                    >
                      <td className="px-4 py-2">
                        <SearchableDropdown
                          options={products.map((p) => ({
                            value: p.id,
                            label: `${p.name} (${p.unit})`,
                          }))}
                          value={ln.productId}
                          onChange={(val) => changeLine(i, "productId", val)}
                          placeholder="Search product..."
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        {p ? `${stock} ${p.unit}` : "-"}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={ln.price}
                          onChange={(e) => changeLine(i, "price", e.target.value)} // ✅ Allow empty string
                          className="w-full border border-input px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-background text-foreground"
                          min="0"
                          step="0.01"
                          placeholder="0.00" // ✅ Placeholder added
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={ln.qty}
                          onChange={(e) => changeLine(i, "qty", e.target.value)} // ✅ Allow empty string
                          className="w-full border border-input px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-background text-foreground"
                          min="1"
                          placeholder="0" // ✅ Placeholder added
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={ln.discountPercent}
                          onChange={(e) => changeLine(i, "discountPercent", e.target.value)} // ✅ Allow empty string
                          className="w-full border border-input px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-background text-foreground"
                          min="0"
                          placeholder="0" // ✅ Placeholder added
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={ln.taxPercent}
                          onChange={(e) => changeLine(i, "taxPercent", e.target.value)} // ✅ Allow empty string
                          className="w-full border border-input px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-background text-foreground"
                          min="0"
                          placeholder="0" // ✅ Placeholder added
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-foreground">
                        ₹ {((Number(ln.qty || 0) * Number(ln.price || 0)) -
                          (Number(ln.qty || 0) * Number(ln.price || 0) * Number(ln.discountPercent || 0)) / 100 +
                          ((Number(ln.qty || 0) * Number(ln.price || 0)) -
                            (Number(ln.qty || 0) * Number(ln.price || 0) * Number(ln.discountPercent || 0)) / 100) *
                            Number(ln.taxPercent || 0) / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => removeLine(i)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                          title="Remove Item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {lines.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-muted-foreground">
                    No items added. Click "Add Item" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="bg-muted/30 px-4 py-3 border-t border-border flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Total Items: <span className="font-semibold text-foreground">{lines.length}</span> | Total Qty: <span className="font-semibold text-foreground">{totalQty}</span>
            </div>
            <button
              onClick={addLine}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors font-medium shadow-sm"
            >
              <Plus size={18} /> Add Item
            </button>
          </div>
        </div>

        {/* Footer Totals */}
        <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-8 pt-4 border-t border-border">
          <div className="w-full md:w-64 space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-input px-3 py-1.5 rounded text-sm bg-background text-foreground"
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg min-w-[250px] space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>₹ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>Total Discount:</span>
              <span>- ₹ {totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>Total Tax:</span>
              <span>+ ₹ {totalTax.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between text-xl font-bold text-emerald-900 dark:text-emerald-300">
              <span>Total:</span>
              <span>₹ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Details Section */}
        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
          <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-300 mb-3">
            Payment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-background text-foreground"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Amount Paid</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)} // ✅ Allow empty string
                  className="w-full border-input border pl-8 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-background text-foreground"
                  placeholder="0.00" // ✅ Placeholder added
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <button
                onClick={() => setAmountPaid(total)}
                className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 rounded text-sm font-medium hover:bg-green-200 dark:hover:bg-green-500/30"
              >
                Full Paid
              </button>
              <button
                onClick={() => setAmountPaid(0)}
                className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 rounded text-sm font-medium hover:bg-red-200 dark:hover:bg-red-500/30"
              >
                Unpaid (Udhar)
              </button>
            </div>
          </div>
          <div className="mt-2 text-right text-sm font-medium text-muted-foreground">
            Balance Due: <span className="text-destructive">₹ {Math.max(0, total - (Number(amountPaid)||0)).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => navigate("/purchase")}
            className="px-6 py-2.5 border border-input text-foreground rounded-lg hover:bg-accent font-medium transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
          >
            {editMode ? "Save Changes" : "Save Purchase"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}