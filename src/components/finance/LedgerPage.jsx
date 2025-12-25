import React, { useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Phone, MapPin, Wallet, X, ArrowDownLeft, CheckCircle } from "lucide-react"; 
import { motion } from "framer-motion";
import { useStore } from "../../context/StoreContext";
import PaginationControls from "../common/PaginationControls";
import { useToast } from "../../context/ToastContext";

const ITEMS_PER_PAGE = 9;

export default function LedgerPage() {
    const { ledgers, addLedger, editLedger, deleteLedger, sales, receipts, addReceipt } = useStore();
    const toast = useToast();

    const [view, setView] = useState("manage"); // manage | report
    const [showForm, setShowForm] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    const [editingLedger, setEditingLedger] = useState(null);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Payment Form State
    const [paymentForm, setPaymentForm] = useState({
        customerId: "",
        customerName: "",
        amount: "",
        mode: "Cash",
        date: new Date().toISOString().slice(0, 10),
        currentDue: 0 // To show in modal
    });

    // ********** 1. BALANCE CALCULATION LOGIC (Updated) **********
    const ledgerStats = useMemo(() => {
        return ledgers.map((customer) => {
            // 1. Total Sales Bill Amount for the customer
            const totalSales = sales
                .filter(s => s.customerName?.toLowerCase() === customer.name.toLowerCase())
                .reduce((sum, s) => sum + Number(s.total || 0), 0);

            // 2. Down Payments made during sales
            const paidInSales = sales
                .filter(s => s.customerName?.toLowerCase() === customer.name.toLowerCase())
                .reduce((sum, s) => sum + Number(s.amountPaid || 0), 0);

            // 3. Payments made via Receipts (from "Pay" button)
            const paidInReceipts = receipts
                .filter(r => r.customerName?.toLowerCase() === customer.name.toLowerCase())
                .reduce((sum, r) => sum + Number(r.amount || 0), 0);

            // Total Received Amount
            const totalReceived = paidInSales + paidInReceipts;
            
            // Net Balance Calculation
            // Positive (+) means Due, Negative (-) means Advance
            const balance = totalSales - totalReceived; 

            return {
                ...customer,
                totalSales,
                totalReceived,
                balance
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [ledgers, sales, receipts]); // Recalculate when receipts change

    const filteredLedgers = ledgerStats.filter((l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        (l.phone && l.phone.includes(search))
    );

    const totalPages = Math.ceil(filteredLedgers.length / ITEMS_PER_PAGE);
    const paginatedLedgers = filteredLedgers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // ********** Handlers **********
    function handleSave(ledger) {
        if (editingLedger) {
            editLedger(editingLedger.id, ledger);
        } else {
            addLedger(ledger);
        }
        setShowForm(false);
        setEditingLedger(null);
    }

    // ✅ Open Payment Modal with Due Amount
    const openPaymentModal = (customer) => {
        setPaymentForm({
            customerId: customer.id,
            customerName: customer.name,
            amount: "",
            mode: "Cash",
            date: new Date().toISOString().slice(0, 10),
            currentDue: customer.balance > 0 ? customer.balance : 0 // Show only if due
        });
        setShowPaymentModal(true);
    };

    // ✅ Handle Payment Submit
    const handlePaymentSubmit = async () => {
        if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
            return toast.error("Enter valid amount");
        }

        // Add Receipt (This will reduce the balance)
        await addReceipt({
            customerName: paymentForm.customerName,
            amount: Number(paymentForm.amount),
            date: paymentForm.date,
            mode: paymentForm.mode,
            note: "Payment Received via Ledger" // Will show in report
        });

        toast.success(`Received ₹${paymentForm.amount} from ${paymentForm.customerName}`);
        setShowPaymentModal(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Customer Ledger</h1>
                    <p className="text-muted-foreground">Manage customers and view balances</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setView("manage")} className={`px-4 py-2 rounded-lg transition-colors ${view === "manage" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                        Manage Customers
                    </button>
                    <button onClick={() => setView("report")} className={`px-4 py-2 rounded-lg transition-colors ${view === "report" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                        Balance Report
                    </button>
                </div>
            </div>

            {/* MANAGE VIEW */}
            {view === "manage" && (
                <>
                    <div className="flex flex-col md:flex-row justify-between gap-4 bg-card p-4 rounded-xl shadow-sm border border-border">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none bg-background text-foreground"
                            />
                        </div>
                        <button onClick={() => { setEditingLedger(null); setShowForm(true); }} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20">
                            <Plus size={20} /> Add Customer
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedLedgers.map((ledger) => (
                            <motion.div key={ledger.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold text-lg uppercase">
                                            {ledger.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground">{ledger.name}</h3>
                                            <p className="text-xs text-muted-foreground">{ledger.phone || "No Phone"}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditingLedger(ledger); setShowForm(true); }} className="p-1.5 hover:bg-accent rounded text-blue-500"><Edit size={16} /></button>
                                        <button onClick={() => deleteLedger(ledger.id)} className="p-1.5 hover:bg-accent rounded text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                <div className="bg-muted/30 p-3 rounded-lg border border-border flex justify-between items-center mt-3">
                                    <div className="text-sm">
                                        <p className="text-muted-foreground text-xs uppercase">Net Balance</p>
                                        <p className={`font-bold ${ledger.balance > 0 ? "text-red-600" : ledger.balance < 0 ? "text-green-600" : "text-gray-500"}`}>
                                            {ledger.balance > 0 
                                                ? `₹ ${ledger.balance.toFixed(2)} (Due)` 
                                                : ledger.balance < 0 
                                                    ? `₹ ${Math.abs(ledger.balance).toFixed(2)} (Adv)` 
                                                    : "₹ 0.00"}
                                        </p>
                                    </div>
                                    {/* ✅ Pay Button - Opens Modal */}
                                    <button 
                                        onClick={() => openPaymentModal(ledger)}
                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg flex items-center gap-1 shadow-sm"
                                    >
                                        <ArrowDownLeft size={14} /> Pay / Jama
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </>
            )}

            {/* REPORT VIEW */}
            {view === "report" && (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <input type="text" placeholder="Search report..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-4 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none bg-background text-foreground" />
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                            <tr>
                                <th className="p-4">Customer Name</th>
                                <th className="p-4 text-right">Total Sales</th>
                                <th className="p-4 text-right">Total Received</th>
                                <th className="p-4 text-right">Balance Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredLedgers.map((d) => (
                                <tr key={d.id} className="hover:bg-accent/50 transition-colors">
                                    <td className="p-4 font-medium text-foreground">{d.name}</td>
                                    <td className="p-4 text-right text-muted-foreground">₹ {d.totalSales.toFixed(2)}</td>
                                    <td className="p-4 text-right text-muted-foreground">₹ {d.totalReceived.toFixed(2)}</td>
                                    <td className={`p-4 text-right font-bold ${d.balance > 0 ? "text-destructive" : "text-green-600"}`}>
                                        ₹ {Number(d.balance).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ✅ PAYMENT MODAL with "Full Pay" Option */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card w-full max-w-sm rounded-xl shadow-2xl border border-border p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Collect Payment</h3>
                                <p className="text-xs text-muted-foreground">From: <span className="font-semibold text-primary">{paymentForm.customerName}</span></p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20}/></button>
                        </div>
                        
                        {/* Current Due Display */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg mb-4 flex justify-between items-center">
                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Total Pending:</span>
                            <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">₹ {paymentForm.currentDue.toFixed(2)}</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-foreground">Amount to Pay</label>
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 pl-7 rounded-lg bg-background text-foreground focus:ring-2 focus:ring-green-500 outline-none font-bold text-lg" 
                                        value={paymentForm.amount} 
                                        onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
                                        autoFocus
                                        placeholder="0.00"
                                    />
                                </div>
                                {/* ✅ Full Pay Button */}
                                {paymentForm.currentDue > 0 && (
                                    <button 
                                        onClick={() => setPaymentForm({...paymentForm, amount: paymentForm.currentDue})}
                                        className="mt-2 text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                                    >
                                        <CheckCircle size={12} /> Click here to Full Pay (₹ {paymentForm.currentDue})
                                    </button>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground">Payment Mode</label>
                                <select 
                                    className="w-full border p-2 rounded-lg mt-1 bg-background text-foreground"
                                    value={paymentForm.mode}
                                    onChange={e => setPaymentForm({...paymentForm, mode: e.target.value})}
                                >
                                    <option>Cash</option>
                                    <option>UPI</option>
                                    <option>Bank Transfer</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground">Date</label>
                                <input 
                                    type="date"
                                    className="w-full border p-2 rounded-lg mt-1 bg-background text-foreground"
                                    value={paymentForm.date}
                                    onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-2.5 border border-input rounded-lg hover:bg-accent">Cancel</button>
                            <button onClick={handlePaymentSubmit} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm">
                                Confirm Received
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOMER FORM MODAL */}
            {showForm && (
                <LedgerForm
                    initial={editingLedger}
                    onSave={handleSave}
                    onCancel={() => { setShowForm(false); setEditingLedger(null); }}
                />
            )}
        </div>
    );
}

function LedgerForm({ initial, onSave, onCancel }) {
    const [form, setForm] = useState(initial || { name: "", phone: "", address: "" });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">{initial ? "Edit Customer" : "Add New Customer"}</h2>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Customer Name *</label>
                        <input className="w-full px-4 py-2 border rounded-lg bg-background" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input className="w-full px-4 py-2 border rounded-lg bg-background" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <textarea className="w-full px-4 py-2 border rounded-lg bg-background" rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onCancel} className="flex-1 py-2 border rounded-lg hover:bg-accent">Cancel</button>
                        <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Save</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}