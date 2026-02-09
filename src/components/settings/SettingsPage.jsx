import React, { useState, useEffect, useMemo } from "react";
// ✅ Crown અને Clock આઈકન ઈમ્પોર્ટ કર્યા
import { Save, Store, User, MapPin, Phone, FileText, Crown, Clock } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";

export default function SettingsPage() {
    const { settings, setSettings, isAppLoading } = useStore();
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        storeName: "",
        ownerName: "",
        mobile: "",
        email: "",
        address: "",
        gst: ""
    });

    // 1. ડેટા લોડ કરો
    useEffect(() => {
        if (settings) {
            setFormData({
                storeName: settings.storeName || "",
                ownerName: settings.ownerName || "",
                mobile: settings.phone || settings.mobile || "",
                email: settings.email || "",
                address: settings.address || "",
                gst: settings.gstNo || settings.gst || ""
            });
        }
    }, [settings]);

    // ✅ Expiry Days Calculation (બાકી દિવસો ગણવા)
    const daysLeft = useMemo(() => {
        if (!settings.expiryDate) return 0;
        const diff = new Date(settings.expiryDate) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [settings.expiryDate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            const apiPayload = {
                storeName: formData.storeName,
                ownerName: formData.ownerName,
                email: formData.email,
                address: formData.address,
                phone: formData.mobile,
                mobile: formData.mobile,
                gstNo: formData.gst,
                gst: formData.gst
            };

            const response = await fetch("https://smart-store-backend.onrender.com/api/stores/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(apiPayload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update settings");
            }

            setSettings((prev) => ({
                ...prev,
                ...apiPayload
            }));

            toast.success("Settings updated successfully!");
        } catch (error) {
            console.error("Settings Update Error:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (isAppLoading) return <div className="flex justify-center p-8 text-muted-foreground">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Store Settings</h2>

            {/* ✅ NEW: SUBSCRIPTION BANNER (અહીં ઉમેર્યું) */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-lg border border-slate-700 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                            <Crown size={32} className="text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Current Plan: {settings.planType || "Free"}</h3>
                            <p className="text-slate-300 text-sm">
                                Valid until: <span className="font-mono text-white font-medium">
                                    {settings.expiryDate ? new Date(settings.expiryDate).toLocaleDateString('en-GB') : "N/A"}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                        <Clock className={daysLeft < 30 ? "text-red-400" : "text-emerald-400"} />
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Status</p>
                            <p className={`text-lg font-bold ${daysLeft < 30 ? "text-red-400" : "text-emerald-400"}`}>
                                {daysLeft < 0 ? "Expired" : `${daysLeft} Days Left`}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            </div>

            {/* Store Profile Form */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            <Store size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Store Profile</h3>
                            <p className="text-sm text-muted-foreground">Manage your business details and preferences</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Store Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Store size={16} /> Store Name
                        </label>
                        <input
                            type="text"
                            name="storeName"
                            value={formData.storeName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none bg-background text-foreground"
                            placeholder="Enter store name"
                            required
                        />
                    </div>

                    {/* Owner Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <User size={16} /> Owner Name
                        </label>
                        <input
                            type="text"
                            name="ownerName"
                            value={formData.ownerName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none bg-background text-foreground"
                            placeholder="Enter owner name"
                            required
                        />
                    </div>

                    {/* Mobile */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Phone size={16} /> Mobile Number
                        </label>
                        <input
                            type="tel"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none bg-background text-foreground"
                            placeholder="Enter mobile number"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <FileText size={16} /> Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none bg-background text-foreground"
                            placeholder="Enter email address"
                        />
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <MapPin size={16} /> Address
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none bg-background text-foreground resize-none"
                            placeholder="Enter store address"
                        />
                    </div>

                    {/* GST Number */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <FileText size={16} /> GST Number (Optional)
                        </label>
                        <input
                            type="text"
                            name="gst"
                            value={formData.gst}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none bg-background text-foreground"
                            placeholder="Enter GST number"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="md:col-span-2 flex justify-end pt-4 border-t border-border mt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}