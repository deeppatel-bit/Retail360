import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (sale, storeSettings) => {
  if (!sale) return;

  const doc = new jsPDF();

  // 1. Store Details (Header)
  doc.setFontSize(22);
  doc.setTextColor(40);
  doc.text(storeSettings?.storeName || "Retail360 Store", 14, 20);
  
  doc.setFontSize(10);
  doc.text(storeSettings?.address || "", 14, 28);
  doc.text(`Phone: ${storeSettings?.phone || ""}`, 14, 34);
  
  // 2. Invoice Details
  doc.setFontSize(10);
  const date = new Date(sale.date).toLocaleDateString();
  doc.text(`Invoice No: ${sale.saleId}`, 140, 20);
  doc.text(`Date: ${date}`, 140, 26);
  doc.text(`Customer: ${sale.customerName}`, 140, 32);

  // Line Separator
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  // 3. Table Data Setup
  const tableColumn = ["#", "Item", "Qty", "Price", "Total"];
  const tableRows = [];

  if (sale.lines && Array.isArray(sale.lines)) {
    sale.lines.forEach((line, index) => {
      let pName = "Item";
      if (line.product && line.product.name) pName = line.product.name;
      else if (line.name) pName = line.name;
      else if (line.productId) pName = `Product (${line.productId})`;

      const totalLine = (Number(line.qty) * Number(line.price)).toFixed(2);
      
      const itemData = [
        index + 1,
        pName,
        line.qty,
        line.price,
        totalLine,
      ];
      tableRows.push(itemData);
    });
  }

  // ✅ FIX: doc.autoTable ને બદલે autoTable(doc, options) વાપરો
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 133, 244] }
  });

  // 4. Totals (Bottom)
  // autoTable વાપર્યા પછી doc.lastAutoTable અપડેટ થઈ જાય છે
  const finalY = (doc.lastAutoTable?.finalY || 50) + 10;
  
  doc.setFontSize(10);
  doc.text(`Subtotal:`, 140, finalY);
  doc.text(`${Number(sale.subtotal || 0).toFixed(2)}`, 180, finalY, { align: 'right' });
  
  doc.text(`Discount:`, 140, finalY + 6);
  doc.text(`-${Number(sale.discount || 0).toFixed(2)}`, 180, finalY + 6, { align: 'right' });
  
  doc.text(`Tax:`, 140, finalY + 12);
  doc.text(`+${Number(sale.tax || 0).toFixed(2)}`, 180, finalY + 12, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total:`, 140, finalY + 22);
  doc.text(`${Number(sale.total).toFixed(2)}`, 180, finalY + 22, { align: 'right' });

  // 5. Payment Status
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Payment Mode: ${sale.paymentMode || 'Cash'}`, 14, finalY + 22);
  
  // Footer
  doc.setFontSize(8);
  doc.text("Thank you for your business!", 105, 290, null, null, "center");

  // Save PDF
  doc.save(`Invoice_${sale.saleId}.pdf`);
};