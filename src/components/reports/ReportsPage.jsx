import React, { useState, useMemo } from "react";
import { BarChart2, Package, TrendingUp, DollarSign, Calendar, Download } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { motion } from "framer-motion";

export default function ReportsPage() {
  const { sales, products } = useStore();

  // Default: આજની તારીખ સેટ કરો
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // ✅ HELPER: તારીખ DD/MM/YYYY ફોર્મેટમાં બતાવવા માટે
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB"); // DD/MM/YYYY
  };

  // ✅ HELPER: સેલ ટોટલ મેળવવા માટે
  const getSaleTotal = (sale) => {
    if (sale.total && Number(sale.total) > 0) return Number(sale.total);
    const calculatedTotal = sale.lines?.reduce((sum, line) => {
      return sum + (Number(line.qty || 0) * Number(line.price || 0));
    }, 0);
    return calculatedTotal || 0;
  };

  // ********** 1. DATA FILTERING & CALCULATION **********

  // પસંદ કરેલી તારીખ મુજબ સેલ્સ ફિલ્ટર કરો
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const sDate = new Date(s.date).toISOString().slice(0, 10);
      // જો તારીખ ખાલી હોય તો બધો ડેટા બતાવો, નહિતર રેન્જ મુજબ
      const start = startDate || "2000-01-01";
      const end = endDate || "2099-12-31";
      return sDate >= start && sDate <= end;
    });
  }, [sales, startDate, endDate]);

  // પ્રોફિટ ગણતરી (Profit Logic)
  const profitStats = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;

    filteredSales.forEach((sale) => {
      totalRevenue += getSaleTotal(sale);

      // કોસ્ટ ગણતરી (Cost Calculation)
      sale.lines.forEach((line) => {
        const product = products.find((p) => p.id === line.productId);
        const costPrice = product ? Number(product.costPrice || 0) : 0;
        const qty = Number(line.qty || 0);

        totalCost += costPrice * qty;
      });
    });

    const netProfit = totalRevenue - totalCost;

    // Profit Margin %
    const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    return { totalRevenue, totalCost, netProfit, margin };
  }, [filteredSales, products]);

  // ********** 2. EXPORT FUNCTIONS (CSV) **********

  const downloadCSV = (data, filename) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      data.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Sales Report Export
  const handleExportSales = () => {
    const headers = ["Date", "Invoice No", "Customer", "Total Amount", "Payment Status"];
    const rows = filteredSales.map(s => [
      formatDate(s.date), // ✅ DD/MM/YYYY
      s.saleId,
      s.customerName,
      getSaleTotal(s).toFixed(2),
      s.paymentStatus
    ]);
    // Add Summary Row
    rows.push(["TOTAL", "", "", profitStats.totalRevenue.toFixed(2), ""]);

    downloadCSV([headers, ...rows], `Sales_Report_${formatDate(startDate)}_to_${formatDate(endDate)}.csv`);
  };

  // 2. Profit Report Export
  const handleExportProfit = () => {
    const headers = ["Date", "Invoice No", "Revenue", "Estimated Cost", "Profit"];
    const rows = filteredSales.map(s => {
      let cost = 0;
      s.lines.forEach(line => {
        const product = products.find(p => p.id === line.productId);
        cost += (product ? Number(product.costPrice || 0) : 0) * Number(line.qty || 0);
      });

      const revenue = getSaleTotal(s);
      const profit = revenue - cost;

      return [
        formatDate(s.date), // ✅ DD/MM/YYYY
        s.saleId,
        revenue.toFixed(2),
        cost.toFixed(2),
        profit.toFixed(2)
      ];
    });

    // Total Row
    rows.push(["TOTAL", "", profitStats.totalRevenue.toFixed(2), profitStats.totalCost.toFixed(2), profitStats.netProfit.toFixed(2)]);

    downloadCSV([headers, ...rows], `Profit_Report_${formatDate(startDate)}_to_${formatDate(endDate)}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Performance Reports</h2>
          <p className="text-sm text-muted-foreground">
            Showing data from <span className="font-semibold text-primary">{formatDate(startDate)}</span> to <span className="font-semibold text-primary">{formatDate(endDate)}</span>
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <span className="absolute left-3 top-2.5 text-muted-foreground text-xs font-semibold">FROM</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-40 pl-12 pr-3 py-2 border border-input rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <span className="text-muted-foreground hidden sm:block">to</span>
          <div className="relative w-full sm:w-auto">
            <span className="absolute left-3 top-2.5 text-muted-foreground text-xs font-semibold">TO</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-40 pl-8 pr-3 py-2 border border-input rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Profit Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹ ${profitStats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Total Cost (Est.)"
          value={`₹ ${profitStats.totalCost.toFixed(2)}`}
          icon={Package}
          color="orange"
        />
        <StatCard
          title="Net Profit"
          value={`₹ ${profitStats.netProfit.toFixed(2)}`}
          sub={`${profitStats.margin}% Margin`}
          icon={TrendingUp}
          color="green"
        />
      </div>

      <div className="bg-card p-6 rounded-xl shadow border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Download size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Download Reports</h3>
            <p className="text-sm text-muted-foreground">Select a report type to export data for the selected date range.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={handleExportSales}
            className="p-4 border border-border rounded-xl bg-secondary/50 hover:bg-secondary text-secondary-foreground flex flex-col gap-2 transition-all hover:shadow-md group text-left"
          >
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
              <BarChart2 className="w-5 h-5" /> Sales Report
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Detailed list of all invoices and sales transactions.
            </p>
          </button>

          <button
            onClick={handleExportProfit}
            className="p-4 border border-border rounded-xl bg-secondary/50 hover:bg-secondary text-secondary-foreground flex flex-col gap-2 transition-all hover:shadow-md group text-left"
          >
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-5 h-5" /> Profit & Loss
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Analyze revenue, cost, and net profit per transaction.
            </p>
          </button>

          {/* Stock Report doesn't depend on date usually, but kept for consistency */}
          <button
            onClick={() => {
              const headers = ["Product Name", "Category", "Current Stock", "Unit", "Cost Price", "Sell Price", "Total Stock Value"];
              const rows = products.map(p => [
                p.name, p.category, p.stock, p.unit, p.costPrice, p.sellPrice, (p.stock * p.costPrice).toFixed(2)
              ]);
              downloadCSV([headers, ...rows], "Current_Stock_Inventory.csv");
            }}
            className="p-4 border border-border rounded-xl bg-secondary/50 hover:bg-secondary text-secondary-foreground flex flex-col gap-2 transition-all hover:shadow-md group text-left"
          >
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
              <Package className="w-5 h-5" /> Current Stock
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Snapshot of current inventory levels and valuation.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple Stat Card Component
function StatCard({ title, value, sub, icon: Icon, color }) {
  const colors = {
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400",
    orange: "text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400",
    green: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4"
    >
      <div className={`p-4 rounded-full ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-muted-foreground text-sm font-medium">{title}</p>
        <h4 className="text-2xl font-bold text-foreground">{value}</h4>
        {sub && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}