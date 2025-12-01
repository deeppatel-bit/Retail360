import React, { useState } from "react";
import { Save, User, Database } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "../../context/ToastContext";
import { useDialog } from "../../context/DialogContext";

import { useStore } from "../../context/StoreContext";

export default function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const [activeTab, setActiveTab] = useState("profile");
  const toast = useToast();
  const dialog = useDialog();

  // Profile Settings State
  const [storeName, setStoreName] = useState(settings?.storeName || "");
  const [address, setAddress] = useState(settings?.address || "");
  const [phone, setPhone] = useState(settings?.phone || "");
  const [gst, setGst] = useState(settings?.gst || "");

  function handleSaveProfile() {
    updateSettings({
      ...settings,
      storeName,
      address,
      phone,
      gst,
    });
    toast.success("Store profile updated successfully!");
  }

  async function handleResetData() {
    const confirmed = await dialog.confirm({
      title: "CRITICAL WARNING: Reset Data",
      message: "This will DELETE ALL sales, purchases, products, and financial data. This action CANNOT be undone. Are you sure?",
      type: "danger",
      confirmText: "DELETE EVERYTHING",
    });

    if (confirmed) {
      // Since we can't easily do a custom prompt with the current dialog, we'll skip the double confirmation or implement a simple one.
      // For now, let's trust the scary modal.
      localStorage.clear();
      toast.success("All data has been reset. Reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "data", label: "Data Management", icon: Database },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-foreground">Settings</h2>

      <div className="flex gap-4 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon size={18} />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabBorder"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-card p-6 rounded-xl shadow-sm border border-border min-h-[400px]">
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-lg">
            <h3 className="text-xl font-semibold text-foreground mb-4">Store Profile</h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Store Name</label>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                placeholder="My Awesome Store"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-24 resize-none bg-background text-foreground"
                placeholder="Store address..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">GSTIN / Tax ID</label>
                <input
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors shadow-sm"
              >
                <Save size={18} /> Save Profile
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "data" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-lg">
            <h3 className="text-xl font-semibold text-destructive mb-4">Danger Zone</h3>

            <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-xl">
              <h4 className="font-bold text-destructive mb-2">Reset Application Data</h4>
              <div className="text-sm text-destructive/80 mb-6 leading-relaxed">
                This action will permanently delete all your data including:
                <ul className="list-disc list-inside mt-2 ml-2">
                  <li>All Products and Stock</li>
                  <li>All Sales and Purchase History</li>
                  <li>All Financial Records (Receipts/Payments)</li>
                  <li>Store Settings and Profiles</li>
                </ul>
                <br />
                <strong>This action cannot be undone.</strong>
              </div>

              <button
                onClick={handleResetData}
                className="w-full px-4 py-3 bg-card border-2 border-destructive text-destructive hover:bg-destructive/10 rounded-lg font-bold transition-colors"
              >
                Reset All Data
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
