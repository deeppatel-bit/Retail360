import React, { useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "../../context/StoreContext";
import PaginationControls from "../common/PaginationControls";

const ITEMS_PER_PAGE = 9; // 3x3 grid

export default function SuppliersPage() {
    const { suppliers, addSupplier, editSupplier, deleteSupplier } = useStore();
    const [showForm, setShowForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState("name"); // name, recent

    const filteredSuppliers = useMemo(() => {
        let data = suppliers.filter((s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.contact && s.contact.toLowerCase().includes(search.toLowerCase()))
        );

        if (sortBy === "name") {
            data.sort((a, b) => a.name.localeCompare(b.name));
        }
        // Add other sort options if needed

        return data;
    }, [suppliers, search, sortBy]);

    const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);
    const paginatedSuppliers = filteredSuppliers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    function handleSave(supplier) {
        if (editingSupplier) {
            editSupplier(editingSupplier.id, supplier);
        } else {
            addSupplier(supplier);
        }
        setShowForm(false);
        setEditingSupplier(null);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
                    <p className="text-muted-foreground">Manage your supplier contacts</p>
                </div>
                <button
                    onClick={() => {
                        setEditingSupplier(null);
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                >
                    <Plus size={20} />
                    Add Supplier
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl shadow-sm border border-border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-background text-foreground"
                    />
                </div>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-background text-foreground"
                >
                    <option value="name">Sort by Name</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedSuppliers.map((supplier) => (
                    <motion.div
                        key={supplier.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center font-bold text-lg">
                                {supplier.name.charAt(0)}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingSupplier(supplier);
                                        setShowForm(true);
                                    }}
                                    className="text-muted-foreground hover:text-blue-600 transition-colors"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => deleteSupplier(supplier.id)}
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <h3 className="font-bold text-foreground mb-1">{supplier.name}</h3>

                        {supplier.contact && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Phone size={14} />
                                {supplier.contact}
                            </div>
                        )}

                        {supplier.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Mail size={14} />
                                {supplier.email}
                            </div>
                        )}

                        {supplier.address && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground/80 mt-2">
                                <MapPin size={14} />
                                <span className="line-clamp-1">{supplier.address}</span>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {paginatedSuppliers.length === 0 && (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <p className="text-muted-foreground">No suppliers found</p>
                </div>
            )}

            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {showForm && (
                <SupplierForm
                    initial={editingSupplier}
                    onSave={handleSave}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingSupplier(null);
                    }}
                />
            )}
        </div>
    );
}

function SupplierForm({ initial, onSave, onCancel }) {
    const [form, setForm] = useState(
        initial || {
            name: "",
            contact: "",
            email: "",
            address: "",
            gst: "",
        }
    );

    function handleSubmit(e) {
        e.preventDefault();
        onSave(form);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border"
            >
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">
                        {initial ? "Edit Supplier" : "Add New Supplier"}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Supplier Name *
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-background text-foreground"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Contact Number
                        </label>
                        <input
                            type="tel"
                            value={form.contact}
                            onChange={(e) => setForm({ ...form, contact: e.target.value })}
                            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-background text-foreground"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-background text-foreground"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Address
                        </label>
                        <textarea
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-background text-foreground"
                            rows="2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            GST Number
                        </label>
                        <input
                            type="text"
                            value={form.gst}
                            onChange={(e) => setForm({ ...form, gst: e.target.value })}
                            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-background text-foreground"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-accent/50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
