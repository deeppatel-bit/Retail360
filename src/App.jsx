import React, { useState, useEffect } from "react";
import { ToastProvider } from "./context/ToastContext";
import { DialogProvider } from "./context/DialogContext";
import { ThemeProvider } from "./context/ThemeContext";

import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import LandingPage from "./components/LandingPage";
import LoginPage from "./components/auth/LoginPage";
import AdminLoginPage from "./components/auth/AdminLoginPage";
import AdminDashboard from "./components/admin/AdminDashboard";
import StoreApp from "./components/store/StoreApp";
import { StoreProvider } from "./context/StoreContext";

import { readLS, writeLS } from "./utils/storage";

const LS_USER = "smartstore_user";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DialogProvider>
          <AppContent />
        </DialogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState(() => readLS(LS_USER, null));
  const navigate = useNavigate();

  useEffect(() => {
    writeLS(LS_USER, user);
  }, [user]);

  function handleLogin(userData) {
    setUser(userData);
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem(LS_USER);
    navigate("/");
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
      />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />} 
      />
      <Route 
        path="/admin/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <AdminLoginPage onLogin={handleLogin} />} 
      />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute user={user}>
            {user?.role === "admin" ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <StoreProvider key={user?.storeId} user={user}>
                <StoreApp user={user} onLogout={handleLogout} />
              </StoreProvider>
            )}
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}
