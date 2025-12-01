// StatCard component file
import React from "react";

export default function StatCard({ title, value, sub, icon: Icon, color = "indigo" }) {
  const colorClasses = {
    indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    green: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <div className="bg-card p-5 rounded-xl shadow-lg border border-border transition duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className={`p-2 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-1">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {sub && <div className="text-xs mt-1 text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
