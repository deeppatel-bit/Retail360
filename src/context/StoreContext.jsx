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
    
    const [settings, setSettings] = useState({
        storeName: user?.storeName || "",
        ownerName: user?.ownerName || "",
        address: user?.address || "",
        phone: user?.phone || user?.mobile || "",
        email: user?.email || "",
        gst: user?.gst || user?.gstNo || ""
    });

    // ********** HELPER: Find Correct MongoDB ID **********
    // આ ફંક્શન સાચું ID શોધી કાઢશે (ભલે તમે Custom ID મોકલો)
    const resolveMongoId = (list, id, data) => {
        // 1. જો ડેટાની અંદર જ _id હોય તો તે વાપરો
        if (data && data._id) return data._id;
        
        // 2. જો id પોતે જ MongoID જેવું દેખાતું હોય (24 અક્ષર)
        if (id && /^[0-9a-fA-F]{24}$/.test(id)) return id;

        // 3. લિસ્ટમાંથી શોધો (Custom ID મેચ થાય તો તેનું _id લો)
        const found = list.find(item => 
            item.id === id || 
            item.purchaseId === id || 
            item.saleId === id || 
            item.productId === id
        );
        
        if (found && found._id) return found._id;

        // 4. કઈ ન મળે તો જે છે તે પાછું આપો
        return id;
    };

    // ********** 1. DATA FETCHING (SAFE MODE) **********
    const refreshAllData = useCallback(async () => {
        const headers = getAuthHeaders();

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
            const [p, s, pur, sal, rec, pay, cust, profileData] = await Promise.all([
                fetchSafe("products"),
                fetchSafe("suppliers"),
                fetchSafe("purchases"),
                fetchSafe("sales"),
                fetchSafe("receipts"),
                fetchSafe("payments"),
                fetchSafe("customers"),
                fetchProfile()
            ]);

            setProducts(p);
            setSuppliers(s);
            setPurchases(pur);
            setSales(sal);
            setReceipts(rec);
            setPayments(pay);
            setLedgers(cust);

            if (profileData) {
                setSettings({
                    storeName: profileData.storeName || "",
                    ownerName: profileData.ownerName || "",
                    address: profileData.address || "",
                    email: profileData.email || "",
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

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            refreshAllData();
        }
    }, [refreshAllData]); 

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
            // ✅ FIX: Use resolveMongoId
            const dbId = resolveMongoId(products, form.id, form);
            
            // Check if form.id exists (meaning update mode) OR if we found a valid dbId
            if (form.id || (dbId && dbId !== form.id)) {
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
            const dbId = resolveMongoId(products, id);
            await apiRequest(`products/${dbId}`, "DELETE");
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
            const dbId = resolveMongoId(suppliers, id, data);
            await apiRequest(`suppliers/${dbId}`, "PUT", data);
            toast.success("Supplier updated");
            refreshAllData();
        } catch (e) {}
    }

    async function deleteSupplier(id) {
        if (!await dialog.confirm({ title: "Delete Supplier", type: "danger" })) return;
        try {
            const dbId = resolveMongoId(suppliers, id);
            await apiRequest(`suppliers/${dbId}`, "DELETE");
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
            const dbId = resolveMongoId(ledgers, id, data);
            await apiRequest(`customers/${dbId}`, "PUT", data);
            toast.success("Customer updated");
            refreshAllData();
        } catch (e) {}
    }

    async function deleteLedger(id) {
        if (!await dialog.confirm({ title: "Delete Customer", type: "danger" })) return;
        try {
            const dbId = resolveMongoId(ledgers, id);
            await apiRequest(`customers/${dbId}`, "DELETE");
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

    // ✅ FIXED UPDATE PURCHASE FUNCTION
    async function updatePurchase(id, data) {
        try {
            // Find correct ID from list if custom ID is passed
            const dbId = resolveMongoId(purchases, id, data);
            
            console.log("Updating Purchase:", { originalId: id, resolvedDbId: dbId });

            await apiRequest(`purchases/${dbId}`, "PUT", data);
            toast.success("Purchase updated");
            refreshAllData();
        } catch (e) {}
    }

    async function deletePurchase(id) {
        if (!await dialog.confirm({ title: "Delete Purchase", type: "danger" })) return;
        try {
            const dbId = resolveMongoId(purchases, id);
            await apiRequest(`purchases/${dbId}`, "DELETE");
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
            const dbId = resolveMongoId(sales, id, data);
            await apiRequest(`sales/${dbId}`, "PUT", data);
            toast.success("Sale updated");
            refreshAllData();
        } catch (e) {}
    }

    async function deleteSale(id) {
        if (!await dialog.confirm({ title: "Delete Sale", type: "danger" })) return;
        try {
            const dbId = resolveMongoId(sales, id);
            await apiRequest(`sales/${dbId}`, "DELETE");
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
            // Receipts usually don't have custom IDs, but safe to check
            const dbId = resolveMongoId(receipts, id); 
            await apiRequest(`receipts/${dbId}`, "DELETE");
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
            const dbId = resolveMongoId(payments, id);
            await apiRequest(`payments/${dbId}`, "DELETE");
            toast.success("Payment deleted");
            refreshAllData();
        } catch (e) {}
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
        
        // receivePayment logic is handled inside components or you can add it back if needed
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
}