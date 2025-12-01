import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Package, Truck, ShoppingCart, DollarSign, BarChart2, Settings, BookOpen, CreditCard } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/products", label: "Products", icon: Package },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/purchase", label: "Purchase", icon: ShoppingCart },
  { to: "/sales", label: "Sales", icon: DollarSign },
  { to: "/receipts", label: "Receipts", icon: CreditCard },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/ledger", label: "Ledger", icon: BookOpen },
  { to: "/reports", label: "Reports", icon: BarChart2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

import { motion } from "framer-motion";

export default function Sidebar() {
  return (

    <aside className="w-64 bg-card/90 backdrop-blur-md border-r border-border flex flex-col shadow-lg z-20">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-extrabold text-primary tracking-tight flex items-center gap-2">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            🛍️
          </motion.div>
          Retail<span className="text-foreground">360</span>
        </h1>
      </div>

      <nav className="p-4 flex-grow">
        <ul className="space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <li key={it.to}>
                <NavLink
                  to={it.to}
                  className={({ isActive }) =>
                    `relative w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group overflow-hidden ${isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-primary/10 rounded-lg"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                        {it.label}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border text-sm text-muted-foreground">
        <p>Version 1.1</p>
      </div>
    </aside>
  );
}
