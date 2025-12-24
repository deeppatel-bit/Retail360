import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, FileText, PackageX, Printer } from "lucide-react"; // ✅ Printer Icon ઉમેર્યું
import { useStore } from "../../context/StoreContext";
import PaginationControls from "../common/PaginationControls";
import TableHeader from "../common/TableHeader";
import SearchableDropdown from "../common/SearchableDropdown";
import { generateInvoice } from "../../utils/invoiceGenerator"; // ✅ Invoice Generator Import કર્યું

const ITEMS_PER_PAGE = 10;

export default function SalesList() {
  const { sales, deleteSale, settings } = useStore(); // ✅ settings પણ લાવ્યા (બિલમાં નામ બતાવવા)
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // ✅ Print Function
  const handlePrint = (sale) => {
    generateInvoice(sale, settings);
  };

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredSales = useMemo(() => {
    const dataList = Array.isArray(sales) ? sales : [];

    let data = dataList.filter((s) => {
      const matchesSearch =
        (s.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.saleId || "").toLowerCase().includes(search.toLowerCase());

      const sDate = s.date ? new Date(s.date).toISOString().slice(0, 10) : "";
      const matchesDate =
        (!startDate || sDate >= startDate) && (!endDate || sDate <= endDate);

      const matchesStatus =
        statusFilter === "All" ||
        (s.paymentStatus || "Unpaid") === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });

    if (sortConfig.key) {
      data.sort((a, b) => {
        const valA = a[sortConfig.key] || "";
        const valB = b[sortConfig.key] || "";
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [sales, search, sortConfig, startDate, endDate, statusFilter]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const columns = [
    { key: "date", label: "Date", sortable: true },
    { key: "saleId", label: "Invoice", sortable: true },
    { key: "customerName", label: "Customer", sortable: true },
    { key: "items", label: "Items", sortable: false },
    { key: "total", label: "Total", sortable: true },
    { key: "amountPaid", label: "Paid", sortable: true },
    { key: "balanceDue", label: "Balance", sortable: true },
    { key: "paymentStatus", label: "Status", sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-7 h-7 text-primary" />
          Sales History
        </h2>
        <Link
          to="/sales/add"
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30 whitespace-nowrap"
        >
          + New Sale
        </Link>
      </div>

      <div className="bg-card p-4 rounded-xl shadow-sm border border-border space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search customer or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground transition-all focus:scale-[1.01]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="text-muted-foreground flex-shrink-0" size={18} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-foreground bg-background text-sm"
            />
            <span className="text-muted-foreground font-medium flex-shrink-0">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-foreground bg-background text-sm"
            />
          </div>

          <SearchableDropdown
            options={[
              { value: "All", label: "All Status" },
              { value: "Paid", label: "Paid" },
              { value: "Partial", label: "Partial" },
              { value: "Unpaid", label: "Unpaid" },
            ]}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            placeholder="Filter by status..."
          />
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <TableHeader columns={columns} sortConfig={sortConfig} onSort={handleSort} />
            <tbody className="divide-y divide-border">
              {paginatedSales.map((s) => (
                <tr
                  key={s.id || s.saleId}
                  className="hover:bg-accent/50 transition-colors group relative border-l-4 border-transparent hover:border-primary"
                >
                  <td className="p-4 text-muted-foreground">
                    {s.date ? new Date(s.date).toLocaleDateString() : "-"}
                  </td>
                  <td className="p-4 font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {s.saleId}
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    {s.customerName}
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium">
                      {s.lines ? s.lines.length : 0}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-lg text-foreground">
                    ₹ {Number(s.total || 0).toFixed(2)}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    ₹ {Number(s.amountPaid || 0).toFixed(2)}
                  </td>
                  <td className="p-4 text-destructive font-medium">
                    {s.balanceDue > 0 ? `₹ ${Number(s.balanceDue).toFixed(2)}` : "-"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${
                        s.paymentStatus === "Paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                          : s.paymentStatus === "Partial"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          s.paymentStatus === "Paid"
                            ? "bg-green-500"
                            : s.paymentStatus === "Partial"
                            ? "bg-yellow-500"
                            : "bg-destructive"
                        }`}
                      />
                      {s.paymentStatus || "Unpaid"}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-3 flex justify-end items-center">
                    
                    {/* ✅ NEW: Print Button */}
                    <button
                        onClick={() => handlePrint(s)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded transition-colors"
                        title="Print Invoice"
                    >
                        <Printer size={18} />
                    </button>

                    <Link
                      to={`/sales/edit/${s.saleId}`}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteSale(s.id)}
                      className="text-destructive hover:text-destructive/80 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!paginatedSales.length && (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <PackageX className="w-16 h-16 opacity-30" />
                      <p className="text-lg font-medium">
                        {search ? "No matching sales found." : "No sales recorded yet."}
                      </p>
                      {!search && (
                        <Link
                          to="/sales/add"
                          className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Record Your First Sale
                        </Link>
                      )}
                    </div>
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