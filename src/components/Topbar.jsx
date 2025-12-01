import React from "react";
import { Search, LogOut } from "lucide-react";
import ThemeToggle from "./common/ThemeToggle";

export default function Topbar({ search, setSearch, user, settings, onLogout }) {
  const userName = user?.name || user?.ownerName || "Owner";
  const storeName = settings?.storeName || user?.storeName || "My Store";

  return (
    <header className="flex items-center justify-between bg-card/80 backdrop-blur-md p-4 border-b border-border sticky top-0 z-10 transition-all duration-300">
      <div className="relative w-96 group">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product, barcode, or transaction..."
          className="pl-10 pr-4 py-2 border border-input focus:border-primary focus:ring-2 focus:ring-primary/20
          rounded-full w-full transition-all duration-200 ease-in-out text-sm outline-none bg-muted/50 focus:bg-background shadow-sm text-foreground"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold text-foreground">{storeName}</div>
          <div className="text-xs text-muted-foreground">{userName}</div>
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2 border-background ring-2 ring-emerald-100 dark:ring-emerald-900">
          {storeName.charAt(0)}
        </div>
        <ThemeToggle />
        <button
          onClick={onLogout}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
