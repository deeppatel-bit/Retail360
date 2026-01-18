import React, { useState } from "react";
import { Store, Lock, User, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext"; 

// import api from "../../utils/api"; 

export default function LoginPage({ onLogin }) {
    const [storeId, setStoreId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    // 👇 TAMARI SACHI BACKEND URL
    const API_URL = "https://smart-store-backend.onrender.com/api/auth/store-login";

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Direct Fetch Call (API Utility vagar)
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storeId, password })
            });

            const userData = await response.json();

            if (!response.ok) {
                throw new Error(userData.error || userData.message || "Login failed");
            }
            
            // ✅ MAIN FIX: Token ne alag thi save karo jethi StoreContext ne male
            localStorage.setItem("token", userData.token); 
            
            // User data pan save karo (optional)
            localStorage.setItem("smartstore_user", JSON.stringify(userData));

            // Notify parent
            onLogin({
                storeId: userData.store.storeId,
                name: userData.store.storeName,
                role: "store_owner",
                token: userData.token,
                ...userData.store
            });

            toast.success(`Welcome back!`);
            navigate("/products"); // Safalta pachi Products page par jao

        } catch (err) {
            console.error("Login Error:", err);
            const msg = err.message || "Invalid Credentials or Server Error";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2070&auto=format&fit=crop"
                        alt="Store Background"
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                </div>

                <div className="relative z-10 p-12 text-white max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                            <Store className="text-white" size={40} />
                        </div>
                        <h1 className="text-5xl font-bold mb-4 tracking-tight">Retail360</h1>
                        <p className="text-xl text-slate-300 leading-relaxed">
                            Manage your inventory, sales, and purchases with the most advanced and intuitive store management system.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative">
                
                <button
                    onClick={() => navigate("/")}
                    className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-20"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Back</span>
                </button>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
                        <p className="mt-2 text-muted-foreground">Please sign in to your store account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 flex items-center gap-2">
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Store ID</label>
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                    <input
                                        type="text"
                                        value={storeId}
                                        onChange={(e) => setStoreId(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-input rounded-xl outline-none transition-all bg-background text-foreground focus:ring-2 focus:ring-emerald-500/20"
                                        placeholder="e.g. demo123"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-input rounded-xl outline-none transition-all bg-background text-foreground focus:ring-2 focus:ring-emerald-500/20"
                                        placeholder="••••••••"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white font-semibold py-3.5 rounded-xl shadow-lg transition-all ${
                                loading 
                                ? "bg-gray-400 cursor-not-allowed" 
                                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                            }`}
                        >
                            {loading ? "Signing In..." : "Sign In to Dashboard"}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}