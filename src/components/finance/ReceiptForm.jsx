import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";

import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
// ✅ 1. SearchableDropdown ઈમ્પોર્ટ કરો
import SearchableDropdown from "../common/SearchableDropdown";

export default function ReceiptForm() {
    // ✅ 2. ledgers (customers) ને StoreContext માંથી લાવો
    const { addReceipt, ledgers } = useStore();
    const toast = useToast();
    const navigate = useNavigate();

    const [customerName, setCustomerName] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [mode, setMode] = useState("Cash");
    const [note, setNote] = useState("");

    function handleSubmit(e) {
        e.preventDefault();
        if (!customerName || !amount) {
            toast.error("Please fill all required fields");
            return;
        }

        addReceipt({
            customerName,
            amount: Number(amount),
            date: new Date(date).toISOString(),
            mode,
            note
        });
        toast.success("Receipt saved successfully!");
        navigate("/receipts");
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-foreground">New Receipt (Money In)</h2>

            <form onSubmit={handleSubmit} className="bg-card p-6 rounded-xl shadow-lg border border-border space-y-6">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Customer Name</label>
                    {/* ✅ 3. Input ની જગ્યાએ SearchableDropdown મૂકો */}
                    <SearchableDropdown
                        options={ledgers.map((customer) => ({ value: customer.name, label: customer.name }))}
                        value={customerName}
                        onChange={(val) => setCustomerName(val)}
                        placeholder="Select or type customer name..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Amount (₹)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-lg font-semibold bg-background text-foreground"
                            placeholder="0.00"
                            required
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-background text-foreground"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Payment Mode</label>
                    <select
                        value={mode}
                        onChange={e => setMode(e.target.value)}
                        className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-background text-foreground"
                    >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Note (Optional)</label>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="w-full border-input border px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-background text-foreground"
                        rows="3"
                        placeholder="Any remarks..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate("/receipts")}
                        className="px-6 py-2 border border-input text-foreground rounded-lg hover:bg-accent font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md font-medium flex items-center gap-2"
                    >
                        <Save size={18} /> Save Receipt
                    </button>
                </div>
            </form>
        </div>
    );
}