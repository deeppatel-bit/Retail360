import React, { useState, useEffect } from "react";
import { X, Save, RefreshCw, Lock, Unlock } from "lucide-react";
import { useDialog } from "../../context/DialogContext";

export default function StoreForm({ initialData, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        storeId: "",
        password: "",
        storeName: "",
        ownerName: "",
        mobile: "",
        email: "",
        address: "",
        planType: "Yearly",
        startDate: new Date().toISOString().split("T")[0],
        expiryDate: "", // Will be calculated
        status: "active",
    });

    const [credentialsLocked, setCredentialsLocked] = useState(!!initialData);
    const dialog = useDialog();

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setCredentialsLocked(true);
        } else {
            generateCredentials();
            setCredentialsLocked(false);
            // Default: Yearly Plan starting Today
            calculateExpiry("Yearly", new Date().toISOString().split("T")[0]);
        }
    }, [initialData]);

    function generateCredentials() {
        const randomId = Math.floor(1000 + Math.random() * 9000).toString();
        const randomPass = Math.random().toString(36).slice(-8);
        setFormData((prev) => ({ ...prev, storeId: randomId, password: randomPass }));
    }

    // ✅ New: Calculate Expiry Date based on Plan
    const calculateExpiry = (plan, start) => {
        if (!start) return;
        const startDateObj = new Date(start);
        let expiryDateObj = new Date(startDateObj);

        if (plan === "Monthly") {
            expiryDateObj.setMonth(expiryDateObj.getMonth() + 1);
        } else if (plan === "Yearly") {
            expiryDateObj.setFullYear(expiryDateObj.getFullYear() + 1);
        } else if (plan === "Lifetime") {
            expiryDateObj.setFullYear(expiryDateObj.getFullYear() + 100); // 100 Years
        }

        const expiryISO = expiryDateObj.toISOString().split("T")[0];

        setFormData(prev => ({
            ...prev,
            planType: plan,
            startDate: start,
            expiryDate: expiryISO
        }));
    };

    // ✅ Updated Handle Change
    function handleChange(e) {
        const { name, value } = e.target;

        // If Plan or Start Date changes, recalculate expiry
        if (name === "planType") {
            calculateExpiry(value, formData.startDate);
        } else if (name === "startDate") {
            calculateExpiry(formData.planType, value);
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        onSave(formData);
    }

    async function handleUnlockCredentials() {
        const confirmed = await dialog.confirm({
            title: "Edit Credentials?",
            message: "Changing the Store ID or Password will require the store owner to login again with the new details. Are you sure?",
            type: "warning",
            confirmText: "Yes, Unlock",
        });
        if (confirmed) {
            setCredentialsLocked(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">
                        {initialData ? "Edit Store Details" : "Register New Store"}
                    </h2>
                    <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* KYC Section */}
                    <section>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">KYC Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Store Name</label>
                                <input
                                    type="text"
                                    name="storeName"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Owner Name</label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Mobile Number</label>
                                <input
                                    type="tel"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Email ID</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-1">Address / City</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Credentials Section */}
                    <section className="bg-muted/30 p-4 rounded-xl border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Login Credentials</h3>
                                {credentialsLocked && (
                                    <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded flex items-center gap-1">
                                        <Lock size={10} /> Locked
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {credentialsLocked ? (
                                    <button
                                        type="button"
                                        onClick={handleUnlockCredentials}
                                        className="text-xs flex items-center gap-1 text-primary hover:text-primary/90 font-medium bg-card px-2 py-1 rounded border border-primary/20 shadow-sm"
                                    >
                                        <Unlock size={12} /> Edit Credentials
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={generateCredentials}
                                        className="text-xs flex items-center gap-1 text-primary hover:text-primary/90 font-medium"
                                    >
                                        <RefreshCw size={14} /> Auto-Generate
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Store ID (Unique)</label>
                                <input
                                    type="text"
                                    name="storeId"
                                    value={formData.storeId}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border border-input rounded-lg outline-none font-mono transition-colors ${credentialsLocked ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        }`}
                                    required
                                    readOnly={credentialsLocked}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                                <input
                                    type="text"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border border-input rounded-lg outline-none font-mono transition-colors ${credentialsLocked ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        }`}
                                    required
                                    readOnly={credentialsLocked}
                                />
                            </div>
                        </div>
                    </section>

                    {/* ✅ Subscription Section (Updated) */}
                    <section>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Subscription & License</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Plan Type</label>
                                <select
                                    name="planType"
                                    value={formData.planType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                                >
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
                                    <option value="Lifetime">Lifetime</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} // Allow manual override
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground font-semibold text-emerald-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium bg-background ${formData.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                                        }`}
                                >
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2.5 rounded-xl border border-input text-foreground font-medium hover:bg-accent transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 shadow-lg shadow-primary/20 transition-colors flex items-center gap-2"
                        >
                            <Save size={18} />
                            Save Store Details
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}