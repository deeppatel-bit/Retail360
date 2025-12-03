import React, { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "../PageTransition";

import SidebarComponent from "../Sidebar";
import Topbar from "../Topbar";

import Dashboard from "../dashboard/Dashboard";
import ProductsPage from "../products/ProductsPage";
import ProductForm from "../products/ProductForm";

import PurchaseList from "../purchase/PurchaseList";
import PurchaseForm from "../purchase/PurchaseForm";

import SalesList from "../sales/SalesList";
import SalesForm from "../sales/SalesForm";

import ReportsPage from "../reports/ReportsPage";
import SettingsPage from "../settings/SettingsPage";

import ReceiptList from "../finance/ReceiptList";
import ReceiptForm from "../finance/ReceiptForm";
import PaymentList from "../finance/PaymentList";
import PaymentForm from "../finance/PaymentForm";
import LedgerPage from "../finance/LedgerPage";

import SuppliersPage from "../suppliers/SuppliersPage";

import { useStore } from "../../context/StoreContext";

export default function StoreApp({ user, onLogout }) {
  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { settings } = useStore();

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <SidebarComponent
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Topbar
          search={search}
          setSearch={setSearch}
          onLogout={onLogout}
          user={user}
          settings={settings}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="p-4 md:p-6 overflow-y-auto flex-1 relative">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <PageTransition>
                    <Navigate to="/dashboard" replace />
                  </PageTransition>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                }
              />

              <Route
                path="/products"
                element={
                  <PageTransition>
                    <ProductsPage />
                  </PageTransition>
                }
              />

              <Route
                path="/products/new"
                element={
                  <PageTransition>
                    <ProductForm />
                  </PageTransition>
                }
              />
              <Route
                path="/products/edit/:id"
                element={
                  <PageTransition>
                    <ProductForm />
                  </PageTransition>
                }
              />

              <Route
                path="/suppliers"
                element={
                  <PageTransition>
                    <SuppliersPage />
                  </PageTransition>
                }
              />

              <Route
                path="/purchase"
                element={
                  <PageTransition>
                    <PurchaseList />
                  </PageTransition>
                }
              />
              <Route
                path="/purchase/add"
                element={
                  <PageTransition>
                    <PurchaseForm />
                  </PageTransition>
                }
              />
              <Route
                path="/purchase/edit/:id"
                element={
                  <PageTransition>
                    <PurchaseForm editMode />
                  </PageTransition>
                }
              />

              <Route
                path="/sales"
                element={
                  <PageTransition>
                    <SalesList />
                  </PageTransition>
                }
              />
              <Route
                path="/sales/add"
                element={
                  <PageTransition>
                    <SalesForm />
                  </PageTransition>
                }
              />
              <Route
                path="/sales/edit/:id"
                element={
                  <PageTransition>
                    <SalesForm editMode />
                  </PageTransition>
                }
              />

              <Route
                path="/receipts"
                element={
                  <PageTransition>
                    <ReceiptList />
                  </PageTransition>
                }
              />
              <Route
                path="/receipts/add"
                element={
                  <PageTransition>
                    <ReceiptForm />
                  </PageTransition>
                }
              />

              <Route
                path="/payments"
                element={
                  <PageTransition>
                    <PaymentList />
                  </PageTransition>
                }
              />
              <Route
                path="/payments/add"
                element={
                  <PageTransition>
                    <PaymentForm />
                  </PageTransition>
                }
              />

              <Route
                path="/ledger"
                element={
                  <PageTransition>
                    <LedgerPage />
                  </PageTransition>
                }
              />

              <Route
                path="/reports"
                element={
                  <PageTransition>
                    <ReportsPage />
                  </PageTransition>
                }
              />
              <Route
                path="/settings"
                element={
                  <PageTransition>
                    <SettingsPage />
                  </PageTransition>
                }
              />

              <Route
                path="*"
                element={
                  <PageTransition>
                    <div>Not found</div>
                  </PageTransition>
                }
              />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
