// StatCard component file
import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ title, value, sub, icon: Icon, color = "indigo" }) {
  const colorClasses = {
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "from-indigo-500 to-purple-500",
      shadow: "hover:shadow-indigo-500/20 dark:hover:shadow-indigo-500/30"
    },
    green: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "from-emerald-500 to-teal-500",
      shadow: "hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/30"
    },
    red: {
      bg: "bg-red-50 dark:bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      border: "from-red-500 to-orange-500",
      shadow: "hover:shadow-red-500/20 dark:hover:shadow-red-500/30"
    },
  };

  const colors = colorClasses[color];

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`bg-card p-6 rounded-2xl shadow-lg border-2 border-transparent bg-gradient-to-br from-card to-card hover:border-opacity-100 transition-all duration-300 hover:shadow-xl ${colors.shadow} relative overflow-hidden group`}
    >
      {/* Gradient Border Effect */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${colors.border} -z-10 blur-sm`} />
      
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</div>
        <motion.div 
          className={`p-3 rounded-xl ${colors.bg} ${colors.text} relative`}
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="w-6 h-6" />
          {/* Pulse animation for icon background */}
          <div className={`absolute inset-0 rounded-xl ${colors.bg} animate-ping opacity-20`} />
        </motion.div>
      </div>

      <div className="mt-2">
        <motion.div 
          className="text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {value}
        </motion.div>
        {sub && (
          <div className="text-sm mt-2 text-muted-foreground font-medium flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${colors.bg} ${colors.text}`} />
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  );
}
