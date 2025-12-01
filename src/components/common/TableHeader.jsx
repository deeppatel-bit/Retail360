import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function TableHeader({ columns, sortConfig, onSort }) {
  return (
    <thead className="bg-gray-50">
      <tr>
        {columns.map((col) => (
          <th
            key={col.key}
            scope="col"
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
            onClick={() => col.sortable && onSort(col.key)}
          >
            <div className="flex items-center gap-1">
              {col.label}
              {col.sortable && (
                <span className="text-gray-400">
                  {sortConfig.key === col.key ? (
                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                  ) : (
                    <ArrowUpDown size={14} />
                  )}
                </span>
              )}
            </div>
          </th>
        ))}
        <th scope="col" className="relative px-6 py-3">
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  );
}
