import React, { useState } from "react";
// ✅ Clock આઈકન ઉમેર્યું
import { Plus, Search, Edit, Trash2, Shield, CheckCircle, Calendar, ShieldAlert, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function StoreList({ stores, onAdd, onEdit, onDelete, onToggleStatus }) {
    const [search, setSearch] = useState("");

    const filteredStores = stores.filter(
        (s) =>
            s.storeName.toLowerCase().includes(search.toLowerCase()) ||
            s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
            s.storeId.includes(search)
    );

    // ✅ Expiry Date પરથી દિવસો ગણવાનું ફંક્શન
    const getDaysLeft = (dateStr) => {
        if (!dateStr) return 0;
        const diff = new Date(dateStr) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        placeholder="Search stores, owners, or IDs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
                    />
                </div>
                <button
                    onClick={onAdd}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
                >
                    <Plus size={20} />
                    Add New Store
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl">
                            <CheckCircle size={24} />
                        </div>
                        <span className="text-2xl font-bold text-foreground">
                            {stores.filter((s) => s.status === "active").length}
                        </span>
                    </div>
                    <p className="text-muted-foreground font-medium">Active Stores</p>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-xl">
                            <Calendar size={24} />
                        </div>
                        <span className="text-2xl font-bold text-foreground">
                            {stores.filter((s) => new Date(s.expiryDate) < new Date()).length}
                        </span>
                    </div>
                    <p className="text-muted-foreground font-medium">Expired Licenses</p>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
                            <ShieldAlert size={24} />
                        </div>
                        <span className="text-2xl font-bold text-foreground">
                            {stores.filter((s) => s.status === "suspended").length}
                        </span>
                    </div>
                    <p className="text-muted-foreground font-medium">Suspended</p>
                </div>
            </div>

            {/* Stores Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredStores.map((store) => {
                    // ✅ દરેક સ્ટોર માટે દિવસો ગણો
                    const daysLeft = getDaysLeft(store.expiryDate);

                    return (
                        <motion.div
                            key={store.storeId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground font-bold text-lg">
                                        {store.storeName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-lg">{store.storeName}</h3>
                                        <p className="text-sm text-muted-foreground">ID: {store.storeId}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${store.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'
                                    }`}>
                                    {store.status.toUpperCase()}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                <div>
                                    <p className="text-muted-foreground mb-1">Owner</p>
                                    <p className="font-medium text-foreground">{store.ownerName}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Mobile</p>
                                    <p className="font-medium text-foreground">{store.mobile}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Plan</p>
                                    <p className="font-medium text-foreground">{store.planType}</p>
                                </div>

                                {/* ✅ UPDATED: Expiry Date & Days Left Section */}
                                <div className="col-span-2 bg-muted/30 p-3 rounded-lg flex justify-between items-center border border-border mt-1">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Expires On</p>
                                        <p className="font-medium text-foreground text-sm">
                                            {new Date(store.expiryDate).toLocaleDateString('en-GB')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground text-xs">Validity</p>
                                        <div className={`flex items-center gap-1 font-bold text-sm ${daysLeft < 0 ? 'text-destructive' : daysLeft < 30 ? 'text-amber-600' : 'text-emerald-600'
                                            }`}>
                                            <Clock size={14} />
                                            {daysLeft < 0 ? "Expired" : `${daysLeft} Days Left`}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-border">
                                <button
                                    onClick={() => onEdit(store)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors"
                                >
                                    <Edit size={16} /> Edit
                                </button>
                                <button
                                    onClick={() => onToggleStatus(store.storeId)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${store.status === 'active'
                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-400'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400'
                                        }`}
                                >
                                    <Shield size={16} /> {store.status === 'active' ? 'Suspend' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => onDelete(store.storeId)}
                                    className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}

                {filteredStores.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No stores found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}