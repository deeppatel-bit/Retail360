import React, { useState } from "react";
import { ShieldCheck, Lock, User, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

export default function AdminLoginPage({ onLogin }) {
    const [adminId, setAdminId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const toast = useToast();

    function handleSubmit(e) {
        e.preventDefault();
        setError("");

        // Hardcoded admin credentials for now
        // In a real app, this would verify against a backend or separate secure storage
        if (adminId === "admin" && password === "admin123") {
            onLogin({
                storeId: "ADMIN",
                name: "System Administrator",
                role: "admin",
                isAdmin: true
            });
            toast.success("Welcome, Administrator!");
        } else {
            setError("Invalid admin credentials.");
            toast.error("Access Denied");
        }
    }

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Branding & Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
                        alt="Office Background"
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
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="text-white" size={40} />
                        </div>
                        <h1 className="text-5xl font-bold mb-4 tracking-tight">Admin Portal</h1>
                        <p className="text-xl text-slate-300 leading-relaxed">
                            System configuration, user management, and global settings.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </button>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-foreground">Admin Access</h2>
                        <p className="mt-2 text-muted-foreground">Enter your administrative credentials</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 flex items-center gap-2"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Admin ID</label>
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        value={adminId}
                                        onChange={(e) => setAdminId(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-background text-foreground hover:bg-accent/50 focus:bg-background"
                                        placeholder="Admin Username"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-background text-foreground hover:bg-accent/50 focus:bg-background"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                        >
                            Access Admin Panel
                        </motion.button>
                    </form>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Restricted Area. Authorized Personnel Only.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
