import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

const DialogContext = createContext(null);

export function useDialog() {
    return useContext(DialogContext);
}

export function DialogProvider({ children }) {
    const [dialog, setDialog] = useState(null);

    const confirm = useCallback(({ title, message, type = "danger", confirmText = "Confirm", cancelText = "Cancel" }) => {
        return new Promise((resolve) => {
            setDialog({
                title,
                message,
                type,
                confirmText,
                cancelText,
                onConfirm: () => {
                    setDialog(null);
                    resolve(true);
                },
                onCancel: () => {
                    setDialog(null);
                    resolve(false);
                },
            });
        });
    }, []);

    return (
        <DialogContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {dialog && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={dialog.onCancel}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-full ${dialog.type === "danger" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">{dialog.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{dialog.message}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                                <button
                                    onClick={dialog.onCancel}
                                    className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {dialog.cancelText}
                                </button>
                                <button
                                    onClick={dialog.onConfirm}
                                    className={`px-4 py-2 text-white font-medium rounded-lg shadow-sm transition-colors ${dialog.type === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
                                        }`}
                                >
                                    {dialog.confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DialogContext.Provider>
    );
}
