import React, { useState, useEffect } from "react";
import { Users, CheckCircle, Clock, AlertTriangle, Plus, List, Settings } from "lucide-react";
import AdminLayout from "./AdminLayout";
import StoreList from "./StoreList";
import StoreForm from "./StoreForm";
import { useToast } from "../../context/ToastContext";
import { useDialog } from "../../context/DialogContext";
import api from "../../utils/api"; // API ફાઈલ ઈમ્પોર્ટ કરી sukam

export default function AdminDashboard({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [stores, setStores] = useState([]); // શરૂઆતમાં ખાલી એરે
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStore, setEditingStore] = useState(null);

    const toast = useToast();
    const dialog = useDialog();

    // પેજ લોડ થાય ત્યારે ડેટાબેઝમાંથી સ્ટોર લાવો
    useEffect(() => {
        fetchStores();
    }, []);

    async function fetchStores() {
        try {
            const res = await api.get("/stores");
            setStores(res.data);
        } catch (error) {
            console.error("Error fetching stores:", error);
            // જો એરર આવે તો ટોસ્ટ બતાવી શકો છો
        }
    }

    async function handleSaveStore(storeData) {
        try {
            if (editingStore) {
                // Update Store in Database (PUT Request)
                await api.put(`/stores/${storeData.storeId}`, storeData);
                toast.success("Store updated successfully in Database");
            } else {
                // Create New Store in Database (POST Request)
                await api.post("/stores", storeData);
                toast.success("New store registered in Database");
            }

            // ફોર્મ બંધ કરો અને ડેટા રિફ્રેશ કરો
            setIsFormOpen(false);
            setEditingStore(null);
            fetchStores();

        } catch (error) {
            console.error("Save Error:", error);
            const msg = error.response?.data?.error || "Error saving store";
            toast.error(msg);
        }
    }

    async function handleDeleteStore(storeId) {
        const confirmed = await dialog.confirm({
            title: "Delete Store?",
            message: "This will permanently delete the store from the Database. Are you sure?",
            type: "danger",
        });

        if (confirmed) {
            try {
                await api.delete(`/stores/${storeId}`);
                toast.success("Store deleted from Database");
                fetchStores(); // લિસ્ટ રિફ્રેશ કરો
            } catch (error) {
                console.error("Delete Error:", error);
                toast.error("Failed to delete store");
            }
        }
    }

    async function handleToggleStatus(storeId) {
        const store = stores.find(s => s.storeId === storeId);
        if (!store) return;

        const newStatus = store.status === "active" ? "suspended" : "active";

        try {
            // માત્ર સ્ટેટસ અપડેટ કરવા માટે PUT રિક્વેસ્ટ
            await api.put(`/stores/${storeId}`, { ...store, status: newStatus });
            toast.success(`Store ${newStatus} successfully`);
            fetchStores();
        } catch (error) {
            console.error("Status Update Error:", error);
            toast.error("Failed to update status");
        }
    }

    return (
        <AdminLayout
            onLogout={onLogout}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            {activeTab === "dashboard" && (
                <div className="space-y-8">
                    {/* Welcome Section */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
                            <p className="text-muted-foreground">Welcome back, here's what's happening with your clients.</p>
                        </div>
                        <button
                            onClick={() => {
                                setActiveTab("stores");
                                setEditingStore(null);
                                setIsFormOpen(true);
                            }}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        >
                            <Plus size={20} /> Add New Store
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Clients"
                            value={stores.length}
                            icon={Users}
                            color="bg-blue-500"
                            trend="+2 this week"
                        />
                        <StatCard
                            title="Active Licenses"
                            value={stores.filter(s => s.status === 'active').length}
                            icon={CheckCircle}
                            color="bg-emerald-500"
                            subtext="Operational"
                        />
                        <StatCard
                            title="Expiring Soon"
                            value={stores.filter(s => {
                                const days = (new Date(s.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
                                return days > 0 && days <= 30;
                            }).length}
                            icon={Clock}
                            color="bg-amber-500"
                            subtext="Next 30 Days"
                        />
                        <StatCard
                            title="Suspended"
                            value={stores.filter(s => s.status === 'suspended').length}
                            icon={AlertTriangle}
                            color="bg-red-500"
                            subtext="Action Required"
                        />
                    </div>

                    {/* Recent Activity & Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Stores List */}
                        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm p-6">
                            <h3 className="font-bold text-foreground mb-4">Recent Registrations</h3>
                            <div className="space-y-4">
                                {stores.slice(0, 5).map((store, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-accent/50 rounded-xl transition-colors border border-transparent hover:border-border">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-bold">
                                                {store.storeName.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-foreground">{store.storeName}</h4>
                                                <p className="text-xs text-muted-foreground">Owner: {store.ownerName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${store.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                                                {store.status}
                                            </span>
                                            <p className="text-xs text-muted-foreground mt-1">{store.planType}</p>
                                        </div>
                                    </div>
                                ))}
                                {stores.length === 0 && (
                                    <p className="text-muted-foreground text-center py-4">No stores registered yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions / Plan Distribution */}
                        <div className="space-y-6">
                            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                                <h3 className="font-bold text-foreground mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setActiveTab("stores")}
                                        className="w-full text-left px-4 py-3 rounded-xl bg-accent/50 hover:bg-accent text-foreground font-medium transition-colors flex items-center gap-3"
                                    >
                                        <List size={18} /> Manage All Stores
                                    </button>
                                    <button className="w-full text-left px-4 py-3 rounded-xl bg-accent/50 hover:bg-accent text-foreground font-medium transition-colors flex items-center gap-3">
                                        <Settings size={18} /> System Settings
                                    </button>
                                </div>
                            </div>

                            <div className="bg-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-1">Pro Tip</h3>
                                    <p className="text-indigo-200 text-sm mb-4">Check expiring licenses weekly to ensure renewals.</p>
                                    <button
                                        onClick={() => setActiveTab("stores")}
                                        className="bg-white text-indigo-900 px-4 py-2 rounded-lg text-sm font-bold"
                                    >
                                        View Expiring
                                    </button>
                                </div>
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-800 rounded-full opacity-50" />
                                <div className="absolute -top-4 -right-4 w-16 h-16 bg-indigo-700 rounded-full opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "stores" && (
                <>
                    <StoreList
                        stores={stores}
                        onAdd={() => {
                            setEditingStore(null);
                            setIsFormOpen(true);
                        }}
                        onEdit={(store) => {
                            setEditingStore(store);
                            setIsFormOpen(true);
                        }}
                        onDelete={handleDeleteStore}
                        onToggleStatus={handleToggleStatus}
                    />
                    {isFormOpen && (
                        <StoreForm
                            initialData={editingStore}
                            onSave={handleSaveStore}
                            onCancel={() => {
                                setIsFormOpen(false);
                                setEditingStore(null);
                            }}
                        />
                    )}
                </>
            )}
        </AdminLayout>
    );
}

function StatCard({ title, value, icon: Icon, color, subtext, trend }) {
    return (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.replace('bg-', '')}`}>
                    <Icon size={24} className="text-white" />
                </div>
                {trend && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded-full">{trend}</span>}
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            {subtext && <p className="text-muted-foreground/80 text-xs mt-2">{subtext}</p>}
        </div>
    );
}