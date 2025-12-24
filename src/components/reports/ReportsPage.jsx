import React, { useState, useMemo } from "react";
import { BarChart2, Package, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { motion } from "framer-motion";

export default function ReportsPage() {
  const { sales, products } = useStore();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ HELPER: સેલ ટોટલ મેળવવા માટે (જૂના ડેટા માટે Fallback)
  const getSaleTotal = (sale) => {
    // 1. જો ડેટાબેઝમાં ટોટલ હોય તો તે વાપરો (New Data)
    if (sale.total && Number(sale.total) > 0) {
      return Number(sale.total);
    }
    // 2. જો ટોટલ ન હોય, તો લાઈન્સનો સરવાળો કરો (Old Data Fix)
    const calculatedTotal = sale.lines?.reduce((sum, line) => {
      return sum + (Number(line.qty || 0) * Number(line.price || 0));
    }, 0);

    // ટેક્સ/ડિસ્કાઉન્ટનો અંદાજ (જો જૂના ડેટામાં હોય તો)
    // સાદાઈ માટે આપણે અત્યારે સીધો સરવાળો લઈએ છીએ.
    return calculatedTotal || 0;
  };

  // ********** 1. DATA CALCULATION **********
  
  // તારીખ મુજબ સેલ્સ ફિલ્ટર કરો
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const sDate = new Date(s.date).toISOString().slice(0, 10);
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
      // ✅ FIX: getSaleTotal ફંક્શન વાપર્યું
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
      new Date(s.date).toLocaleDateString(),
      s.saleId,
      s.customerName,
      getSaleTotal(s).toFixed(2), // ✅ FIX
      s.paymentStatus
    ]);
    downloadCSV([headers, ...rows], "Sales_Report.csv");
  };

  // 2. Stock Data Export
  const handleExportStock = () => {
    const headers = ["Product Name", "Category", "Current Stock", "Unit", "Cost Price", "Sell Price", "Total Stock Value"];
    const rows = products.map(p => [
      p.name,
      p.category,
      p.stock,
      p.unit,
      p.costPrice,
      p.sellPrice,
      (p.stock * p.costPrice).toFixed(2)
    ]);
    downloadCSV([headers, ...rows], "Stock_Inventory_Report.csv");
  };

  // 3. Profit Report Export
  const handleExportProfit = () => {
    const headers = ["Date", "Invoice No", "Revenue", "Estimated Cost", "Profit"];
    const rows = filteredSales.map(s => {
      let cost = 0;
      s.lines.forEach(line => {
        const product = products.find(p => p.id === line.productId);
        cost += (product ? product.costPrice : 0) * line.qty;
      });
      
      const revenue = getSaleTotal(s); // ✅ FIX
      const profit = revenue - cost;
      
      return [
        new Date(s.date).toLocaleDateString(),
        s.saleId,
        revenue.toFixed(2),
        cost.toFixed(2),
        profit.toFixed(2)
      ];
    });
    
    // Total Row
    rows.push(["TOTAL", "", profitStats.totalRevenue.toFixed(2), profitStats.totalCost.toFixed(2), profitStats.netProfit.toFixed(2)]);
    
    downloadCSV([headers, ...rows], "Profit_Report.csv");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold text-foreground">Business Reports</h2>
        
        {/* Date Filters */}
        <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border shadow-sm">
            <Calendar size={18} className="text-muted-foreground ml-2" />
            <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-foreground"
            />
            <span className="text-muted-foreground">-</span>
            <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-foreground"
            />
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
        <h3 className="text-xl font-semibold mb-4 text-foreground">Export Tools</h3>
        <p className="text-muted-foreground mb-6">
          Generate detailed CSV reports for your sales, inventory, and profit analysis.
        </p>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleExportSales}
            className="px-5 py-3 border border-border rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center gap-3 transition-colors shadow-sm"
          >
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            <div className="text-left">
                <div className="font-semibold text-sm">Sales Report</div>
                <div className="text-xs opacity-70">Export Sales CSV</div>
            </div>
          </button>

          <button 
            onClick={handleExportStock}
            className="px-5 py-3 border border-border rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center gap-3 transition-colors shadow-sm"
          >
            <Package className="w-5 h-5 text-orange-500" />
            <div className="text-left">
                <div className="font-semibold text-sm">Stock Inventory</div>
                <div className="text-xs opacity-70">Export Stock CSV</div>
            </div>
          </button>

          <button 
            onClick={handleExportProfit}
            className="px-5 py-3 border border-border rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center gap-3 transition-colors shadow-sm"
          >
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <div className="text-left">
                <div className="font-semibold text-sm">Profit Report</div>
                <div className="text-xs opacity-70">Export P&L CSV</div>
            </div>
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