import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateInvoice = (sale, storeSettings) => {
  const doc = new jsPDF();

  // 1. Store Details (Header)
  doc.setFontSize(22);
  doc.text(storeSettings?.storeName || "My Store", 14, 20);
  
  doc.setFontSize(10);
  doc.text(storeSettings?.address || "", 14, 28);
  doc.text(`Phone: ${storeSettings?.phone || ""}`, 14, 34);
  
  // 2. Invoice Details (Right Side)
  doc.setFontSize(10);
  const date = new Date(sale.date).toLocaleDateString();
  doc.text(`Invoice No: ${sale.saleId}`, 140, 20);
  doc.text(`Date: ${date}`, 140, 26);
  doc.text(`Customer: ${sale.customerName}`, 140, 32);

  // Line Separator
  doc.line(14, 40, 196, 40);

  // 3. Table Header & Data
  const tableColumn = ["#", "Item", "Qty", "Price", "Disc%", "Tax%", "Total"];
  const tableRows = [];

  sale.lines.forEach((line, index) => {
    const totalLine = (Number(line.qty) * Number(line.price)).toFixed(2);
    const itemData = [
      index + 1,
      line.name || "Item",
      line.qty,
      line.price,
      line.discountPercent || 0,
      line.taxPercent || 0,
      totalLine,
    ];
    tableRows.push(itemData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] } // Indigo Color
  });

  // 4. Totals (Bottom)
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.text(`Subtotal: ${Number(sale.subtotal || 0).toFixed(2)}`, 140, finalY);
  doc.text(`Discount: -${Number(sale.discount || 0).toFixed(2)}`, 140, finalY + 6);
  doc.text(`Tax: +${Number(sale.tax || 0).toFixed(2)}`, 140, finalY + 12);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total: ${Number(sale.total).toFixed(2)}`, 140, finalY + 22);

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", 105, 290, null, null, "center");

  // Save PDF
  doc.save(`Invoice_${sale.saleId}.pdf`);
};