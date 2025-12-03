import React from "react";
import { Search, LogOut, Menu } from "lucide-react";
import { motion } from "framer-motion";
import ThemeToggle from "./common/ThemeToggle";

export default function Topbar({ search, setSearch, user, settings, onLogout, onToggleSidebar }) {
  const userName = user?.name || user?.ownerName || "Owner";
  const storeName = settings?.storeName || user?.storeName || "My Store";

  return (
    <header className="flex items-center justify-between bg-card/80 backdrop-blur-md p-4 border-b border-border sticky top-0 z-10 transition-all duration-300 gap-4">
      
      {/* Mobile Menu Toggle */}
      <button 
        onClick={onToggleSidebar}
        className="lg:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <Menu size={24} />
      </button>

      <motion.div 
        className="relative flex-1 max-w-md group"
        whileFocus={{ scale: 1.02 }}
      >
        <motion.div
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors"
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.3 }}
        >
          <Search className="w-5 h-5" />
        </motion.div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="pl-10 pr-4 py-2 border border-input focus:border-primary focus:ring-2 focus:ring-primary/20
          rounded-full w-full transition-all duration-200 ease-in-out text-sm outline-none bg-muted/50 focus:bg-background shadow-sm text-foreground focus:shadow-md focus:scale-[1.01]"
        />
      </motion.div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">{storeName}</div>
          <div className="text-xs text-muted-foreground">{userName}</div>
        </div>
        <motion.div 
          className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2 border-background ring-2 ring-emerald-100 dark:ring-emerald-900"
          animate={{ 
            boxShadow: [
              "0 0 0 0 rgba(16, 185, 129, 0.4)",
              "0 0 0 10px rgba(16, 185, 129, 0)",
              "0 0 0 0 rgba(16, 185, 129, 0)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {storeName.charAt(0)}
        </motion.div>
        <ThemeToggle />
        <motion.button
          onClick={onLogout}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </motion.button>
      </div>
    </header>
  );
}
