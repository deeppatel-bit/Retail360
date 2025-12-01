import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import PaginationControls from "../common/PaginationControls";
import TableHeader from "../common/TableHeader";

const ITEMS_PER_PAGE = 10;

export default function PurchaseList() {
  const { purchases, deletePurchase } = useStore();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredPurchases = useMemo(() => {
    let data = purchases.filter((p) => {
      const matchesSearch =
        p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        (p.billNo || "").toLowerCase().includes(search.toLowerCase());

      const pDate = new Date(p.date).toISOString().slice(0, 10);
      const matchesDate =
        (!startDate || pDate >= startDate) &&
        (!endDate || pDate <= endDate);

      const matchesStatus =
        statusFilter === "All" ||
        (p.paymentStatus || "Unpaid") === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
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
  }, [purchases, search, sortConfig, startDate, endDate, statusFilter]);

  const totalPages = Math.ceil(filteredPurchases.length / ITEMS_PER_PAGE);
  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const columns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'supplierName', label: 'Supplier', sortable: true },
    { key: 'billNo', label: 'Bill No', sortable: true },
    { key: 'items', label: 'Items', sortable: false },
    { key: 'total', label: 'Total', sortable: true },
    { key: 'amountPaid', label: 'Paid', sortable: true },
    { key: 'balanceDue', label: 'Balance', sortable: true },
    { key: 'paymentStatus', label: 'Status', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">Purchases History</h2>
        <Link to="/purchase/add" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap">
          + Add Purchase
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl shadow-sm border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search supplier or bill..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-background text-foreground"
          />
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-foreground bg-background"
          />
          <span className="self-center text-muted-foreground">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-foreground bg-background"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-background text-foreground"
        >
          <option value="All">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Unpaid">Unpaid</option>
        </select>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <TableHeader columns={columns} sortConfig={sortConfig} onSort={handleSort} />
            <tbody className="divide-y divide-border">
              {paginatedPurchases.map((p) => (
                <tr key={p.purchaseId} className="hover:bg-accent/50 transition-colors">
                  <td className="p-4 text-muted-foreground">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-foreground">{p.supplierName}</td>
                  <td className="p-4 text-muted-foreground">{p.billNo || "-"}</td>
                  <td className="p-4 text-center">
                    <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium">
                      {p.lines.length}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-foreground">₹ {Number(p.total).toFixed(2)}</td>
                  <td className="p-4 text-muted-foreground">₹ {Number(p.amountPaid || 0).toFixed(2)}</td>
                  <td className="p-4 text-destructive font-medium">
                    {p.balanceDue > 0 ? `₹ ${Number(p.balanceDue).toFixed(2)}` : "-"}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.paymentStatus === "Paid" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" :
                      p.paymentStatus === "Partial" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                      {p.paymentStatus || "Unpaid"}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <Link to={`/purchase/edit/${p.purchaseId}`} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm">Edit</Link>
                    <button onClick={() => deletePurchase(p.purchaseId)} className="text-destructive hover:text-destructive/80 font-medium text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {!paginatedPurchases.length && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-muted-foreground">
                    {search ? "No matching purchases found." : "No purchases recorded yet."}
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
