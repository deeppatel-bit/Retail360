import React from 'react';

// Table Skeleton for list pages
export function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="p-4">
                  <div className="h-4 bg-muted rounded w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="p-4">
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Card Skeleton for grid layouts
export function CardSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card p-5 rounded-xl border border-border animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-muted rounded-lg"></div>
            <div className="flex gap-2">
              <div className="w-6 h-6 bg-muted rounded"></div>
              <div className="w-6 h-6 bg-muted rounded"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Stat Card Skeleton for dashboard
export function StatSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card p-6 rounded-xl shadow-sm border border-border animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-muted rounded-lg"></div>
            <div className="w-8 h-8 bg-muted rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-24"></div>
            <div className="h-4 bg-muted rounded w-32"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
