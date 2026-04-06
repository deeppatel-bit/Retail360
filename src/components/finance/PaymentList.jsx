import React, { useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2, X, ArrowUpRight, CheckCircle, PackageX } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "../../context/StoreContext";
import PaginationControls from "../common/PaginationControls";
import { useToast } from "../../context/ToastContext";

const ITEMS_PER_PAGE = 9;

export default function PaymentList() {
    const { suppliers, addSupplier, editSupplier, deleteSupplier, purchases, updatePurchase, payments, paySupplier } = useStore();
    const toast = useToast();

    const [view, setView] = useState("manage"); // manage | report
    const [showForm, setShowForm] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const [editingSupplier, setEditingSupplier] = useState(null);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Payment Form State
    const [paymentForm, setPaymentForm] = useState({
        supplierId: "",
        supplierName: "",
        amount: "",
        mode: "Cash",
        date: new Date().toISOString().slice(0, 10),
        currentDue: 0
    });

    // ********** 1. BALANCE CALCULATION LOGIC FOR SUPPLIERS **********
    const supplierStats = useMemo(() => {
        const allSuppliers = Array.isArray(suppliers) ? suppliers : [];

        return allSuppliers.map((supplier) => {
            const supName = (supplier.name || "").toLowerCase();

            // 1. Total Purchases (આપણે સપ્લાયર પાસેથી કેટલાનો માલ ખરીદ્યો)
            const totalPurchases = purchases
                .filter(p => (p.supplierName || "").toLowerCase() === supName)
                .reduce((sum, p) => sum + Number(p.total || 0), 0);

            // 2. Down Payments (ખરીદી કરતી વખતે ફોર્મમાં 'amountPaid' માં આપેલા રૂપિયા)
            const paidInPurchases = purchases
                .filter(p => (p.supplierName || "").toLowerCase() === supName)
                .reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);

            // 3. Independent Payments (એવા પેમેન્ટ જે સીધા Payment પેજ પરથી આપ્યા હોય અને કોઈ બિલ સાથે જોડાયેલા ન હોય)
            const independentPayments = payments
                .filter(p => {
                    const matchesName = (p.partyName || p.supplierName || "").toLowerCase() === supName;
                    const isNotBillSettlement = p.note !== "Bill Payment";
                    return matchesName && isNotBillSettlement;
                })
                .reduce((sum, p) => sum + Number(p.amount || 0), 0);

            // કુલ આપેલા રૂપિયા (ખરીદી વખતે + સીધા આપેલા એડવાન્સ/અન્ય)
            const totalPaid = paidInPurchases + independentPayments;

            // Balance: Positive = આપણે આપવાના બાકી છે (Due), Negative = આપણે એડવાન્સ આપેલા છે
            const balance = totalPurchases - totalPaid;

            return {
                ...supplier,
                totalPurchases,
                totalPaid,
                balance
            };
        }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [suppliers, purchases, payments]);

    const filteredSuppliers = supplierStats.filter((s) => {
        const matchesName = (s.name || "").toLowerCase().includes(search.toLowerCase());
        const matchesContact = s.contact && s.contact.includes(search);
        return matchesName || matchesContact;
    });

    const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);
    const paginatedSuppliers = filteredSuppliers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // ********** Handlers **********
    function handleSave(supplier) {
        if (editingSupplier) {
            editSupplier(editingSupplier.id || editingSupplier._id, supplier);
        } else {
            addSupplier(supplier);
        }
        setShowForm(false);
        setEditingSupplier(null);
    }

    const openPaymentModal = (supplier) => {
        setPaymentForm({
            supplierId: supplier.id || supplier._id,
            supplierName: supplier.name,
            amount: "",
            mode: "Cash",
            date: new Date().toISOString().slice(0, 10),
            currentDue: supplier.balance > 0 ? supplier.balance : 0
        });
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async () => {
        if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
            return toast.error("Enter valid amount");
        }

        // StoreContext માં બનાવેલું નવું ફંક્શન કોલ થશે
        await paySupplier({
            supplierName: paymentForm.supplierName,
            amount: Number(paymentForm.amount),
            date: paymentForm.date,
            mode: paymentForm.mode
        });

        setShowPaymentModal(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Supplier Ledger (Payments)</h1>
                    <p className="text-muted-foreground">Manage suppliers and pay outstandings</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setView("manage")} className={`px-4 py-2 rounded-lg transition-colors ${view === "manage" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                        Manage Suppliers
                    </button>
                    <button onClick={() => setView("report")} className={`px-4 py-2 rounded-lg transition-colors ${view === "report" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                        Payables Report
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
                                placeholder="Search suppliers..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-background text-foreground"
                            />
                        </div>
                        <button onClick={() => { setEditingSupplier(null); setShowForm(true); }} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">
                            <Plus size={20} /> Add Supplier
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedSuppliers.map((sup) => (
                            <motion.div key={sup.id || sup._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-red-500">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center font-bold text-lg uppercase">
                                            {(sup.name || "?").charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground">{sup.name}</h3>
                                            <p className="text-xs text-muted-foreground">{sup.contact || sup.mobile || "No Contact"}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditingSupplier(sup); setShowForm(true); }} className="p-1.5 hover:bg-accent rounded text-blue-500"><Edit size={16} /></button>
                                        <button onClick={() => deleteSupplier(sup.id || sup._id)} className="p-1.5 hover:bg-accent rounded text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                <div className="bg-muted/30 p-3 rounded-lg border border-border flex justify-between items-center mt-3">
                                    <div className="text-sm">
                                        <p className="text-muted-foreground text-xs uppercase">Pending Pay</p>
                                        <p className={`font-bold ${sup.balance > 0 ? "text-red-600" : sup.balance < 0 ? "text-green-600" : "text-gray-500"}`}>
                                            {sup.balance > 0
                                                ? `₹ ${sup.balance.toFixed(2)} (Due)`
                                                : sup.balance < 0
                                                    ? `₹ ${Math.abs(sup.balance).toFixed(2)} (Adv)`
                                                    : "₹ 0.00"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => openPaymentModal(sup)}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg flex items-center gap-1 shadow-sm"
                                    >
                                        <ArrowUpRight size={14} /> Pay Now
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {paginatedSuppliers.length === 0 && (
                            <div className="col-span-full text-center p-12 text-muted-foreground flex flex-col items-center gap-3">
                                <PackageX className="w-12 h-12 opacity-20" />
                                No suppliers found. Click "Add Supplier" to create one.
                            </div>
                        )}
                    </div>
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </>
            )}

            {/* REPORT VIEW */}
            {view === "report" && (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <input type="text" placeholder="Search report..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-4 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-background text-foreground" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                                <tr>
                                    <th className="p-4">Supplier Name</th>
                                    <th className="p-4 text-right">Total Purchases</th>
                                    <th className="p-4 text-right">Total Paid</th>
                                    <th className="p-4 text-right">Balance Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredSuppliers.map((d) => (
                                    <tr key={d.id || d._id} className="hover:bg-accent/50 transition-colors">
                                        <td className="p-4 font-medium text-foreground">{d.name}</td>
                                        <td className="p-4 text-right text-muted-foreground">₹ {d.totalPurchases.toFixed(2)}</td>
                                        <td className="p-4 text-right text-muted-foreground">₹ {d.totalPaid.toFixed(2)}</td>
                                        <td className={`p-4 text-right font-bold ${d.balance > 0 ? "text-destructive" : "text-green-600"}`}>
                                            ₹ {Number(d.balance).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PAYMENT MODAL */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card w-full max-w-sm rounded-xl shadow-2xl border border-border p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Make Payment</h3>
                                <p className="text-xs text-muted-foreground">To: <span className="font-semibold text-red-600">{paymentForm.supplierName}</span></p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4 flex justify-between items-center">
                            <span className="text-sm font-medium text-red-700 dark:text-red-300">Total Payable:</span>
                            <span className="text-lg font-bold text-red-700 dark:text-red-300">₹ {paymentForm.currentDue.toFixed(2)}</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-foreground">Amount to Pay</label>
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
                                    <input
                                        type="number"
                                        className="w-full border p-2 pl-7 rounded-lg bg-background text-foreground focus:ring-2 focus:ring-red-500 outline-none font-bold text-lg"
                                        value={paymentForm.amount}
                                        onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                        autoFocus
                                        placeholder="0.00"
                                    />
                                </div>
                                {paymentForm.currentDue > 0 && (
                                    <button
                                        onClick={() => setPaymentForm({ ...paymentForm, amount: paymentForm.currentDue })}
                                        className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
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
                                    onChange={e => setPaymentForm({ ...paymentForm, mode: e.target.value })}
                                >
                                    <option>Cash</option>
                                    <option>UPI</option>
                                    <option>Bank Transfer</option>
                                    <option>Cheque</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground">Date</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded-lg mt-1 bg-background text-foreground"
                                    value={paymentForm.date}
                                    onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-2.5 border border-input rounded-lg hover:bg-accent">Cancel</button>
                            <button onClick={handlePaymentSubmit} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm">
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUPPLIER FORM MODAL */}
            {showForm && (
                <SupplierForm
                    initial={editingSupplier}
                    onSave={handleSave}
                    onCancel={() => { setShowForm(false); setEditingSupplier(null); }}
                />
            )}
        </div>
    );
}

function SupplierForm({ initial, onSave, onCancel }) {
    const [form, setForm] = useState(initial || { name: "", contact: "", address: "", email: "", gst: "" });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border">
                <div className="p-6 border-b border-border bg-red-50 dark:bg-red-900/10 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-foreground">{initial ? "Edit Supplier" : "Add New Supplier"}</h2>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Supplier Name *</label>
                        <input className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-red-500 outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Contact Number</label>
                        <input className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-red-500 outline-none" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">GST Number</label>
                        <input className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-red-500 outline-none" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <textarea className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-red-500 outline-none" rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onCancel} className="flex-1 py-2 border rounded-lg hover:bg-accent">Cancel</button>
                        <button type="submit" className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Save</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}