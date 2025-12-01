import React from "react";
import { Store, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding & Image */}
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
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                            <Store className="text-white" size={40} />
                        </div>
                        <h1 className="text-5xl font-bold mb-4 tracking-tight">Retail360</h1>
                        <p className="text-xl text-slate-300 leading-relaxed">
                            The complete solution for modern retail management. Choose your portal to get started.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Selection */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-gray-900">Welcome</h2>
                        <p className="mt-2 text-gray-600">Select your access portal</p>
                    </div>

                    <div className="space-y-4">
                        {/* Store Owner Card */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/login')}
                            className="w-full bg-white p-6 rounded-2xl border-2 border-transparent hover:border-emerald-500 shadow-sm hover:shadow-md transition-all group text-left flex items-center gap-4"
                        >
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Store size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">Store Owner</h3>
                                <p className="text-sm text-gray-500">Login to manage your store</p>
                            </div>
                            <ArrowRight className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
                        </motion.button>

                        {/* Admin Card */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/admin/login')}
                            className="w-full bg-white p-6 rounded-2xl border-2 border-transparent hover:border-indigo-500 shadow-sm hover:shadow-md transition-all group text-left flex items-center gap-4"
                        >
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <ShieldCheck size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">Administrator</h3>
                                <p className="text-sm text-gray-500">System administration access</p>
                            </div>
                            <ArrowRight className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                        </motion.button>
                    </div>

                    <div className="text-center pt-8">
                        <p className="text-sm text-gray-400">
                            Retail360 Management System v1.0
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
