import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (sale, storeSettings, products) => {
  if (!sale) return;

  const doc = new jsPDF();

  // Helper to resolve product name
  const getProductName = (line) => {
    if (line.product && line.product.name) return line.product.name;
    if (line.name) return line.name;
    if (products && line.productId) {
      const p = products.find(prod => prod.id === line.productId || prod._id === line.productId);
      if (p) return p.name;
    }
    return "Item";
  };

  // --- Colors & Fonts ---
  const primaryColor = [30, 58, 138]; // #1e3a8a (Dark Blue)
  const accentColor = [234, 179, 8];  // #EAB308 (Gold/Yellow)
  
  // --- 1. Header Section ---
  // Store Name (Left)
  doc.setTextColor(...accentColor);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text(storeSettings?.storeName || "MY STORE", 14, 22);

  // Invoice Title (Right)
  doc.setTextColor(...primaryColor);
  doc.setFontSize(24);
  doc.text("INVOICE", 196, 22, { align: "right" });

  // --- 2. Company Info & Invoice Details ---
  doc.setTextColor(80);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Store Address (Left)
  let yPos = 30;
  if (storeSettings?.address) {
    doc.text(storeSettings.address, 14, yPos);
    yPos += 5;
  }
  if (storeSettings?.phone) {
    doc.text(`Phone: ${storeSettings.phone}`, 14, yPos);
    yPos += 5;
  }
  if (storeSettings?.email) {
    doc.text(`Email: ${storeSettings.email}`, 14, yPos);
    yPos += 5;
  }

  // Invoice Details Table (Right)
  autoTable(doc, {
    body: [
      ["INVOICE NO", sale.saleId],
      ["DATE", new Date(sale.date).toLocaleDateString()],
      ["CUSTOMER ID", sale.customerId || "-"] // Assuming customerId might exist
    ],
    startY: 30,
    margin: { left: 130 },
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1, textColor: 80 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [...primaryColor], cellWidth: 35 },
      1: { halign: 'right' }
    }
  });

  // --- 3. Bill To Section ---
  const billToY = Math.max(yPos, doc.lastAutoTable.finalY) + 15;
  
  // Blue Header Bar for Bill To
  doc.setFillColor(...primaryColor);
  doc.rect(14, billToY, 90, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("BILL TO", 16, billToY + 5.5);

  // Customer Details
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(sale.customerName || "Walk-in Customer", 14, billToY + 14);
  // Add customer address/phone if available in sale object
  if (sale.customerPhone) doc.text(`Phone: ${sale.customerPhone}`, 14, billToY + 19);

  // --- 4. Items Table ---
  const tableColumn = ["DESCRIPTION", "QTY", "UNIT PRICE", "DISCOUNT", "AMOUNT"];
  const tableRows = [];

  if (sale.lines && Array.isArray(sale.lines)) {
    sale.lines.forEach((line) => {
      const pName = getProductName(line);
      const qty = Number(line.qty);
      const price = Number(line.price);
      const discount = Number(line.discountPercent || 0); // Discount %
      
      // Calculate Line Amount: Qty * Price - Discount
      const grossAmount = qty * price;
      const discountAmount = (grossAmount * discount) / 100;
      const netAmount = grossAmount - discountAmount;

      const itemData = [
        pName,
        qty,
        price.toFixed(2),
        discount > 0 ? `${discount}%` : "-",
        netAmount.toFixed(2),
      ];
      tableRows.push(itemData);
    });
  }

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: billToY + 25,
    theme: 'striped',
    headStyles: { 
      fillColor: [...primaryColor], 
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'center' 
    },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { halign: 'left' },   // Description
      1: { halign: 'center' }, // Qty
      2: { halign: 'right' },  // Unit Price
      3: { halign: 'right' },  // Discount
      4: { halign: 'right' }   // Amount
    },
    alternateRowStyles: { fillColor: [249, 250, 251] } // Light gray alternating rows
  });

  // --- 5. Footer Summary ---
  const finalY = doc.lastAutoTable.finalY + 10;
  
  // Summary Table (Right Aligned)
  autoTable(doc, {
    body: [
      ["SUBTOTAL", (sale.total - (sale.tax || 0)).toFixed(2)],
      ["TAX", `+${Number(sale.tax || 0).toFixed(2)}`],
      ["TOTAL", Number(sale.total).toFixed(2)]
    ],
    startY: finalY,
    margin: { left: 130 }, // Push to right
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2, textColor: 80 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [...primaryColor] },
      1: { halign: 'right', fontStyle: 'normal' }
    },
    // Make TOTAL row bold/larger
    didParseCell: function (data) {
        if (data.row.index === 2) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 12;
            data.cell.styles.textColor = [...primaryColor];
        }
    }
  });

  // --- 6. Footer Notes & Thank You ---
  const footerY = Math.max(finalY + 30, 270); // Ensure it's at bottom but not overlapping
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("THANK YOU", 105, footerY, { align: "center" });
  
  if (sale.notes) {
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.setFont("helvetica", "italic");
      doc.text(`Note: ${sale.notes}`, 14, footerY + 10);
  }

  // Save PDF
  doc.save(`Invoice_${sale.saleId}.pdf`);
};