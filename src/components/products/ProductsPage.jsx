import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import PaginationControls from "../common/PaginationControls";
import TableHeader from "../common/TableHeader";

const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  const { products, deleteProduct } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All"); // All, Low Stock

  const uniqueCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [products]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredProducts = useMemo(() => {
    let data = products.filter((p) => {
      const name = p.name ? p.name.toLowerCase() : "";
      const category = p.category ? p.category.toLowerCase() : "";
      const s = search.toLowerCase();
      const matchesSearch = name.includes(s) || category.includes(s);

      const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;

      const matchesStock = stockFilter === "All" || (stockFilter === "Low Stock" && p.stock <= (p.reorder || 5));

      return matchesSearch && matchesCategory && matchesStock;
    });

    if (sortConfig.key) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  }, [products, search, sortConfig, categoryFilter, stockFilter]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'stock', label: 'Stock', sortable: true },
    { key: 'costPrice', label: 'Cost', sortable: true },
    { key: 'sellPrice', label: 'Sell', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">Product Inventory</h2>
        <button
          onClick={() => navigate('/products/new')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5" /> Add New Product
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl shadow-sm border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground"
        >
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => { setStockFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground"
        >
          <option value="All">All Stock</option>
          <option value="Low Stock">Low Stock Only</option>
        </select>
      </div>

      <div className="bg-card rounded-xl shadow border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-border">
            <TableHeader columns={columns} sortConfig={sortConfig} onSort={handleSort} />
            <tbody className="divide-y divide-border">
              {paginatedProducts.map((p) => (
                <tr key={p.id} className="hover:bg-accent/50">
                  <td className="p-3 font-medium text-foreground">{p.name}</td>
                  <td className="p-3 text-muted-foreground">{p.category}</td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${p.stock <= (p.reorder || 5)
                          ? "bg-destructive/10 text-destructive"
                          : "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                        }`}
                    >
                      {p.stock} {p.unit}
                    </span>
                  </td>

                  <td className="p-3 text-foreground">₹ {p.costPrice}</td>
                  <td className="p-3 text-foreground">₹ {p.sellPrice}</td>

                  <td className="p-3 text-right flex gap-2 justify-end">
                    <button
                      onClick={() => navigate(`/products/edit/${p.id}`)}
                      className="p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    >
                      <Edit className="w-4" />
                    </button>

                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="p-1 rounded hover:bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!paginatedProducts.length && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted-foreground">
                    {search ? "No matching products found." : "No products in inventory."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
