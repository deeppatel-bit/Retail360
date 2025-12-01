import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Trash2 } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import PaginationControls from "../common/PaginationControls";
import TableHeader from "../common/TableHeader";

const ITEMS_PER_PAGE = 10;

export default function PaymentList() {
    const { payments, deletePayment } = useStore();
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredPayments = useMemo(() => {
        let data = payments.filter((p) => {
            const matchesSearch =
                p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
                p.id.toLowerCase().includes(search.toLowerCase());

            const pDate = new Date(p.date).toISOString().slice(0, 10);
            const matchesDate =
                (!startDate || pDate >= startDate) &&
                (!endDate || pDate <= endDate);

            return matchesSearch && matchesDate;
        });

        if (sortConfig.key) {
            data.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return data;
    }, [payments, search, sortConfig, startDate, endDate]);

    const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
    const paginatedPayments = filteredPayments.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const columns = [
        { key: 'date', label: 'Date', sortable: true },
        { key: 'id', label: 'Payment No', sortable: true },
        { key: 'supplierName', label: 'Supplier', sortable: true },
        { key: 'mode', label: 'Mode', sortable: true },
        { key: 'amount', label: 'Amount', sortable: true },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-foreground">Payments (Money Out)</h2>
                <Link to="/payments/add" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Plus size={18} /> Add Payment
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl shadow-sm border border-border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search supplier..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-background text-foreground"
                    />
                </div>

                <div className="flex gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-foreground bg-background"
                    />
                    <span className="self-center text-muted-foreground">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-foreground bg-background"
                    />
                </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <TableHeader columns={columns} sortConfig={sortConfig} onSort={handleSort} />
                        <tbody className="divide-y divide-border">
                            {paginatedPayments.map((p) => (
                                <tr key={p.id} className="hover:bg-accent/50 transition-colors">
                                    <td className="p-4 text-muted-foreground">{new Date(p.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-muted-foreground text-sm">{p.id}</td>
                                    <td className="p-4 font-medium text-foreground">{p.supplierName}</td>
                                    <td className="p-4 text-muted-foreground">{p.mode}</td>
                                    <td className="p-4 font-bold text-destructive">- ₹ {Number(p.amount).toFixed(2)}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => deletePayment(p.id)} className="text-destructive hover:text-destructive/80 p-2 hover:bg-destructive/10 rounded-full transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!paginatedPayments.length && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-muted-foreground">
                                        {search ? "No matching payments found." : "No payments found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}
