import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../StatCard";
import { DollarSign, Package, AlertTriangle, TrendingUp, ShoppingBag, PackageX } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "../../context/StoreContext";

/**
 Props:
  - products
  - purchases
  - sales
**/

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};


export default function Dashboard() {
  const { products, purchases, sales } = useStore();
  const navigate = useNavigate();
  const todayISO = new Date().toISOString().slice(0, 10);

  // Memoize calculations for performance
  const todaysSales = useMemo(() => {
    return sales
      .filter((s) => (s.date || "").slice(0, 10) === todayISO)
      .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  }, [sales, todayISO]);

  const totalProducts = products.length;

  const lowStock = useMemo(() => {
    return products.filter((p) => p.stock <= (p.reorder || 5));
  }, [products]);

  const lowStockMessage = useMemo(() => {
    if (!lowStock.length) return "All good!";
    const names = lowStock.map((p) => p.name);
    if (names.length <= 3) return names.join(", ");
    return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
  }, [lowStock]);

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <StatCard title="Total Sales Today" value={`₹ ${todaysSales.toFixed(2)}`} icon={DollarSign} color="indigo" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="Total Products" value={totalProducts} icon={Package} color="green" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Low Stock Alerts"
            value={lowStock.length}
            sub={lowStockMessage}
            icon={AlertTriangle}
            color={lowStock.length ? "red" : "green"}
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-card p-6 rounded-2xl shadow-lg border border-border">
          <h3 className="text-xl font-semibold mb-4 border-b border-border pb-3 text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Recent Activity
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* --- RECENT PURCHASES SECTION (Fixed NaN issue) --- */}
            <div>
              <div className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Recent Purchases
              </div>
              <ul className="divide-y divide-border">
                {purchases.slice(0, 6).map((p, idx) => (
                  <motion.li 
                    key={p.purchaseId || idx} // Fallback key if ID is missing
                    className={`py-3 px-2 flex justify-between items-center rounded transition-colors ${idx % 2 === 0 ? 'hover:bg-accent/30' : 'hover:bg-accent/50'}`}
                    whileHover={{ x: 4 }}
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">{p.supplierName || "Unknown Supplier"}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.date ? new Date(p.date).toLocaleDateString() : "No Date"}
                      </div>
                    </div>
                    {/* ✅ FIX: Added fallback (Number(p.total) || 0) to prevent NaN */}
                    <div className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                      ₹ {(Number(p.total) || 0).toFixed(2)}
                    </div>
                  </motion.li>
                ))}
                {!purchases.length && (
                  <li className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <PackageX className="w-8 h-8 opacity-50" />
                    No purchases yet.
                  </li>
                )}
              </ul>
            </div>

            <div>
              <div className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Recent Sales
              </div>
              <ul className="divide-y divide-border">
                {sales.slice(0, 6).map((s, idx) => (
                  <motion.li 
                    key={s.saleId || idx} 
                    className={`py-3 px-2 flex justify-between items-center rounded transition-colors ${idx % 2 === 0 ? 'hover:bg-accent/30' : 'hover:bg-accent/50'}`}
                    whileHover={{ x: 4 }}
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">{s.customerName || "Walk-in"}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.date ? new Date(s.date).toLocaleDateString() : "No Date"}
                      </div>
                    </div>
                    {/* Safety check added here as well */}
                    <div className="font-semibold text-sm text-indigo-600 dark:text-indigo-400">
                      ₹ {(Number(s.total) || 0).toFixed(2)}
                    </div>
                  </motion.li>
                ))}
                {!sales.length && (
                  <li className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <PackageX className="w-8 h-8 opacity-50" />
                    No sales yet.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-br from-card to-accent/20 p-6 rounded-2xl shadow-lg border border-border h-fit">
          <h3 className="text-xl font-semibold mb-4 border-b border-border pb-3 text-foreground">Quick Actions</h3>
          <div className="space-y-4">
            <div className="text-muted-foreground text-sm">Use these shortcuts to quickly add new records.</div>
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/sales/add")}
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all font-medium shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                <DollarSign className="w-5 h-5" />
                New Sale
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/purchase/add")}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all font-medium shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                New Purchase
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}