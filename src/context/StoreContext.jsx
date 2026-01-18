import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useToast } from "./ToastContext";
import { useDialog } from "./DialogContext";
import { nextInvoiceId } from "../utils/storage"; 

const StoreContext = createContext();

export function useStore() {
    return useContext(StoreContext);
}

export function StoreProvider({ user, children }) {
    const toast = useToast();
    const dialog = useDialog();

    // ✅ LIVE Backend URL
    const API_BASE_URL = "https://smart-store-backend.onrender.com/api"; 

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
        };
    };

    // ********** STATE MANAGEMENT **********
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [ledgers, setLedgers] = useState([]); 
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [receipts, setReceipts] = useState([]);
    const [payments, setPayments] = useState([]);
    
    // ✅ Settings State
    const [settings, setSettings] = useState({
        storeName: user?.storeName || "",
        ownerName: user?.ownerName || "",
        address: user?.address || "",
        phone: user?.phone || user?.mobile || "",
        email: user?.email || "",
        gst: user?.gst || user?.gstNo || ""
    });

    // ********** 1. DATA FETCHING (SAFE MODE) **********
    const refreshAllData = useCallback(async () => {
        const headers = getAuthHeaders();

        // ✅ SAFE FETCH FUNCTION (For Lists)
        const fetchSafe = async (endpoint) => {
            try {
                const res = await fetch(`${API_BASE_URL}/${endpoint}`, { headers });
                const contentType = res.headers.get("content-type");
                
                if (res.ok && contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    return Array.isArray(data) ? data : []; 
                }
            } catch (e) {
                console.warn(`Failed to load ${endpoint}:`, e);
            }
            return [];
        };

        // ✅ SAFE FETCH PROFILE (For Object Data)
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/stores/profile`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    return data; 
                }
            } catch (e) {
                console.warn("Failed to load profile:", e);
            }
            return null;
        };

        try {
            // Fetch all data including profile
            const [p, s, pur, sal, rec, pay, cust, profileData] = await Promise.all([
                fetchSafe("products"),
                fetchSafe("suppliers"),
                fetchSafe("purchases"),
                fetchSafe("sales"),
                fetchSafe("receipts"),
                fetchSafe("payments"),
                fetchSafe("customers"),
                fetchProfile() // ✅ Fetch Profile
            ]);

            setProducts(p);
            setSuppliers(s);
            setPurchases(pur);
            setSales(sal);
            setReceipts(rec);
            setPayments(pay);
            setLedgers(cust);

            // ✅ FIX: Explicitly map profile data to state keys
            if (profileData) {
                setSettings({
                    storeName: profileData.storeName || "",
                    ownerName: profileData.ownerName || "",
                    address: profileData.address || "",
                    email: profileData.email || "",
                    // Handle backend variations
                    phone: profileData.phone || profileData.mobile || "", 
                    gst: profileData.gst || profileData.gstNo || ""
                });
            }

        } catch (error) {
            console.error("Global Fetch Error:", error);
        } finally {
            setIsAppLoading(false);
        }
    }, []);

    // ********** INFINITE LOOP PREVENTION & AUTO LOAD **********
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            refreshAllData();
        }
    }, [refreshAllData]); 

    // ********** HELPER: GENERIC API REQUEST **********
    const apiRequest = async (endpoint, method, body = null) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method,
                headers: getAuthHeaders(),
                body: body ? JSON.stringify(body) : null,
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                if (response.status === 204) return null;
                throw new Error(`Server Error (${response.status}): Feature may not exist.`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || "Request failed");
            }
            return data;
        } catch (error) {
            console.error(`API Error (${method} ${endpoint}):`, error);
            toast.error(error.message);
            throw error;
        }
    };

    // ********** CRUD OPERATIONS **********
    
    // 2. PRODUCTS
    async function addOrUpdateProduct(form) {
        try {
            // ✅ FIX: Use _id if available, otherwise id
            const dbId = form._id || form.id;
            
            if (dbId) {
                await apiRequest(`products/${dbId}`, "PUT", form);
                toast.success("Product updated");
            } else {
                await apiRequest("products", "POST", form);
                toast.success("Product added");
            }
            refreshAllData(); 
        } catch (e) {}
    }

    async function deleteProduct(id) {
        if (!await dialog.confirm({ title: "Delete Product", type: "danger" })) return;
        try {
            await apiRequest(`products/${id}`, "DELETE");
            toast.success("Product deleted");
            refreshAllData();
        } catch (e) {}
    }

    // 3. SUPPLIERS
    async function addSupplier(data) {
        try {
            await apiRequest("suppliers", "POST", data);
            toast.success("Supplier added");
            refreshAllData();
        } catch (e) {}
    }

    async function editSupplier(id, data) {
        try {
            // ✅ FIX: Ensure DB ID
            const dbId = data._id || id;
            await apiRequest(`suppliers/${dbId}`, "PUT", data);
            toast.success("Supplier updated");
            refreshAllData();
        } catch (e) {}
    }

    async function deleteSupplier(id) {
        if (!await dialog.confirm({ title: "Delete Supplier", type: "danger" })) return;
        try {
            await apiRequest(`suppliers/${id}`, "DELETE");
            toast.success("Supplier deleted");
            refreshAllData();
        } catch (e) {}
    }

    // 4. CUSTOMERS
    async function addLedger(data) {
        try {
            await apiRequest("customers", "POST", data);
            toast.success("Customer added");
            refreshAllData();
        } catch (e) {}
    }

    async function editLedger(id, data) {
        try {
            const dbId = data._id || id;
            await apiRequest(`customers/${dbId}`, "PUT", data);
            toast.success("Customer updated");
            refreshAllData();
        } catch (e) {}
    }

    async function deleteLedger(id) {
        if (!await dialog.confirm({ title: "Delete Customer", type: "danger" })) return;
        try {
            await apiRequest(`customers/${id}`, "DELETE");
            toast.success("Customer deleted");
            refreshAllData();
        } catch (e) {}
    }

    // 5. PURCHASES
    async function addPurchase(data) {
        const payload = {
            ...data,
            purchaseId: nextInvoiceId(purchases, "PUR"),
            date: data.date || new Date().toISOString(),
        };
        try {
            await apiRequest("purchases", "POST", payload);
            toast.success("Purchase saved successfully");
            refreshAllData(); 
        } catch (e) {}
    }

    async function updatePurchase(id, data) {
        try {
            // ✅ FIX: This fixes the 404/CastError on Purchase Edit
            const dbId = data._id || data.id || id;
            
            await apiRequest(`purchases/${dbId}`, "PUT", data);
            toast.success("Purchase updated");
            refreshAllData();
        } catch (e) {}
    }

    async function deletePurchase(id) {
        if (!await dialog.confirm({ title: "Delete Purchase", type: "danger" })) return;
        try {
            await apiRequest(`purchases/${id}`, "DELETE");
            toast.success("Purchase deleted");
            refreshAllData();
        } catch (e) {}
    }

    // 6. SALES
    async function addSale(data) {
        const insufficient = data.lines.find((ln) => {
            const p = products.find((x) => x.id === ln.productId);
            return !p || Number(ln.qty) > Number(p.stock);
        });
        if (insufficient) {
            return toast.error(`Insufficient stock for item: ${insufficient.name || 'Unknown'}`);
        }

        const payload = {
            ...data,
            saleId: nextInvoiceId(sales, "SAL"), 
            date: data.date || new Date().toISOString(),
        };

        try {
            await apiRequest("sales", "POST", payload);
            toast.success("Sale completed successfully");
            refreshAllData();
        } catch (e) {}
    }

    async function updateSale(id, data) {
        try {
            // ✅ FIX: Use Mongo ID for sales update
            const dbId = data._id || data.id || id;
            await apiRequest(`sales/${dbId}`, "PUT", data);
            toast.success("Sale updated");
            refreshAllData();
        } catch (e) {}
    }

    async function deleteSale(id) {
        if (!await dialog.confirm({ title: "Delete Sale", type: "danger" })) return;
        try {
            await apiRequest(`sales/${id}`, "DELETE");
            toast.success("Sale deleted");
            refreshAllData();
        } catch (e) {}
    }

    // 7. FINANCE
    async function addReceipt(data) {
        try {
            await apiRequest("receipts", "POST", { ...data, id: `REC-${Date.now()}` });
            toast.success("Receipt added");
            refreshAllData();
        } catch (e) {}
    }
    async function deleteReceipt(id) {
        if (!await dialog.confirm({ title: "Delete Receipt", type: "danger" })) return;
        try {
            await apiRequest(`receipts/${id}`, "DELETE");
            toast.success("Receipt deleted");
            refreshAllData();
        } catch (e) {}
    }

    async function addPayment(data) {
        try {
            await apiRequest("payments", "POST", { ...data, id: `PAY-${Date.now()}` });
            toast.success("Payment added");
            refreshAllData();
        } catch (e) {}
    }
    async function deletePayment(id) {
        if (!await dialog.confirm({ title: "Delete Payment", type: "danger" })) return;
        try {
            await apiRequest(`payments/${id}`, "DELETE");
            toast.success("Payment deleted");
            refreshAllData();
        } catch (e) {}
    }

    // ✅ FIXED: RECEIVE PAYMENT LOGIC (With Robust Debugging & Name Matching)
    async function receivePayment(paymentData) {
        const { customerName, amount } = paymentData;
        let remainingAmount = Number(amount);

        console.log("Processing Payment for:", customerName, "Amount:", amount);

        // 1. Normalize name for comparison (remove extra spaces, lower case)
        const cleanName = customerName.trim().toLowerCase();

        // 2. Find unpaid bills for this customer (Oldest First)
        // Note: We check against the normalized name
        const pendingSales = sales
            .filter(s => {
                const sName = s.customerName ? s.customerName.trim().toLowerCase() : "";
                return sName === cleanName && s.paymentStatus !== "Paid";
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date)); 

        console.log("Found Pending Bills:", pendingSales.length);

        try {
            // 3. Pay off each bill one by one
            for (const sale of pendingSales) {
                if (remainingAmount <= 0) break;

                const currentPaid = Number(sale.amountPaid || 0);
                const currentTotal = Number(sale.total || 0);
                const pendingOnBill = currentTotal - currentPaid;

                let payForThisBill = 0;

                if (remainingAmount >= pendingOnBill) {
                    // Fully pay this bill
                    payForThisBill = pendingOnBill;
                    remainingAmount -= pendingOnBill;
                } else {
                    // Partially pay this bill
                    payForThisBill = remainingAmount;
                    remainingAmount = 0;
                }

                // Calculate new status
                const newPaid = currentPaid + payForThisBill;
                const newBalance = currentTotal - newPaid;
                // Buffer for floating point errors
                const newStatus = newBalance <= 1 ? "Paid" : "Partial"; 

                // Backend Update Call
                // Use _id (Mongo ID) preferably, fallback to id
                const dbId = sale._id || sale.id; 
                
                console.log(`Updating Bill ${sale.saleId} (${dbId}): Paid +${payForThisBill}, New Status: ${newStatus}`);

                await apiRequest(`sales/${dbId}`, "PUT", {
                    ...sale,
                    amountPaid: newPaid,
                    balanceDue: newBalance,
                    paymentStatus: newStatus
                });
            }

            // 4. Always create a Receipt for record keeping (This updates Ledger Balance)
            await apiRequest("receipts", "POST", { 
                ...paymentData, 
                id: `REC-${Date.now()}`,
                note: remainingAmount > 0 ? "Advance / Overpayment" : "Bill Payment"
            });

            toast.success("Payment Success! Ledger & Sales Updated.");
            
            // 5. Force Refresh All Data to reflect changes immediately
            await refreshAllData();

        } catch (error) {
            console.error("Payment Update Failed:", error);
            toast.error("Failed to update sales records");
        }
    }

    // 8. SETTINGS UPDATE
    async function updateSettings(newSettings) {
        try {
            await apiRequest("stores/profile", "PUT", newSettings);
            
            setSettings(prev => ({
                ...prev,
                ...newSettings,
                phone: newSettings.mobile || newSettings.phone || prev.phone,
                gst: newSettings.gstNo || newSettings.gst || prev.gst
            }));
            
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...storedUser, ...newSettings }));

            toast.success("Settings updated successfully");
        } catch (e) {
            console.error("Settings Update Failed:", e);
        }
    }

    const value = {
        isAppLoading, refreshAllData,
        products, suppliers, ledgers, purchases, sales, receipts, payments, settings, 
        setSettings: updateSettings,
        
        addSupplier, editSupplier, deleteSupplier,
        addLedger, editLedger, deleteLedger,
        addOrUpdateProduct, deleteProduct,
        addPurchase, updatePurchase, deletePurchase,
        addSale, updateSale, deleteSale,
        addReceipt, deleteReceipt,
        addPayment, deletePayment,
        
        receivePayment // ✅ Exposed Function
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
}