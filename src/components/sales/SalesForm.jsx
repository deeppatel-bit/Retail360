import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, AlertCircle, ScanBarcode } from "lucide-react";
import { useToast } from "../../context/ToastContext";

import { useStore } from "../../context/StoreContext";
import SearchableDropdown from "../common/SearchableDropdown";

export default function SalesForm({ editMode }) {
  const { products, addSale, updateSale, sales, ledgers, addLedger } = useStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [barcodeInput, setBarcodeInput] = useState("");

  const [initial, setInitial] = useState(null);
  useEffect(() => {
    if (editMode && id) {
      const s = sales.find((x) => x.saleId === id);
      if (s) setInitial(s);
    }
  }, [editMode, id, sales]);

  const [customerName, setCustomerName] = useState(initial?.customerName || "");
  const [date, setDate] = useState(
    initial
      ? new Date(initial.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );

  const [lines, setLines] = useState(
    initial?.lines || [{ productId: "", qty: 1, price: 0, taxPercent: 0, discountPercent: 0 }]
  );

  const [taxPercent, setTaxPercent] = useState(initial?.taxPercent || 0);
  const [discountPercent, setDiscountPercent] = useState(
    initial?.discountPercent || 0
  );
  const [notes, setNotes] = useState(initial?.notes || "");

  const [amountPaid, setAmountPaid] = useState(initial?.amountPaid || 0);
  const [paymentMode, setPaymentMode] = useState(
    initial?.paymentMode || "Cash"
  );

  useEffect(() => {
    if (initial) {
      setCustomerName(initial.customerName || "");
      setDate(new Date(initial.date).toISOString().slice(0, 10));
      
      const loadedLines = (initial.lines || []).map((ln) => ({
        ...ln,
        price:
          ln.price !== undefined
            ? ln.price
            : products.find((p) => p.id === ln.productId)?.sellPrice || 0,
        taxPercent: ln.taxPercent || 0,
        discountPercent: ln.discountPercent || 0,
      }));
      setLines(loadedLines);
      setNotes(initial.notes || "");
      setAmountPaid(initial.amountPaid || 0);
      setPaymentMode(initial.paymentMode || "Cash");
    } 
    // eslint-disable-next-line
  }, [initial, products]);

  // ✅ FIX 1: Dropdown માંથી સિલેક્ટ કરતા GST આવે
  function changeLine(i, key, val) {
    setLines((s) =>
      s.map((ln, idx) => {
        if (idx !== i) return ln;
        const newLn = { ...ln, [key]: val };
        
        if (key === "productId") {
          const p = products.find((x) => x.id === val);
          if (p) {
             newLn.price = p.sellPrice;
             // ✅ Auto-fetch GST from Product
             newLn.taxPercent = p.gstPercent || 0; 
          } else {
             newLn.price = 0;
             newLn.taxPercent = 0;
          }
        }
        return newLn;
      })
    );
  }

  function addLine() {
    setLines((s) => [
      ...s,
      { productId: "", qty: 1, price: 0, taxPercent: 0, discountPercent: 0 },
    ]);
  }

  function removeLine(idx) {
    setLines((s) => s.filter((_, i) => i !== idx));
  }

  // ✅ FIX 2: Barcode Scan કરતા GST આવે
  const handleBarcodeScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); 

      const product = products.find(
        (p) =>
          p.id === barcodeInput ||
          p.name.toLowerCase() === barcodeInput.toLowerCase() ||
          p.barcode === barcodeInput // Barcode match check
      );

      if (product) {
        const existingIndex = lines.findIndex(
          (ln) => ln.productId === product.id
        );

        if (existingIndex >= 0) {
          const updatedLines = [...lines];
          updatedLines[existingIndex].qty += 1;
          setLines(updatedLines);
          toast.success(`Quantity increased for ${product.name}`);
        } else {
          if (lines.length === 1 && !lines[0].productId) {
            setLines([
              {
                productId: product.id,
                qty: 1,
                price: product.sellPrice,
                taxPercent: product.gstPercent || 0, // ✅ Auto GST
                discountPercent: 0,
              },
            ]);
          } else {
            setLines((prev) => [
              ...prev,
              {
                productId: product.id,
                qty: 1,
                price: product.sellPrice,
                taxPercent: product.gstPercent || 0, // ✅ Auto GST
                discountPercent: 0,
              },
            ]);
          }
          toast.success(`${product.name} added!`);
        }
        setBarcodeInput(""); 
      } else {
        toast.error("Product not found!");
      }
    }
  };

  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let totalQty = 0;

  lines.forEach((ln) => {
    const qty = Number(ln.qty || 0);
    const price = Number(ln.price || 0);
    const lineAmount = qty * price;
    const lineDisc = (lineAmount * Number(ln.discountPercent || 0)) / 100;
    const lineTax =
      ((lineAmount - lineDisc) * Number(ln.taxPercent || 0)) / 100;

    subtotal += lineAmount;
    totalDiscount += lineDisc;
    totalTax += lineTax;
    totalQty += qty;
  });

  const total = subtotal - totalDiscount + totalTax;

  // ✅ Main Save Function
  async function handleSave() {
    if (!customerName) return toast.error("Customer required");
    if (!lines.length) return toast.error("Add lines");
    for (const ln of lines) {
      if (!ln.productId) return toast.error("Choose product in each line");
    }

    const existingLedger = ledgers.find(l => l.name.toLowerCase() === customerName.toLowerCase());
    
    if (!existingLedger) {
        try {
            if (addLedger) {
                await addLedger({ name: customerName, type: "Customer" });
                toast.success(`New Ledger created for ${customerName}`);
            }
        } catch (error) {
            console.error("Failed to create ledger automatically", error);
        }
    }

    let paymentStatus = "Unpaid";
    if (Number(amountPaid) >= total) {
      paymentStatus = "Paid";
    } else if (Number(amountPaid) > 0) {
      paymentStatus = "Partial";
    }
    const balanceDue = Math.max(0, total - Number(amountPaid));

    const payload = {
      customerName,
      date: new Date(date).toISOString(),
      lines,
      taxPercent,
      discountPercent,
      notes,
      amountPaid,
      paymentMode,
      paymentStatus,
      balanceDue,
      total: total // ✅ Correctly saving Total Amount
    };

    if (editMode && id) {
      if (initial && initial.id) {
          updateSale(initial.id, payload);
          toast.success("Sale updated successfully");
      } else {
          toast.error("Error: Sale ID not found");
      }
    } else {
      addSale(payload);
      toast.success("Sale recorded successfully");
    }
    navigate("/sales");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          {editMode ? "Edit Sale" : "New Sale"}
        </h2>
      </div>

      <div className="bg-card p-6 rounded-xl shadow-lg border border-border space-y-6">
        
        {/* Barcode Scanner */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-center gap-4">
            <ScanBarcode className="text-indigo-600 dark:text-indigo-400" size={24} />
            <div className="flex-1">
                <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                    Scan Barcode / Product Name
                </label>
                <input
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeScan}
                    className="w-full bg-transparent border-none outline-none text-lg font-medium text-foreground placeholder-muted-foreground/50"
                    placeholder="Scan product barcode here and press Enter..."
                    autoFocus
                />
            </div>
        </div>

        {/* Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Customer Name
            </label>
            <div className="relative">
              <SearchableDropdown
                options={ledgers.map((l) => ({ value: l.name, label: l.name }))}
                value={customerName}
                onChange={(val) => setCustomerName(val)}
                placeholder="Select or Type New Customer..."
                allowCustomValue={true}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Notes
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-background text-foreground"
              placeholder="Optional notes"
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
                <th className="px-4 py-3 w-[15%]">Price</th>
                <th className="px-4 py-3 w-[10%]">Qty</th>
                <th className="px-4 py-3 w-[10%]">Disc %</th>
                <th className="px-4 py-3 w-[10%]">Tax %</th>
                <th className="px-4 py-3 w-[15%] text-right">Total</th>
                <th className="px-4 py-3 w-[10%] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lines.map((ln, i) => {
                const p = products.find((x) => x.id === ln.productId);
                const stock = p ? p.stock : 0;
                
                const isLowStock = p && stock < Number(ln.qty);

                return (
                  <tr key={i} className="hover:bg-accent/50">
                    <td className="px-4 py-2">
                      <SearchableDropdown
                        options={products.map((p) => ({
                          value: p.id,
                          label: p.name,
                        }))}
                        value={ln.productId}
                        onChange={(val) => changeLine(i, "productId", val)}
                        placeholder="Search product..."
                      />
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {p ? (
                        <span
                          className={
                            stock === 0
                              ? "text-destructive font-bold"
                              : "text-muted-foreground"
                          }
                        >
                          {stock} {p.unit}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={ln.price}
                        onChange={(e) =>
                          changeLine(i, "price", Number(e.target.value))
                        }
                        className="w-full border border-input px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="relative">
                        <input
                          type="number"
                          value={ln.qty}
                          onChange={(e) =>
                            changeLine(i, "qty", Number(e.target.value))
                          }
                          className={`w-full border px-3 py-2 rounded-lg focus:ring-2 outline-none bg-background text-foreground ${
                            isLowStock
                              ? "border-destructive focus:ring-destructive/50"
                              : "border-input focus:ring-indigo-500"
                          }`}
                          min="1"
                        />
                        {isLowStock && (
                          <div className="absolute -top-6 left-0 bg-destructive/10 text-destructive text-xs px-2 py-1 rounded shadow flex items-center gap-1">
                            <AlertCircle size={12} /> Exceeds stock
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={ln.discountPercent}
                        onChange={(e) =>
                          changeLine(i, "discountPercent", Number(e.target.value))
                        }
                        className="w-full border border-input px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={ln.taxPercent}
                        onChange={(e) =>
                          changeLine(i, "taxPercent", Number(e.target.value))
                        }
                        className="w-full border border-input px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-foreground">
                      ₹{" "}
                      {(
                        Number(ln.qty || 0) * Number(ln.price || 0) -
                        (Number(ln.qty || 0) *
                          Number(ln.price || 0) *
                          Number(ln.discountPercent || 0)) /
                          100 +
                        ((Number(ln.qty || 0) * Number(ln.price || 0) -
                          (Number(ln.qty || 0) *
                            Number(ln.price || 0) *
                            Number(ln.discountPercent || 0)) /
                            100) *
                          Number(ln.taxPercent || 0)) /
                          100
                      ).toFixed(2)}
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
                  </tr>
                );
              })}
              {lines.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No items added. Use the barcode scanner or click "Add Item".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="bg-muted/30 px-4 py-3 border-t border-border flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Total Items:{" "}
              <span className="font-semibold text-foreground">
                {lines.length}
              </span>{" "}
              | Total Qty:{" "}
              <span className="font-semibold text-foreground">{totalQty}</span>
            </div>
            <button
              onClick={addLine}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-input text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-accent transition-colors font-medium shadow-sm"
            >
              <Plus size={18} /> Add Item
            </button>
          </div>
        </div>

        {/* Footer Totals */}
        <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-8 pt-4 border-t border-border">
          <div className="w-full md:w-64 space-y-3"></div>

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
            <div className="border-t border-border pt-2 mt-2 flex justify-between text-xl font-bold text-indigo-700 dark:text-indigo-300">
              <span>Total:</span>
              <span>₹ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Details Section */}
        <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-3">
            Payment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Amount Paid
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₹
                </span>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full border-input border pl-8 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground"
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
            Balance Due:{" "}
            <span className="text-destructive">
              ₹ {Math.max(0, total - amountPaid).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => navigate("/sales")}
            className="px-6 py-2.5 border border-input text-foreground rounded-lg hover:bg-accent font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
          >
            {editMode ? "Save Changes" : "Complete Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}