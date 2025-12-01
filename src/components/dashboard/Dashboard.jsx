import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../StatCard";
import { DollarSign, Package, AlertTriangle } from "lucide-react";
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
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-card p-6 rounded-xl shadow-lg border border-border">
          <h3 className="text-xl font-semibold mb-4 border-b border-border pb-2 text-foreground">Recent Activity</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-semibold text-foreground mb-2">Recent Purchases</div>
              <ul className="divide-y divide-border">
                {purchases.slice(0, 6).map((p) => (
                  <li key={p.purchaseId} className="py-2 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm text-foreground">{p.supplierName}</div>
                      <div className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()}</div>
                    </div>
                    <div className="font-semibold text-sm text-foreground">₹ {Number(p.total).toFixed(2)}</div>
                  </li>
                ))}
                {!purchases.length && <li className="py-2 text-muted-foreground text-sm">No purchases yet.</li>}
              </ul>
            </div>

            <div>
              <div className="font-semibold text-foreground mb-2">Recent Sales</div>
              <ul className="divide-y divide-border">
                {sales.slice(0, 6).map((s) => (
                  <li key={s.saleId} className="py-2 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm text-foreground">{s.customerName}</div>
                      <div className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString()}</div>
                    </div>
                    <div className="font-semibold text-sm text-foreground">₹ {Number(s.total).toFixed(2)}</div>
                  </li>
                ))}
                {!sales.length && <li className="py-2 text-muted-foreground text-sm">No sales yet.</li>}
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-card p-6 rounded-xl shadow-lg border border-border h-fit">
          <h3 className="text-xl font-semibold mb-4 border-b border-border pb-2 text-foreground">Quick Actions</h3>
          <div className="space-y-4">
            <div className="text-muted-foreground text-sm">Use these shortcuts to quickly add new records.</div>
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/sales/add")}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-sm"
              >
                New Sale
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/purchase/add")}
                className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm"
              >
                New Purchase
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}