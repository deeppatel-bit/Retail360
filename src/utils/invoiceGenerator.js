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

  // --- COLORS (Based on Image) ---
  const colors = {
    primary: [44, 62, 80],     // Dark Slate Blue (Header Text)
    accent: [52, 73, 94],      // Grand Total Background
    grayLine: [200, 200, 200], // Light dividers
    lightBg: [240, 240, 240],  // Table Header Background
    text: [40, 40, 40]         // Standard Text
  };

  // ==========================================
  // 1. HEADER SECTION (CENTERED)
  // ==========================================
  
  // Store Name (Dynamic)
  doc.setFontSize(26);
  doc.setTextColor(...colors.primary);
  doc.setFont("helvetica", "bold");
  const storeName = storeSettings?.storeName || "MY STORE";
  doc.text(storeName, 105, 20, { align: "center" }); // 105 = Center of A4

  // Top Divider Line
  doc.setDrawColor(...colors.grayLine);
  doc.setLineWidth(0.5);
  doc.line(30, 25, 180, 25);

  // Address & Contact (Centered)
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

  // Bottom Divider Line
  doc.line(30, yPos, 180, yPos);
  
  // "INVOICE" Title
  yPos += 10;
  doc.setFontSize(18);
  doc.setTextColor(...colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 105, yPos, { align: "center" });

  // ==========================================
  // 2. META DETAILS (Left & Right)
  // ==========================================
  yPos += 12;
  doc.setDrawColor(230, 230, 230); // Very light gray for separators
  doc.line(14, yPos - 5, 196, yPos - 5); // Line above Invoice No

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");

  // Left Side: Invoice No
  doc.text(`Invoice No: ${sale.saleId}`, 14, yPos);

  // Right Side: Date
  const dateStr = new Date(sale.date).toLocaleDateString("en-IN");
  doc.text(`Date:   ${dateStr}`, 196, yPos, { align: "right" });

  yPos += 6;
  // Right Side: Payment Mode
  doc.text(`Payment Mode: ${sale.paymentMode || "Cash"}`, 196, yPos, { align: "right" });

  doc.line(14, yPos + 2, 196, yPos + 2); // Line below details

  // ==========================================
  // 3. BILL TO SECTION
  // ==========================================
  yPos += 10;
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
  // 4. ITEMS TABLE (Style matched to image)
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
      const netAmount = grossAmount - discAmount; // Excluding Tax for now to match structure
      
      // Note: If your system includes Tax in amount, adjust logic here. 
      // The image shows Subtotal, then CGST/SGST added.
      
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
    theme: 'plain', // Clean look
    headStyles: { 
      fillColor: [...colors.lightBg], // Light Gray Header
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
      0: { halign: 'left', cellWidth: 'auto' }, // Item Name
      1: { halign: 'center' }, // Qty
      2: { halign: 'right' },  // Rate
      3: { halign: 'center' }, // Discount
      4: { halign: 'right' }   // Amount
    },
    // Add bottom border to table header
    didDrawCell: (data) => {
       if (data.section === 'head') {
         doc.setDrawColor(200, 200, 200);
         doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
       }
       // Add bottom border to body rows
       if (data.section === 'body') {
         doc.setDrawColor(240, 240, 240);
         doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
       }
    }
  });

  // ==========================================
  // 5. TOTALS SECTION (Image Style)
  // ==========================================
  const finalY = doc.lastAutoTable.finalY + 5;
  
  // Logic for Tax Split (Assuming 18% GST split into 9% CGST + 9% SGST)
  // You can adjust this based on your actual data
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
    margin: { left: 110 }, // Push to right side
    theme: 'plain',
    styles: { 
        fontSize: 10, 
        cellPadding: 2, 
        halign: 'right',
        textColor: 0 
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Labels
      1: { fontStyle: 'bold' } // Values
    },
    didParseCell: function (data) {
      // Style the Grand Total Row (Dark Blue Background, White Text)
      if (data.row.index === 3) {
        data.cell.styles.fillColor = [...colors.accent];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 11;
        // Add some padding adjustment visually if needed
      }
    }
  });

  // ==========================================
  // 6. FOOTER (Centered with Lines)
  // ==========================================
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 30;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  
  // Left line
  doc.line(50, footerY, 80, footerY);
  // Right line
  doc.line(130, footerY, 160, footerY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...colors.primary);
  doc.text("Thank you for shopping with us!", 105, footerY + 1.5, { align: "center" });

  // Save PDF
  doc.save(`${storeSettings?.storeName || "Retail360"}_Invoice_${sale.saleId}.pdf`);
};