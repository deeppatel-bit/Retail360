import React, { useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "../../context/StoreContext";
import PaginationControls from "../common/PaginationControls";

const ITEMS_PER_PAGE = 9;

export default function LedgerPage() {
    const { ledgers, addLedger, editLedger, deleteLedger, sales, receipts } = useStore();
    const [view, setView] = useState("manage"); // manage | report
    const [showForm, setShowForm] = useState(false);
    const [editingLedger, setEditingLedger] = useState(null);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // ********** Manage View Logic **********
    const filteredLedgers = useMemo(() => {
        return ledgers.filter((l) =>
            l.name.toLowerCase().includes(search.toLowerCase()) ||
            (l.contact && l.contact.toLowerCase().includes(search.toLowerCase()))
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [ledgers, search]);

    const totalPages = Math.ceil(filteredLedgers.length / ITEMS_PER_PAGE);
    const paginatedLedgers = filteredLedgers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    function handleSave(ledger) {
        if (editingLedger) {
            editLedger(editingLedger.id, ledger);
        } else {
            addLedger(ledger);
        }
        setShowForm(false);
        setEditingLedger(null);
    }

    // ********** Report View Logic **********
    const customerLedger = useMemo(() => {
        const map = {};
        // Initialize with all ledgers
        ledgers.forEach(l => {
            map[l.name] = { totalSales: 0, totalReceipts: 0, balance: 0 };
        });

        // Process Sales
        sales.forEach(s => {
            const name = s.customerName;
            if (!map[name]) map[name] = { totalSales: 0, totalReceipts: 0, balance: 0 };
            map[name].totalSales += Number(s.total || 0);
            map[name].totalReceipts += Number(s.amountPaid || 0);
        });

        // Process Receipts
        receipts.forEach(r => {
            const name = r.customerName;
            if (!map[name]) map[name] = { totalSales: 0, totalReceipts: 0, balance: 0 };
            map[name].totalReceipts += Number(r.amount || 0);
        });

        return Object.entries(map).map(([name, data]) => ({
            name,
            ...data,
            balance: data.totalSales - data.totalReceipts
        })).sort((a, b) => b.balance - a.balance);
    }, [sales, receipts, ledgers]);

    const filteredReport = customerLedger.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Customer Ledger</h1>
                    <p className="text-muted-foreground">Manage customers and view balances</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setView("manage")}
                        className={`px-4 py-2 rounded-lg transition-colors ${view === "manage" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                    >
                        Manage Customers
                    </button>
                    <button
                        onClick={() => setView("report")}
                        className={`px-4 py-2 rounded-lg transition-colors ${view === "report" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                    >
                        Balance Report
                    </button>
                </div>
            </div>

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
                        <button
                            onClick={() => {
                                setEditingLedger(null);
                                setShowForm(true);
                            }}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            <Plus size={20} />
                            Add Customer
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedLedgers.map((ledger) => (
                            <motion.div
                                key={ledger.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold text-lg">
                                        {ledger.name.charAt(0)}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingLedger(ledger);
                                                setShowForm(true);
                                            }}
                                            className="text-muted-foreground hover:text-blue-600 transition-colors"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => deleteLedger(ledger.id)}
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-foreground mb-1">{ledger.name}</h3>

                                {ledger.contact && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <Phone size={14} />
                                        {ledger.contact}
                                    </div>
                                )}



                                {ledger.address && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground/80 mt-2">
                                        <MapPin size={14} />
                                        <span className="line-clamp-1">{ledger.address}</span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {paginatedLedgers.length === 0 && (
                        <div className="text-center py-12 bg-card rounded-xl border border-border">
                            <p className="text-muted-foreground">No customers found</p>
                        </div>
                    )}

                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </>
            )}

            {view === "report" && (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                placeholder="Search report..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none bg-background text-foreground"
                            />
                        </div>
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
                            {filteredReport.map((d) => (
                                <tr key={d.name} className="hover:bg-accent/50 transition-colors">
                                    <td className="p-4 font-medium text-foreground">{d.name}</td>
                                    <td className="p-4 text-right text-muted-foreground">
                                        ₹ {Number(d.totalSales).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-right text-muted-foreground">
                                        ₹ {Number(d.totalReceipts).toFixed(2)}
                                    </td>
                                    <td className={`p-4 text-right font-bold ${d.balance > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                                        ₹ {Number(d.balance).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {!filteredReport.length && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-muted-foreground">
                                        No records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <LedgerForm
                    initial={editingLedger}
                    onSave={handleSave}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingLedger(null);
                    }}
                />
            )}
        </div>
    );
}

function LedgerForm({ initial, onSave, onCancel }) {
    const [form, setForm] = useState(
        initial || {
            name: "",
            contact: "",
            address: "",
        }
    );

    function handleSubmit(e) {
        e.preventDefault();
        onSave(form);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border"
            >
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">
                        {initial ? "Edit Customer" : "Add New Customer"}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Customer Name *
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Contact Number
                        </label>
                        <input
                            type="tel"
                            value={form.contact}
                            onChange={(e) => setForm({ ...form, contact: e.target.value })}
                            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                        />
                    </div>



                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Address
                        </label>
                        <textarea
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                            rows="2"
                        />
                    </div>



                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-accent/50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
