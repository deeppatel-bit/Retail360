import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Package, Truck, ShoppingCart, DollarSign, BarChart2, Settings, BookOpen, CreditCard, X } from "lucide-react";

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

export default function Sidebar({ isOpen, onClose }) {
  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card/90 backdrop-blur-md border-r border-border flex flex-col shadow-lg transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="p-6 border-b border-border bg-gradient-to-br from-card to-accent/10 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-primary tracking-tight flex items-center gap-2">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
          >
            <span className="text-2xl">🛍️</span>
          </motion.div>
          Retail<span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">360</span>
        </h1>
        
        {/* Mobile Close Button */}
        <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-destructive transition-colors">
          <X size={24} />
        </button>
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
                    `relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group overflow-hidden ${isActive ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <>
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-primary/10 rounded-lg"
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                          <motion.div
                            layoutId="activeBorder"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-purple-600 rounded-r"
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </>
                      )}
                      <motion.span 
                        className="relative z-10 flex items-center gap-3"
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                        {it.label}
                      </motion.span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border text-sm">
        <p className="bg-gradient-to-r from-muted-foreground to-primary/70 bg-clip-text text-transparent font-medium">Version 1.1</p>
      </div>
    </aside>
  );
}
