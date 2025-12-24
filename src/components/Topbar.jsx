import React, { useState, useMemo } from "react";
import { Search, LogOut, Menu, Bell } from "lucide-react"; // Bell ઉમેર્યું
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./common/ThemeToggle";
import { useStore } from "../context/StoreContext"; // useStore લાવો

export default function Topbar({ search, setSearch, user, settings, onLogout, onToggleSidebar }) {
  const { products } = useStore(); // Products અહીં લાવો
  const [showNotifications, setShowNotifications] = useState(false);

  const userName = user?.name || user?.ownerName || "Owner";
  const storeName = settings?.storeName || user?.storeName || "My Store";

  // Low Stock ગણતરી
  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stock <= (p.reorder || 5));
  }, [products]);

  return (
    <header className="flex items-center justify-between bg-card/80 backdrop-blur-md p-4 border-b border-border sticky top-0 z-10 transition-all duration-300 gap-4">
      
      {/* ... (Mobile Menu & Search Code Same as before) ... */}
      <button onClick={onToggleSidebar} className="lg:hidden p-2 text-muted-foreground hover:text-primary transition-colors">
        <Menu size={24} />
      </button>

      <motion.div className="relative flex-1 max-w-md group" whileFocus={{ scale: 1.02 }}>
         <motion.div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="w-5 h-5" />
         </motion.div>
         <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-10 pr-4 py-2 border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-full w-full transition-all duration-200 text-sm outline-none bg-muted/50 focus:bg-background shadow-sm text-foreground"
         />
      </motion.div>

      <div className="flex items-center gap-4">
        
        {/* ✅ Notification Bell */}
        <div className="relative">
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-muted-foreground hover:text-primary transition-colors relative"
            >
                <Bell size={20} />
                {lowStockItems.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                        <div className="p-3 border-b border-border font-semibold text-sm">
                            Notifications ({lowStockItems.length})
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {lowStockItems.length === 0 ? (
                                <p className="p-4 text-sm text-muted-foreground text-center">All stocks are good! 🎉</p>
                            ) : (
                                lowStockItems.map(p => (
                                    <div key={p.id} className="p-3 border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-sm">{p.name}</span>
                                            <span className="text-xs font-bold text-red-500">{p.stock} left</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Reorder point: {p.reorder}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* ... (User Profile & Theme Toggle Code Same as before) ... */}
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">{storeName}</div>
          <div className="text-xs text-muted-foreground">{userName}</div>
        </div>
        <ThemeToggle />
        <motion.button onClick={onLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Logout">
          <LogOut size={20} />
        </motion.button>
      </div>
    </header>
  );
}