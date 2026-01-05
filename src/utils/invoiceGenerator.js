import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (sale, storeSettings, products) => {
  if (!sale) return;

  const doc = new jsPDF();

  // --- Helpers ---
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

  // --- COLORS ---
  const colors = {
    primary: [44, 62, 80],     
    accent: [52, 73, 94],      
    grayLine: [200, 200, 200], 
    lightBg: [240, 240, 240],  
    text: [40, 40, 40]         
  };

  // ==========================================
  // 1. HEADER SECTION (CENTERED)
  // ==========================================
  
  // Store Name
  doc.setFontSize(26);
  doc.setTextColor(...colors.primary);
  doc.setFont("helvetica", "bold");
  const storeName = storeSettings?.storeName || "MY STORE";
  doc.text(storeName, 105, 20, { align: "center" });

  // Top Divider
  doc.setDrawColor(...colors.grayLine);
  doc.setLineWidth(0.5);
  doc.line(30, 25, 180, 25);

  // Address
  doc.setFontSize(10);
  doc.setTextColor(...colors.text);
  doc.setFont("helvetica", "normal");
  
  let yPos = 32;
  if (storeSettings?.address) {
    doc.text(storeSettings.address, 105, yPos, { align: "center" });
    yPos += 5;
  }
  
  const contactParts = [];
  if (storeSettings?.phone) contactParts.push(`Phone: ${storeSettings.phone}`);
  if (storeSettings?.gst) contactParts.push(`GSTIN: ${storeSettings.gst}`);
  
  if (contactParts.length > 0) {
    doc.text(contactParts.join(" | "), 105, yPos, { align: "center" });
    yPos += 6;
  }

  // Bottom Divider
  doc.line(30, yPos, 180, yPos);
  
  // "INVOICE" Title
  yPos += 10;
  doc.setFontSize(18);
  doc.setTextColor(...colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 105, yPos, { align: "center" });

  // ==========================================
  // 2. META DETAILS (INVOICE NO, GST, DATE)
  // ==========================================
  yPos += 12;
  doc.setDrawColor(230, 230, 230);
  doc.line(14, yPos - 5, 196, yPos - 5); 

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");

  // --- LEFT SIDE: Invoice No & Customer GST ---
  doc.text(`Invoice No: ${sale.saleId}`, 14, yPos);
  
  // ✅ NEW LOGIC: Show Customer GST below Invoice No if exists
  if (sale.customerGst) {
      yPos += 5; // Move down a bit
      doc.setFontSize(9);
      doc.setTextColor(80); // Slightly lighter for GST
      doc.text(`GSTIN: ${sale.customerGst}`, 14, yPos);
      doc.setFontSize(10);
      doc.setTextColor(0); // Reset color
      yPos -= 5; // Reset Y for right side alignment
  }

  // --- RIGHT SIDE: Date & Payment Mode ---
  const dateStr = new Date(sale.date).toLocaleDateString("en-IN");
  doc.text(`Date:   ${dateStr}`, 196, yPos, { align: "right" });

  const rightY = sale.customerGst ? yPos + 5 : yPos + 6; // Adjust spacing based on GST presence
  doc.text(`Payment Mode: ${sale.paymentMode || "Cash"}`, 196, rightY, { align: "right" });

  const dividerY = sale.customerGst ? yPos + 8 : yPos + 8;
  doc.line(14, dividerY, 196, dividerY); 

  // ==========================================
  // 3. BILL TO SECTION
  // ==========================================
  yPos = dividerY + 8;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("Bill To:", 14, yPos);

  yPos += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  doc.text(sale.customerName || "Walk-in Customer", 14, yPos);
  
  if (sale.customerPhone) {
    yPos += 5;
    doc.text(`Mobile: ${sale.customerPhone}`, 14, yPos);
  }

  // ==========================================
  // 4. ITEMS TABLE
  // ==========================================
  const tableStartY = yPos + 8;
  
  const tableColumn = ["Item Name", "Qty", "Rate", "Discount", "Amount"];
  const tableRows = [];

  let calculatedSubtotal = 0;

  if (sale.lines && Array.isArray(sale.lines)) {
    sale.lines.forEach((line) => {
      const pName = getProductName(line);
      const qty = Number(line.qty);
      const price = Number(line.price);
      const discountPercent = Number(line.discountPercent || 0);
      
      const grossAmount = qty * price;
      const discAmount = (grossAmount * discountPercent) / 100;
      const netAmount = grossAmount - discAmount; 
      
      calculatedSubtotal += netAmount;

      tableRows.push([
        pName,
        qty,
        formatCurrency(price),
        discountPercent > 0 ? `${discountPercent}%` : "0%",
        formatCurrency(netAmount)
      ]);
    });
  }

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: tableStartY,
    theme: 'plain',
    headStyles: { 
      fillColor: [...colors.lightBg], 
      textColor: 0,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 3
    },
    styles: { 
      fontSize: 10, 
      cellPadding: 3, 
      valign: 'middle',
      textColor: 0,
      lineColor: [230, 230, 230],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { halign: 'left' }, 
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'center' }, 
      4: { halign: 'right' }  
    },
    didDrawCell: (data) => {
       if (data.section === 'head' || data.section === 'body') {
         doc.setDrawColor(230, 230, 230);
         doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
       }
    }
  });

  // ==========================================
  // 5. TOTALS SECTION
  // ==========================================
  const finalY = doc.lastAutoTable.finalY + 5;
  
  const taxAmount = (sale.total - calculatedSubtotal); 
  const cgst = taxAmount / 2;
  const sgst = taxAmount / 2;

  autoTable(doc, {
    body: [
      ["Subtotal:", `Rs. ${formatCurrency(calculatedSubtotal)}`],
      ["CGST (9%):", `Rs. ${formatCurrency(cgst)}`],
      ["SGST (9%):", `Rs. ${formatCurrency(sgst)}`],
      ["GRAND TOTAL:", `Rs. ${formatCurrency(sale.total)}`]
    ],
    startY: finalY,
    margin: { left: 110 }, 
    theme: 'plain',
    styles: { 
        fontSize: 10, 
        cellPadding: 2, 
        halign: 'right',
        textColor: 0 
    },
    columnStyles: {
      0: { cellWidth: 40 }, 
      1: { fontStyle: 'bold' } 
    },
    didParseCell: function (data) {
      if (data.row.index === 3) {
        data.cell.styles.fillColor = [...colors.accent];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 11;
      }
    }
  });

  // ==========================================
  // 6. FOOTER
  // ==========================================
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 30;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(50, footerY, 80, footerY);
  doc.line(130, footerY, 160, footerY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...colors.primary);
  doc.text("Thank you for shopping with us!", 105, footerY + 1.5, { align: "center" });

  doc.save(`${storeSettings?.storeName || "Invoice"}_${sale.saleId}.pdf`);
};