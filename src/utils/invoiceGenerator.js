import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (sale, storeSettings, products) => {
  if (!sale) return;

  const doc = new jsPDF();

  // --- Helper: Product Name શોધવા માટે ---
  const getProductName = (line) => {
    // 1. જો લાઈનમાં જ નામ હોય
    if (line.product && line.product.name) return line.product.name;
    if (line.name) return line.name;
    
    // 2. Products લિસ્ટમાંથી ID દ્વારા શોધો
    if (products && line.productId) {
      const p = products.find(prod => prod.id === line.productId || prod._id === line.productId);
      if (p) return p.name;
    }
    return "Item";
  };

  // --- COLORS ---
  const colorBlue = [30, 58, 138];   // Dark Blue (#1e3a8a) for Headers
  const colorGold = [234, 179, 8];   // Gold (#EAB308) for Store Name
  const colorGray = [80, 80, 80];    // Gray for text

  // ==========================================
  // 1. HEADER SECTION (Store Details)
  // ==========================================
  
  // Store Name
  doc.setFontSize(24);
  doc.setTextColor(...colorGold);
  doc.setFont("helvetica", "bold");
  doc.text(storeSettings?.storeName?.toUpperCase() || "MY STORE", 14, 20);

  // Invoice Title (Right side)
  doc.setFontSize(20);
  doc.setTextColor(...colorBlue);
  doc.text("INVOICE", 196, 20, { align: "right" });

  // Store Address & Contact (Left Side)
  doc.setFontSize(10);
  doc.setTextColor(...colorGray);
  doc.setFont("helvetica", "normal");
  
  let yPos = 28;
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
  if (storeSettings?.gst) {
    doc.text(`GSTIN: ${storeSettings.gst}`, 14, yPos);
  }

  // Invoice Details Table (Right Side)
  autoTable(doc, {
    body: [
      ["Invoice No:", sale.saleId],
      ["Date:", new Date(sale.date).toLocaleDateString("en-IN")],
      ["Payment Mode:", sale.paymentMode || "Cash"]
    ],
    startY: 25,
    margin: { left: 120 }, // Push to right
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1, textColor: 80, halign: 'right' },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [...colorBlue], cellWidth: 40 },
    }
  });

  // ==========================================
  // 2. BILL TO SECTION (Customer)
  // ==========================================
  const billToY = Math.max(yPos, doc.lastAutoTable.finalY) + 12;

  // Blue Bar Background
  doc.setFillColor(...colorBlue);
  doc.rect(14, billToY, 182, 8, 'F'); 

  // "BILL TO" Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", 16, billToY + 5.5);

  // Customer Name & Details
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(sale.customerName || "Walk-in Customer", 14, billToY + 16);
  
  // ==========================================
  // 3. ITEMS TABLE
  // ==========================================
  const tableColumn = ["#", "ITEM DESCRIPTION", "QTY", "PRICE", "DISC", "TOTAL"];
  const tableRows = [];

  if (sale.lines && Array.isArray(sale.lines)) {
    sale.lines.forEach((line, index) => {
      const pName = getProductName(line);
      const qty = Number(line.qty);
      const price = Number(line.price);
      const discountPercent = Number(line.discountPercent || 0);
      
      // Calculate Amounts
      const grossAmount = qty * price;
      const discAmount = (grossAmount * discountPercent) / 100;
      const taxAmount = ((grossAmount - discAmount) * (line.taxPercent || 0)) / 100;
      const netAmount = grossAmount - discAmount + taxAmount;

      const itemData = [
        index + 1,
        pName,
        qty,
        price.toFixed(2),
        discountPercent > 0 ? `${discountPercent}%` : "-",
        netAmount.toFixed(2),
      ];
      tableRows.push(itemData);
    });
  }

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: billToY + 22,
    theme: 'striped', // Zebra stripes
    headStyles: { 
      fillColor: [...colorBlue], 
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { fontSize: 10, cellPadding: 3, valign: 'middle' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 }, // Index
      1: { halign: 'left' },                  // Name
      2: { halign: 'center' },                // Qty
      3: { halign: 'right' },                 // Price
      4: { halign: 'center' },                // Disc
      5: { halign: 'right', fontStyle: 'bold' } // Total
    },
    alternateRowStyles: { fillColor: [245, 247, 250] } // Light Gray rows
  });

  // ==========================================
  // 4. TOTALS & FOOTER
  // ==========================================
  const finalY = doc.lastAutoTable.finalY + 5;

  // Notes on Left
  if (sale.notes) {
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.setFont("helvetica", "italic");
      doc.text(`Note: ${sale.notes}`, 14, finalY + 10);
  }

  // Totals Calculation Table (Right Side)
  autoTable(doc, {
    body: [
      ["Subtotal:", `${Number(sale.total - (sale.balanceDue > 0 ? 0 : 0)).toFixed(2)}`], 
      ["Paid Amount:", `${Number(sale.amountPaid).toFixed(2)}`],
      ["Balance Due:", `${Number(sale.balanceDue).toFixed(2)}`],
      ["GRAND TOTAL:", `Rs. ${Number(sale.total).toFixed(2)}`] // Bold Row
    ],
    startY: finalY,
    margin: { left: 120 }, 
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2, textColor: 80, halign: 'right' },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [...colorBlue], cellWidth: 40 }, // Labels
      1: { fontStyle: 'bold', textColor: 0 } // Values
    },
    didParseCell: function (data) {
        // Balance Due RED if pending
        if (data.row.index === 2 && sale.balanceDue > 0) {
            data.cell.styles.textColor = [220, 38, 38];
        }
        // Grand Total Row Style
        if (data.row.index === 3) {
            data.cell.styles.fillColor = [...colorBlue];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontSize = 11;
        }
    }
  });

  // Footer Line & Thank You
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(...colorBlue);
  doc.line(14, pageHeight - 20, 196, pageHeight - 20); // Bottom Line

  doc.setFontSize(10);
  doc.setTextColor(...colorBlue);
  doc.setFont("helvetica", "bold");
  doc.text("THANK YOU FOR YOUR BUSINESS!", 105, pageHeight - 12, { align: "center" });

  // Save PDF
  doc.save(`Invoice_${sale.saleId}.pdf`);
};