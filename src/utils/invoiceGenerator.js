import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (sale, storeSettings, products) => {
  if (!sale) return;

  const doc = new jsPDF();

  // --- CONFIGURATION & COLORS ---
  const colors = {
    primary: [30, 58, 138],    // Navy Blue
    secondary: [100, 116, 139], // Slate Gray
    accent: [234, 179, 8],     // Gold/Yellow
    text: [31, 41, 55],        // Dark Gray
    lightBg: [243, 244, 246]   // Light Gray for headers
  };

  const fonts = {
    bold: "helvetica",
    normal: "helvetica"
  };

  // --- HELPERS ---
  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getProductName = (line) => {
    if (line.product && line.product.name) return line.product.name;
    if (line.name) return line.name;
    if (products && line.productId) {
      const p = products.find(prod => prod.id === line.productId || prod._id === line.productId);
      if (p) return p.name;
    }
    return "Item";
  };

  // ==========================================
  // 1. HEADER SECTION
  // ==========================================
  
  let startY = 20;

  // -- LOGO (If available in storeSettings.logoBase64) --
  // Ensure your storeSettings has a valid base64 string (data:image/png;base64,...)
  if (storeSettings?.logo) {
    try {
        doc.addImage(storeSettings.logo, 'PNG', 14, 10, 25, 25); // x, y, w, h
        startY = 40; // Push text down if logo exists
    } catch (e) {
        console.warn("Logo load failed", e);
    }
  }

  // -- STORE DETAILS (Left Side) --
  doc.setFont(fonts.bold, "bold");
  doc.setFontSize(20);
  doc.setTextColor(...colors.primary);
  doc.text(storeSettings?.storeName?.toUpperCase() || "MY STORE", 14, startY);

  doc.setFont(fonts.normal, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.secondary);
  
  let yPos = startY + 6;
  const addressLines = doc.splitTextToSize(storeSettings?.address || "", 80);
  doc.text(addressLines, 14, yPos);
  yPos += (addressLines.length * 4);

  if (storeSettings?.phone) { doc.text(`Phone: ${storeSettings.phone}`, 14, yPos); yPos += 4; }
  if (storeSettings?.email) { doc.text(`Email: ${storeSettings.email}`, 14, yPos); yPos += 4; }
  if (storeSettings?.gst)   { doc.text(`GSTIN: ${storeSettings.gst}`, 14, yPos); }

  // -- INVOICE META DATA (Right Side) --
  autoTable(doc, {
    body: [
      ["INVOICE NO", sale.saleId],
      ["DATE", new Date(sale.date).toLocaleDateString("en-IN")],
      ["PAYMENT MODE", sale.paymentMode || "Cash"]
    ],
    startY: 20,
    margin: { left: 130 },
    theme: 'plain',
    styles: { 
        fontSize: 10, 
        cellPadding: 1.5, 
        halign: 'right',
        textColor: colors.text
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: colors.secondary, cellWidth: 35 },
      1: { fontStyle: 'bold', textColor: colors.primary }
    }
  });

  // ==========================================
  // 2. CUSTOMER / BILL TO
  // ==========================================
  const headerEndY = Math.max(yPos, doc.lastAutoTable.finalY) + 10;

  // Gray Box Background
  doc.setFillColor(...colors.lightBg);
  doc.roundedRect(14, headerEndY, 182, 18, 1, 1, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...colors.secondary);
  doc.text("BILL TO:", 18, headerEndY + 6);

  doc.setFontSize(11);
  doc.setTextColor(...colors.text);
  doc.setFont(fonts.bold, "bold");
  doc.text(sale.customerName || "Walk-in Customer", 18, headerEndY + 12);

  if (sale.customerPhone) {
      doc.setFont(fonts.normal, "normal");
      doc.setFontSize(9);
      doc.text(`Mobile: ${sale.customerPhone}`, 120, headerEndY + 12);
  }

  // ==========================================
  // 3. PRODUCT TABLE
  // ==========================================
  const tableColumn = ["#", "ITEM DESCRIPTION", "QTY", "RATE", "DISC", "TAX %", "TOTAL"];
  const tableRows = [];

  let calculatedSubtotal = 0;

  if (sale.lines && Array.isArray(sale.lines)) {
    sale.lines.forEach((line, index) => {
      const pName = getProductName(line);
      const qty = Number(line.qty);
      const price = Number(line.price);
      const discountPercent = Number(line.discountPercent || 0);
      const taxPercent = Number(line.taxPercent || 0);

      // Math
      const grossAmount = qty * price;
      const discAmount = (grossAmount * discountPercent) / 100;
      const taxableAmount = grossAmount - discAmount;
      const taxAmount = (taxableAmount * taxPercent) / 100;
      const netAmount = taxableAmount + taxAmount;

      calculatedSubtotal += netAmount; // Summing up final line totals

      tableRows.push([
        index + 1,
        pName,
        qty,
        formatCurrency(price),
        discountPercent > 0 ? `${discountPercent}%` : "-",
        taxPercent > 0 ? `${taxPercent}%` : "-",
        formatCurrency(netAmount)
      ]);
    });
  }

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: headerEndY + 22,
    theme: 'grid',
    headStyles: { 
      fillColor: colors.primary, 
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 3, 
      valign: 'middle', 
      textColor: colors.text 
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 }, 
      1: { halign: 'left' },                  
      2: { halign: 'center' },                
      3: { halign: 'right' },                 
      4: { halign: 'center' },                
      5: { halign: 'center' },                
      6: { halign: 'right', fontStyle: 'bold' } 
    },
    alternateRowStyles: { fillColor: [249, 250, 251] }
  });

  // ==========================================
  // 4. FOOTER & TOTALS
  // ==========================================
  const finalY = doc.lastAutoTable.finalY + 5;
  const pageHeight = doc.internal.pageSize.height;

  // -- NOTES & TERMS (Left Side) --
  const notesY = finalY + 5;
  doc.setFontSize(9);
  doc.setFont(fonts.bold, "bold");
  doc.setTextColor(...colors.text);
  doc.text("Terms & Conditions:", 14, notesY);
  
  doc.setFont(fonts.normal, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...colors.secondary);
  const terms = [
    "1. Goods once sold will not be taken back.",
    "2. Subject to local jurisdiction.",
    sale.notes ? `Note: ${sale.notes}` : ""
  ];
  
  let termY = notesY + 5;
  terms.forEach(term => {
      if(term) {
        doc.text(term, 14, termY);
        termY += 4;
      }
  });

  // -- TOTALS TABLE (Right Side) --
  // We use the Sale object totals, but fallback to calculated if needed
  const totalAmount = Number(sale.total);
  const paidAmount = Number(sale.amountPaid || 0);
  const dueAmount = Number(sale.balanceDue || 0);

  autoTable(doc, {
    body: [
      ["Subtotal", formatCurrency(calculatedSubtotal)], // Or use sale.subtotal if your backend sends it
      ["Paid Amount", formatCurrency(paidAmount)],
      ["Balance Due", formatCurrency(dueAmount)],
      ["GRAND TOTAL", `Rs. ${formatCurrency(totalAmount)}`]
    ],
    startY: finalY,
    margin: { left: 120 },
    theme: 'plain',
    styles: { 
        fontSize: 10, 
        cellPadding: 2, 
        halign: 'right',
        textColor: colors.text 
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: colors.secondary },
      1: { fontStyle: 'bold' }
    },
    didParseCell: function (data) {
      // Highlight Balance Due in Red if > 0
      if (data.row.index === 2 && dueAmount > 0.5) {
        data.cell.styles.textColor = [220, 38, 38]; // Red
      }
      // Highlight Grand Total Box
      if (data.row.index === 3) {
        data.cell.styles.fillColor = colors.primary;
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontSize = 12;
      }
    }
  });

  // -- BOTTOM FOOTER --
  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(0.1);
  doc.line(14, pageHeight - 15, 196, pageHeight - 15);

  doc.setFontSize(8);
  doc.setTextColor(...colors.secondary);
  doc.text("Thank you for your business!", 105, pageHeight - 10, { align: "center" });
  doc.text("Generated via Retail360", 196, pageHeight - 10, { align: "right" });

  // SAVE
  doc.save(`Invoice_${sale.saleId}.pdf`);
};