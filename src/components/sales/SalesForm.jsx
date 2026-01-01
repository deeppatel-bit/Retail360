import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, AlertCircle, ScanBarcode, Camera } from "lucide-react"; 
import { useToast } from "../../context/ToastContext";
import { useStore } from "../../context/StoreContext";
import SearchableDropdown from "../common/SearchableDropdown";
import BarcodeScanner from "../common/BarcodeScanner"; 

export default function SalesForm({ editMode }) {
  const { products, addSale, updateSale, sales, ledgers, addLedger } = useStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [barcodeInput, setBarcodeInput] = useState("");
  const [showScanner, setShowScanner] = useState(false); 
  const barcodeInputRef = useRef(null); 

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

  // ✅ Default empty strings for inputs
  const [lines, setLines] = useState(
    initial?.lines || [
      { productId: "", qty: "", price: "", taxPercent: "", discountPercent: "" }
    ]
  );

  const [taxPercent, setTaxPercent] = useState(initial?.taxPercent || "");
  const [discountPercent, setDiscountPercent] = useState(initial?.discountPercent || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  
  // ✅ Amount Paid default empty
  const [amountPaid, setAmountPaid] = useState(
    initial?.amountPaid !== undefined ? initial.amountPaid : ""
  );
  const [paymentMode, setPaymentMode] = useState(initial?.paymentMode || "Cash");

  useEffect(() => {
    if (initial) {
      setCustomerName(initial.customerName || "");
      setDate(new Date(initial.date).toISOString().slice(0, 10));
      
      const loadedLines = (initial.lines || []).map((ln) => ({
        ...ln,
        price: ln.price !== undefined ? ln.price : (products.find((p) => p.id === ln.productId)?.sellPrice || ""),
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

  // MAIN SCAN LOGIC
  const processScannedCode = (code) => {
    if (!code) return;

    const product = products.find(
      (p) =>
        p.barcode === code || 
        p.id === code ||
        p.name.toLowerCase() === code.toLowerCase()
    );

    if (!product) {
      toast.error(`Product not found! (Code: ${code})`);
      return;
    }

    if (Number(product.stock) <= 0) {
        toast.error(`Out of Stock! (${product.name})`);
        return;
    }

    const existingIndex = lines.findIndex((ln) => ln.productId === product.id);

    if (existingIndex >= 0) {
      const currentQty = Number(lines[existingIndex].qty) || 0;
      if (currentQty + 1 > product.stock) {
          toast.error(`Not enough stock for ${product.name}!`);
          return;
      }

      const updatedLines = [...lines];
      updatedLines[existingIndex].qty = currentQty + 1;
      setLines(updatedLines);
      toast.success(`Qty increased: ${product.name}`);
    } else {
      const newLine = {
        productId: product.id,
        qty: 1,
        price: product.sellPrice,        
        taxPercent: product.gstPercent || "", 
        discountPercent: "",
      };

      if (lines.length === 1 && !lines[0].productId) {
        setLines([newLine]);
      } else {
        setLines((prev) => [...prev, newLine]);
      }
      toast.success(`${product.name} added!`);
    }
    
    setBarcodeInput(""); 
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };

  const handleInputScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      processScannedCode(e.target.value.trim());
    }
  };

  const handleCameraScan = (code) => {
    setShowScanner(false); 
    processScannedCode(code); 
  };

  function changeLine(i, key, val) {
    setLines((s) =>
      s.map((ln, idx) => {
        if (idx !== i) return ln;
        const newLn = { ...ln, [key]: val };
        
        if (key === "productId") {
          const p = products.find((x) => x.id === val);
          if (p) {
             newLn.price = p.sellPrice;
             newLn.taxPercent = p.gstPercent || "";
          } else {
             newLn.price = "";
             newLn.taxPercent = "";
          }
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

  // Calculate Totals safely
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

  async function handleSave() {
    if (!customerName) return toast.error("Customer required");
    if (!lines.length) return toast.error("Add lines");
    for (const ln of lines) {
      if (!ln.productId) return toast.error("Choose product in each line");
    }

    const existingLedger = ledgers.find(l => l.name.toLowerCase() === customerName.toLowerCase());
    if (!existingLedger && addLedger) {
        try { await addLedger({ name: customerName, type: "Customer" }); } catch (e) {}
    }

    const finalAmountPaid = Number(amountPaid) || 0;

    let paymentStatus = "Unpaid";
    if (finalAmountPaid >= total) paymentStatus = "Paid";
    else if (finalAmountPaid > 0) paymentStatus = "Partial";
    
    const balanceDue = Math.max(0, total - finalAmountPaid);

    // Clean up lines before sending
    const cleanLines = lines.map(ln => ({
        ...ln,
        qty: Number(ln.qty) || 0,
        price: Number(ln.price) || 0,
        discountPercent: Number(ln.discountPercent) || 0,
        taxPercent: Number(ln.taxPercent) || 0
    }));

    const payload = {
      customerName,
      date: new Date(date).toISOString(),
      lines: cleanLines,
      taxPercent: 0,
      discountPercent: 0,
      notes,
      amountPaid: finalAmountPaid,
      paymentMode,
      paymentStatus,
      balanceDue,
      total: total 
    };

    if (editMode && id) {
      if (initial && initial.id) {
          updateSale(initial.id, payload);
          toast.success("Sale updated successfully");
      }
    } else {
      addSale(payload);
      toast.success("Sale recorded successfully");
    }
    navigate("/sales");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {showScanner && (
        <BarcodeScanner 
          onScanSuccess={handleCameraScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          {editMode ? "Edit Sale" : "New Sale"}
        </h2>
      </div>

      <div className="bg-card p-6 rounded-xl shadow-lg border border-border space-y-6">
        
        {/* BARCODE SCANNER */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-center gap-4">
            <ScanBarcode className="text-indigo-600 dark:text-indigo-400" size={24} />
            <div className="flex-1">
                <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                    Scan Barcode to Add Item
                </label>
                <div className="flex gap-2">
                    <input
                        ref={barcodeInputRef}
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={handleInputScan}
                        className="flex-1 bg-transparent border-b border-indigo-300 outline-none text-lg font-medium text-foreground placeholder-muted-foreground/50 focus:border-indigo-600"
                        placeholder="Scan product barcode & hit Enter..."
                        autoFocus
                    />
                    <button 
                        onClick={() => setShowScanner(true)}
                        className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        title="Open Camera"
                    >
                        <Camera size={20} />
                    </button>
                </div>
            </div>
        </div>

        {/* Customer & Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Customer Name</label>
            <SearchableDropdown
              options={ledgers.map((l) => ({ value: l.name, label: l.name }))}
              value={customerName}
              onChange={(val) => setCustomerName(val)}
              placeholder="Select or Type New Customer..."
              allowCustomValue={true}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border-input border px-4 py-2 rounded-lg bg-background text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border-input border px-4 py-2 rounded-lg bg-background text-foreground" placeholder="Optional notes" />
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
                const isLowStock = p && stock < (Number(ln.qty)||0);

                return (
                  <tr key={i} className="hover:bg-accent/50">
                    <td className="px-4 py-2">
                      <SearchableDropdown
                        options={products.map((p) => ({ value: p.id, label: p.name }))}
                        value={ln.productId}
                        onChange={(val) => changeLine(i, "productId", val)}
                        placeholder="Search..."
                      />
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {p ? <span className={stock === 0 ? "text-destructive font-bold" : "text-muted-foreground"}>{stock} {p.unit}</span> : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number" 
                        value={ln.price} 
                        onChange={(e) => changeLine(i, "price", e.target.value)} // ✅ Allow empty
                        className="w-full border border-input px-2 py-1 rounded bg-background" 
                        placeholder="0.00" // ✅ Placeholder
                      />
                    </td>
                    <td className="px-4 py-2 relative">
                        <input 
                            type="number" 
                            value={ln.qty} 
                            onChange={(e) => changeLine(i, "qty", e.target.value)} // ✅ Allow empty
                            className={`w-full border px-2 py-1 rounded bg-background ${isLowStock ? "border-destructive" : "border-input"}`} 
                            placeholder="0" // ✅ Placeholder
                        />
                        {isLowStock && <div className="absolute -top-4 left-0 text-[10px] text-destructive flex items-center"><AlertCircle size={10} className="mr-1"/> Low Stock</div>}
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number" 
                        value={ln.discountPercent} 
                        onChange={(e) => changeLine(i, "discountPercent", e.target.value)} 
                        className="w-full border border-input px-2 py-1 rounded bg-background" 
                        placeholder="0" // ✅ Placeholder
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number" 
                        value={ln.taxPercent} 
                        onChange={(e) => changeLine(i, "taxPercent", e.target.value)} 
                        className="w-full border border-input px-2 py-1 rounded bg-background" 
                        placeholder="0" // ✅ Placeholder
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      ₹ {(Number(ln.qty||0)*Number(ln.price||0) - (Number(ln.qty||0)*Number(ln.price||0)*Number(ln.discountPercent||0))/100 + ((Number(ln.qty||0)*Number(ln.price||0) - (Number(ln.qty||0)*Number(ln.price||0)*Number(ln.discountPercent||0))/100)*Number(ln.taxPercent||0))/100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => removeLine(i)} className="text-muted-foreground hover:text-destructive"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="bg-muted/30 px-4 py-3 border-t border-border flex justify-between items-center">
            <div className="text-sm text-muted-foreground">Total Qty: <span className="font-bold text-foreground">{totalQty}</span></div>
            <button onClick={addLine} className="flex items-center gap-2 px-4 py-2 bg-card border border-input text-indigo-600 rounded-lg hover:bg-accent"><Plus size={18} /> Add Item</button>
          </div>
        </div>

        {/* Totals & Payment */}
        <div className="flex flex-col md:flex-row justify-end gap-8 pt-4 border-t border-border">
          <div className="bg-muted/30 p-4 rounded-lg min-w-[250px] space-y-2">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal:</span><span>₹ {subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground text-sm"><span>Discount:</span><span>- ₹ {totalDiscount.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground text-sm"><span>Tax:</span><span>+ ₹ {totalTax.toFixed(2)}</span></div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between text-xl font-bold text-indigo-700"><span>Total:</span><span>₹ {total.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Payment Mode</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full border-input border px-4 py-2 rounded bg-background text-foreground">
                <option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount Paid</label>
              <input 
                type="number" 
                value={amountPaid} 
                onChange={(e) => setAmountPaid(e.target.value)} // ✅ Allow empty
                className="w-full border-input border px-4 py-2 rounded bg-background text-foreground" 
                placeholder="0.00" // ✅ Placeholder
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <button onClick={() => setAmountPaid(total)} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Full Paid</button>
              <button onClick={() => setAmountPaid(0)} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Unpaid</button>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={() => navigate("/sales")} className="px-6 py-2.5 border rounded-lg hover:bg-accent">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md">{editMode ? "Save Changes" : "Complete Sale"}</button>
        </div>
      </div>
    </div>
  );
}