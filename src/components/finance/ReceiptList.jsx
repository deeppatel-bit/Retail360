import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Trash2 } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import PaginationControls from "../common/PaginationControls";
import TableHeader from "../common/TableHeader";

const ITEMS_PER_PAGE = 10;

export default function ReceiptList() {
    const { receipts, deleteReceipt } = useStore();
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

    const filteredReceipts = useMemo(() => {
        // 🛑 Safety Check: receipts undefined હોય તો ખાલી array વાપરો
        let data = (receipts || []).filter((r) => {
            // ✅ FIX: 'customerName' ને બદલે 'partyName' વાપરો
            // ✅ FIX: (r.partyName || "") થી safety ઉમેરો
            const matchesSearch =
                (r.partyName || "").toLowerCase().includes(search.toLowerCase()) ||
                (r.id || "").toLowerCase().includes(search.toLowerCase());

            const rDate = r.date ? new Date(r.date).toISOString().slice(0, 10) : "";
            const matchesDate =
                (!startDate || rDate >= startDate) &&
                (!endDate || rDate <= endDate);

            return matchesSearch && matchesDate;
        });

        if (sortConfig.key) {
            data.sort((a, b) => {
                // Sorting વખતે પણ safety રાખો
                const valA = a[sortConfig.key] || "";
                const valB = b[sortConfig.key] || "";
                
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [receipts, search, sortConfig, startDate, endDate]);

    const totalPages = Math.ceil(filteredReceipts.length / ITEMS_PER_PAGE);
    const paginatedReceipts = filteredReceipts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const columns = [
        { key: 'date', label: 'Date', sortable: true },
        { key: 'id', label: 'Receipt No', sortable: true },
        { key: 'partyName', label: 'Customer', sortable: true }, // ✅ Label Customer રાખો, પણ key partyName
        { key: 'mode', label: 'Mode', sortable: true },
        { key: 'amount', label: 'Amount', sortable: true },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-foreground">Receipts (Money In)</h2>
                <Link to="/receipts/add" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Plus size={18} /> Add Receipt
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl shadow-sm border border-border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search customer..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-background text-foreground"
                    />
                </div>

                <div className="flex gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-foreground bg-background"
                    />
                    <span className="self-center text-muted-foreground">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-foreground bg-background"
                    />
                </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <TableHeader columns={columns} sortConfig={sortConfig} onSort={handleSort} />
                        <tbody className="divide-y divide-border">
                            {paginatedReceipts.length > 0 ? (
                                paginatedReceipts.map((r) => (
                                    <tr key={r.id || Math.random()} className="hover:bg-accent/50 transition-colors">
                                        <td className="p-4 text-muted-foreground">{r.date ? new Date(r.date).toLocaleDateString() : "-"}</td>
                                        <td className="p-4 font-medium text-muted-foreground text-sm">{r.id}</td>
                                        {/* ✅ FIX: Display partyName instead of customerName */}
                                        <td className="p-4 font-medium text-foreground">{r.partyName || "Unknown"}</td>
                                        <td className="p-4 text-muted-foreground">{r.mode}</td>
                                        <td className="p-4 font-bold text-green-600 dark:text-green-400">+ ₹ {Number(r.amount || 0).toFixed(2)}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => deleteReceipt(r.id)} className="text-destructive hover:text-destructive/80 p-2 hover:bg-destructive/10 rounded-full transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-muted-foreground">
                                        {search ? "No matching receipts found." : "No receipts found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages > 0 ? totalPages : 1}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}