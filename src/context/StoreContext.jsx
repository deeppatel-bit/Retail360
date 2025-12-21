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

    // ⚠️ જો લોકલ પર કામ કરતા હોવ તો આ વાપરો: "http://localhost:5000/api"
    // ⚠️ જો લાઈવ હોય તો આ: "https://smart-store-backend.onrender.com/api"
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
    const [settings, setSettings] = useState({
        storeName: user?.storeName || "",
        address: user?.address || "",
        phone: user?.mobile || "",
        gst: ""
    });

    // ********** 1. DATA FETCHING (CRASH PROOF) **********
    const refreshAllData = useCallback(async () => {
        const headers = getAuthHeaders();

        // ✅ SAFE FETCH FUNCTION (આ મહત્વનો સુધારો છે)
        // આ ફંક્શન ચેક કરશે કે ડેટા લિસ્ટ છે કે નહીં.
        const fetchSafe = async (endpoint) => {
            try {
                const res = await fetch(`${API_BASE_URL}/${endpoint}`, { headers });
                const contentType = res.headers.get("content-type");
                
                if (res.ok && contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    
                    // 🛑 CRITICAL FIX: 
                    // જો ડેટા 'Array' (લિસ્ટ) હોય તો જ રિટર્ન કરો.
                    // જો તે 'Object' (જેમ કે Error) હોય, તો ખાલી લિસ્ટ [] મોકલો.
                    return Array.isArray(data) ? data : []; 
                }
            } catch (e) {
                console.warn(`Failed to load ${endpoint}:`, e);
            }
            return []; // એરર આવે તો ખાલી લિસ્ટ, જેથી એપ ક્રેશ ના થાય
        };

        try {
            // બધા ડેટા એકસાથે લાવો (સુરક્ષિત રીતે)
            const [p, s, pur, sal, rec, pay, cust] = await Promise.all([
                fetchSafe("products"),
                fetchSafe("suppliers"),
                fetchSafe("purchases"),
                fetchSafe("sales"),
                fetchSafe("receipts"), // હવે આ ક્રેશ નહીં કરે
                fetchSafe("payments"), // હવે આ ક્રેશ નહીં કરે
                fetchSafe("customers")
            ]);

            // સ્ટેટ અપડેટ કરો
            setProducts(p);
            setSuppliers(s);
            setPurchases(pur);
            setSales(sal);
            setReceipts(rec);
            setPayments(pay);
            setLedgers(cust);

        } catch (error) {
            console.error("Global Fetch Error:", error);
        } finally {
            setIsAppLoading(false);
        }
    }, []);

    // ********** FIX: Infinite Loop Prevention **********
    useEffect(() => {
        // જો યુઝર હોય અને તેનું Store ID હોય તો જ ડેટા મંગાવો
        if (user && user.storeId) {
            console.log("Fetching Data for Store:", user.storeId);
            refreshAllData();
        }
    }, [user?.storeId, refreshAllData]); 

    // ********** HELPER: GENERIC API REQUEST **********
    const apiRequest = async (endpoint, method, body = null) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method,
                headers: getAuthHeaders(),
                body: body ? JSON.stringify(body) : null,
            });

            const contentType = response.headers.get("content-type");
            // HTML error (404/500) હેન્ડલ કરો
            if (!contentType || !contentType.includes("application/json")) {
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

    // ********** 2. PRODUCTS CRUD **********
    async function addOrUpdateProduct(form) {
        try {
            if (form.id) {
                await apiRequest(`products/${form.id}`, "PUT", form);
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

    // ********** 3. SUPPLIERS CRUD **********
    async function addSupplier(data) {
        try {
            await apiRequest("suppliers", "POST", data);
            toast.success("Supplier added");
            refreshAllData();
        } catch (e) {}
    }

    async function editSupplier(id, data) {
        try {
            await apiRequest(`suppliers/${id}`, "PUT", data);
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

    // ********** 4. CUSTOMERS (Ledger) **********
    async function addLedger(data) {
        try {
            await apiRequest("customers", "POST", data);
            toast.success("Customer added");
            refreshAllData();
        } catch (e) {}
    }

    async function editLedger(id, data) {
        try {
            await apiRequest(`customers/${id}`, "PUT", data);
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

    // ********** 5. PURCHASES **********
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
            await apiRequest(`purchases/${id}`, "PUT", data);
            toast.success("Purchase updated");
            refreshAllData();
        } catch (e) {}
    }

    async function deletePurchase(id) {
        if (!await dialog.confirm({ title: "Delete Purchase", message: "Stock adjustments may vary based on backend logic.", type: "danger" })) return;
        try {
            await apiRequest(`purchases/${id}`, "DELETE");
            toast.success("Purchase deleted");
            refreshAllData();
        } catch (e) {}
    }

    // ********** 6. SALES **********
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
            await apiRequest(`sales/${id}`, "PUT", data);
            toast.success("Sale updated");
            refreshAllData();
        } catch (e) {}
    }

    async function deleteSale(id) {
        if (!await dialog.confirm({ title: "Delete Sale", message: "This will revert the transaction.", type: "danger" })) return;
        try {
            await apiRequest(`sales/${id}`, "DELETE");
            toast.success("Sale deleted");
            refreshAllData();
        } catch (e) {}
    }

    // ********** 7. FINANCE **********
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

    // ********** 8. SETTINGS **********
    async function updateSettings(newSettings) {
        setSettings(newSettings); 
        toast.success("Settings saved locally");
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
        addPayment, deletePayment
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
}