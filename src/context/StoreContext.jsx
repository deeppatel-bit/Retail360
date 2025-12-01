import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "./ToastContext";
import { useDialog } from "./DialogContext";
import { readLS, writeLS, nextInvoiceId } from "../utils/storage";

const StoreContext = createContext();

export function useStore() {
    return useContext(StoreContext);
}

export function StoreProvider({ user, children }) {
    const toast = useToast();
    const dialog = useDialog();

    // Prefix keys with storeId to isolate data
    const PREFIX = `store_${user.storeId}_`;

    const LS_PRODUCTS = `${PREFIX}products`;
    const LS_SUPPLIERS = `${PREFIX}suppliers`;
    const LS_PURCHASES = `${PREFIX}purchases`;
    const LS_SALES = `${PREFIX}sales`;
    const LS_RECEIPTS = `${PREFIX}receipts`;
    const LS_PAYMENTS = `${PREFIX}payments`;
    const LS_SETTINGS = `${PREFIX}settings`;

    // data with LocalStorage persistence
    const [products, setProducts] = useState(() =>
        readLS(LS_PRODUCTS, [
            { id: "p1", name: "Rice 5kg", category: "Grocery", unit: "kg", stock: 12, costPrice: 250, sellPrice: 300, reorder: 5 },
            { id: "p2", name: "Notebook", category: "Stationery", unit: "pcs", stock: 40, costPrice: 20, sellPrice: 35, reorder: 10 },
            { id: "p3", name: "Toothpaste", category: "Personal Care", unit: "pcs", stock: 6, costPrice: 60, sellPrice: 90, reorder: 5 },
        ])
    );
    const [suppliers, setSuppliers] = useState(() => readLS(LS_SUPPLIERS, []));
    const [purchases, setPurchases] = useState(() => readLS(LS_PURCHASES, []));
    const [sales, setSales] = useState(() => readLS(LS_SALES, []));
    const [receipts, setReceipts] = useState(() => readLS(LS_RECEIPTS, []));
    const [payments, setPayments] = useState(() => readLS(LS_PAYMENTS, []));
    const [settings, setSettings] = useState(() => readLS(LS_SETTINGS, {
        storeName: user.storeName || "My Store",
        address: user.address || "",
        phone: user.mobile || "",
        gst: ""
    }));

    useEffect(() => writeLS(LS_PRODUCTS, products), [products, LS_PRODUCTS]);
    useEffect(() => writeLS(LS_SUPPLIERS, suppliers), [suppliers, LS_SUPPLIERS]);
    useEffect(() => writeLS(LS_PURCHASES, purchases), [purchases, LS_PURCHASES]);
    useEffect(() => writeLS(LS_SALES, sales), [sales, LS_SALES]);
    useEffect(() => writeLS(LS_RECEIPTS, receipts), [receipts, LS_RECEIPTS]);
    useEffect(() => writeLS(LS_PAYMENTS, payments), [payments, LS_PAYMENTS]);
    useEffect(() => writeLS(LS_SETTINGS, settings), [settings, LS_SETTINGS]);

    // ********** Suppliers CRUD **********
    function addSupplier(supplier) {
        const newSupplier = { ...supplier, id: `sup${Date.now()}` };
        setSuppliers(s => [...s, newSupplier]);
        toast.success("Supplier added successfully");
    }

    function editSupplier(id, updated) {
        setSuppliers(s => s.map(sup => sup.id === id ? { ...sup, ...updated } : sup));
        toast.success("Supplier updated successfully");
    }

    async function deleteSupplier(id) {
        const confirmed = await dialog.confirm({
            title: "Delete Supplier",
            message: "Are you sure you want to delete this supplier?",
            type: "danger",
        });
        if (!confirmed) return;
        setSuppliers(s => s.filter(sup => sup.id !== id));
        toast.success("Supplier deleted");
    }

    // ********** Products CRUD **********
    function addOrUpdateProduct(form) {
        if (!form.name) return toast.error("Name required");
        if (form.id) {
            setProducts((s) => s.map((p) => (p.id === form.id ? { ...p, ...form } : p)));
            toast.success("Product updated successfully");
        } else {
            setProducts((s) => [...s, { ...form, id: `p${Date.now()}` }]);
            toast.success("Product added successfully");
        }
    }
    async function deleteProduct(id) {
        const confirmed = await dialog.confirm({
            title: "Delete Product",
            message: "Are you sure you want to delete this product? This action cannot be undone.",
            type: "danger",
            confirmText: "Delete",
        });
        if (!confirmed) return;
        setProducts((s) => s.filter((p) => p.id !== id));
        toast.success("Product deleted");
    }

    // ********** Purchases **********
    function addPurchase({ supplierName, billNo, date, lines, taxPercent = 0, discountPercent = 0, notes, ...rest }) {
        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;

        const linesResolved = lines.map(l => ({
            ...l,
            taxPercent: l.taxPercent || 0,
            discountPercent: l.discountPercent || 0
        }));

        linesResolved.forEach(l => {
            const qty = Number(l.qty || 0);
            const price = Number(l.price || 0);
            const lineAmount = qty * price;
            const lineDisc = (lineAmount * Number(l.discountPercent || 0)) / 100;
            const lineTax = ((lineAmount - lineDisc) * Number(l.taxPercent || 0)) / 100;

            subtotal += lineAmount;
            totalDiscount += lineDisc;
            totalTax += lineTax;
        });

        const total = subtotal - totalDiscount + totalTax;

        const purchase = {
            purchaseId: nextInvoiceId(purchases, "PUR"),
            supplierName,
            billNo,
            date: date || new Date().toISOString(),
            lines: linesResolved,
            subtotal,
            discount: totalDiscount,
            tax: totalTax,
            total,
            notes,
            paymentStatus: rest.paymentStatus || "Unpaid",
            amountPaid: Number(rest.amountPaid || 0),
            paymentMode: rest.paymentMode || "Cash",
            balanceDue: Number(rest.balanceDue || 0),
        };

        setPurchases((s) => [purchase, ...s]);
        setProducts((prev) =>
            prev.map((p) => {
                const ln = lines.find((l) => l.productId === p.id);
                if (ln && ln.productId) {
                    return { ...p, stock: Number(p.stock || 0) + Number(ln.qty || 0) };
                }
                return p;
            })
        );
    }

    function updatePurchase(id, payload) {
        setPurchases((s) => s.map((p) => (p.purchaseId === id ? { ...p, ...payload } : p)));
    }

    async function deletePurchase(id) {
        const confirmed = await dialog.confirm({
            title: "Delete Purchase",
            message: "Are you sure you want to delete this purchase record? Stock will NOT be reverted.",
            type: "danger",
        });
        if (!confirmed) return;
        setPurchases((s) => s.filter((p) => p.purchaseId !== id));
        toast.success("Purchase deleted");
    }

    // ********** Sales **********
    function addSale({ customerName, date, lines, taxPercent = 0, discountPercent = 0, notes, ...rest }) {
        const linesResolved = lines.map((l) => {
            const p = products.find((x) => x.id === l.productId);
            const price = l.price ? Number(l.price) : (p ? p.sellPrice : 0);
            return { ...l, price, taxPercent: l.taxPercent || 0, discountPercent: l.discountPercent || 0 };
        });

        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;

        linesResolved.forEach(l => {
            const qty = Number(l.qty || 0);
            const price = Number(l.price || 0);
            const lineAmount = qty * price;
            const lineDisc = (lineAmount * Number(l.discountPercent || 0)) / 100;
            const lineTax = ((lineAmount - lineDisc) * Number(l.taxPercent || 0)) / 100;

            subtotal += lineAmount;
            totalDiscount += lineDisc;
            totalTax += lineTax;
        });

        const total = subtotal - totalDiscount + totalTax;

        const sale = {
            saleId: nextInvoiceId(sales, "SAL"),
            customerName,
            date: date || new Date().toISOString(),
            lines: linesResolved,
            subtotal,
            discount: totalDiscount,
            tax: totalTax,
            total,
            notes,
            paymentStatus: rest.paymentStatus || "Unpaid",
            amountPaid: Number(rest.amountPaid || 0),
            paymentMode: rest.paymentMode || "Cash",
            balanceDue: Number(rest.balanceDue || 0),
        };

        const insufficient = linesResolved.find((ln) => {
            const p = products.find((x) => x.id === ln.productId);
            return !p || Number(ln.qty) > Number(p.stock);
        });
        if (insufficient) {
            return toast.error("Not enough stock for some items. Sale aborted.");
        }

        setSales((s) => [sale, ...s]);
        setProducts((prev) =>
            prev.map((p) => {
                const ln = linesResolved.find((l) => l.productId === p.id);
                if (ln && ln.productId) {
                    return { ...p, stock: Math.max(0, Number(p.stock || 0) - Number(ln.qty || 0)), soldToday: (p.soldToday || 0) + Number(ln.qty || 0) };
                }
                return p;
            })
        );
    }

    function updateSale(id, payload) {
        setSales((s) => s.map((x) => (x.saleId === id ? { ...x, ...payload } : x)));
    }

    async function deleteSale(id) {
        const confirmed = await dialog.confirm({
            title: "Delete Sale",
            message: "Are you sure you want to delete this sale? Stock will NOT be reverted.",
            type: "danger",
        });
        if (!confirmed) return;
        setSales((s) => s.filter((x) => x.saleId !== id));
        toast.success("Sale deleted");
    }

    // ********** Finance **********
    function addReceipt(data) {
        const newReceipt = { ...data, id: `REC-${Date.now()}` };
        setReceipts(s => [newReceipt, ...s]);
        toast.success("Receipt added");
    }
    async function deleteReceipt(id) {
        const confirmed = await dialog.confirm({ title: "Delete Receipt", message: "Are you sure?", type: "danger" });
        if (!confirmed) return;
        setReceipts(s => s.filter(x => x.id !== id));
        toast.success("Receipt deleted");
    }

    function addPayment(data) {
        const newPayment = { ...data, id: `PAY-${Date.now()}` };
        setPayments(s => [newPayment, ...s]);
        toast.success("Payment added");
    }
    async function deletePayment(id) {
        const confirmed = await dialog.confirm({ title: "Delete Payment", message: "Are you sure?", type: "danger" });
        if (!confirmed) return;
        setPayments(s => s.filter(x => x.id !== id));
        toast.success("Payment deleted");
    }

    const value = {
        products, suppliers, purchases, sales, receipts, payments, settings, setSettings,
        addSupplier, editSupplier, deleteSupplier,
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
