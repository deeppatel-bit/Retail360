// ReportsPage component file
import React from "react";
import { BarChart2, Package } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground">Business Reports</h2>

      <div className="bg-card p-6 rounded-xl shadow border border-border">
        <h3 className="text-xl font-semibold mb-4 text-foreground">Report Tools</h3>

        <p className="text-muted-foreground mb-4">
          Generate detailed sales, purchase and stock reports here.
        </p>

        <div className="flex gap-3">
          <button className="px-4 py-2 border border-border rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center gap-2 transition-colors">
            <BarChart2 className="w-5" />
            Generate Sales Report
          </button>

          <button className="px-4 py-2 border border-border rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center gap-2 transition-colors">
            <Package className="w-5" />
            Export Stock Data
          </button>
        </div>
      </div>
    </div>
  );
}
