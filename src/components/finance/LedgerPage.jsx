import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";

import { useStore } from "../../context/StoreContext";

export default function LedgerPage() {
    const { sales, purchases, receipts, payments } = useStore();
    const [tab, setTab] = useState("customers"); // customers | suppliers
    const [search, setSearch] = useState("");

    const customerLedger = useMemo(() => {
        const map = {};

        // Process Sales
        sales.forEach(s => {
            const name = s.customerName;
            if (!map[name]) map[name] = { totalSales: 0, totalReceipts: 0, balance: 0 };
            map[name].totalSales += Number(s.total || 0);
            // If sale had integrated payment
            map[name].totalReceipts += Number(s.amountPaid || 0);
        });

        // Process Receipts
        receipts.forEach(r => {
            const name = r.customerName;
            if (!map[name]) map[name] = { totalSales: 0, totalReceipts: 0, balance: 0 };
            map[name].totalReceipts += Number(r.amount || 0);
        });

        // Calculate Balance
        return Object.entries(map).map(([name, data]) => ({
            name,
            ...data,
            balance: data.totalSales - data.totalReceipts
        })).sort((a, b) => b.balance - a.balance);
    }, [sales, receipts]);

    const supplierLedger = useMemo(() => {
        const map = {};

        // Process Purchases
        purchases.forEach(p => {
            const name = p.supplierName;
            if (!map[name]) map[name] = { totalPurchases: 0, totalPayments: 0, balance: 0 };
            map[name].totalPurchases += Number(p.total || 0);
            // If purchase had integrated payment
            map[name].totalPayments += Number(p.amountPaid || 0);
        });

        // Process Payments
        payments.forEach(p => {
            const name = p.supplierName;
            if (!map[name]) map[name] = { totalPurchases: 0, totalPayments: 0, balance: 0 };
            map[name].totalPayments += Number(p.amount || 0);
        });

        // Calculate Balance
        return Object.entries(map).map(([name, data]) => ({
            name,
            ...data,
            balance: data.totalPurchases - data.totalPayments
        })).sort((a, b) => b.balance - a.balance);
    }, [purchases, payments]);

    const data = tab === "customers" ? customerLedger : supplierLedger;
    const filtered = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Party Ledger (Hisab Kitab)</h2>

            <div className="flex gap-4 border-b border-border">
                <button
                    onClick={() => setTab("customers")}
                    className={`pb-2 px-4 font-medium transition-colors relative ${tab === "customers" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                    Customers (Receivable)
                    {tab === "customers" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                </button>
                <button
                    onClick={() => setTab("suppliers")}
                    className={`pb-2 px-4 font-medium transition-colors relative ${tab === "suppliers" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                    Suppliers (Payable)
                    {tab === "suppliers" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                    type="text"
                    placeholder={`Search ${tab}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none bg-background text-foreground"
                />
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                        <tr>
                            <th className="p-4">Party Name</th>
                            <th className="p-4 text-right">Total Billed</th>
                            <th className="p-4 text-right">Total Received/Paid</th>
                            <th className="p-4 text-right">Balance Due</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filtered.map((d) => (
                            <tr key={d.name} className="hover:bg-accent/50 transition-colors">
                                <td className="p-4 font-medium text-foreground">{d.name}</td>
                                <td className="p-4 text-right text-muted-foreground">
                                    ₹ {Number(tab === "customers" ? d.totalSales : d.totalPurchases).toFixed(2)}
                                </td>
                                <td className="p-4 text-right text-muted-foreground">
                                    ₹ {Number(tab === "customers" ? d.totalReceipts : d.totalPayments).toFixed(2)}
                                </td>
                                <td className={`p-4 text-right font-bold ${d.balance > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                                    ₹ {Number(d.balance).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {!filtered.length && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-muted-foreground">
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
