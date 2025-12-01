export function readLS(key, fallback) {
    try {
        const s = localStorage.getItem(key);
        return s ? JSON.parse(s) : fallback;
    } catch {
        return fallback;
    }
}

export function writeLS(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

export function nextInvoiceId(list, prefix) {
    const year = new Date().getFullYear();
    const idsThisYear = list
        .map((i) => i.purchaseId || i.saleId)
        .filter(Boolean)
        .filter((s) => s.startsWith(prefix + "-" + year));
    const lastSeq = idsThisYear
        .map((s) => parseInt(s.split("-").pop(), 10))
        .filter(Number.isFinite)
        .sort((a, b) => b - a)[0] || 0;
    const next = (lastSeq + 1).toString().padStart(4, "0");
    return `${prefix}-${year}-${next}`;
}
