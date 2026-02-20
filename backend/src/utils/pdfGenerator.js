import PDFDocument from "pdfkit"

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
};

const generateInvoicePDF = (invoice, lineItems, payments) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const symbol = CURRENCY_SYMBOLS[invoice.currency] || invoice.currency;

      // ── HEADER ──────────────────────────────────────────────
      doc
        .fontSize(24)
        .fillColor("#1a1a2e")
        .font("Helvetica-Bold")
        .text("INVOICE", 50, 50);

      doc
        .fontSize(10)
        .fillColor("#666")
        .font("Helvetica")
        .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 85)
        .text(
          `Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`,
          50,
          100
        )
        .text(
          `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
          50,
          115
        );

      // Status badge
      const statusColor =
        invoice.status === "PAID"
          ? "#22c55e"
          : invoice.status === "OVERDUE"
          ? "#ef4444"
          : "#f59e0b";

      doc
        .roundedRect(400, 50, 140, 30, 5)
        .fillColor(statusColor)
        .fill();

      doc
        .fontSize(12)
        .fillColor("white")
        .font("Helvetica-Bold")
        .text(invoice.status, 400, 59, { width: 140, align: "center" });

      // ── CUSTOMER INFO ────────────────────────────────────────
      doc
        .fillColor("#1a1a2e")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Bill To:", 50, 160);

      doc
        .fontSize(11)
        .fillColor("#333")
        .font("Helvetica")
        .text(invoice.customerName, 50, 178);

      if (invoice.customerEmail) {
        doc.text(invoice.customerEmail, 50, 193);
      }

      // ── DIVIDER ──────────────────────────────────────────────
      doc
        .moveTo(50, 225)
        .lineTo(545, 225)
        .strokeColor("#e5e7eb")
        .lineWidth(1)
        .stroke();

      // ── LINE ITEMS TABLE ─────────────────────────────────────
      const tableTop = 240;

      // Table header background
      doc.rect(50, tableTop, 495, 25).fillColor("#1a1a2e").fill();

      doc
        .fontSize(10)
        .fillColor("white")
        .font("Helvetica-Bold")
        .text("Description", 60, tableTop + 8)
        .text("Qty", 300, tableTop + 8, { width: 60, align: "center" })
        .text("Unit Price", 360, tableTop + 8, { width: 80, align: "right" })
        .text("Line Total", 440, tableTop + 8, { width: 95, align: "right" });

      // Table rows
      let y = tableTop + 35;
      lineItems.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.rect(50, y - 5, 495, 22).fillColor("#f9fafb").fill();
        }

        doc
          .fontSize(10)
          .fillColor("#333")
          .font("Helvetica")
          .text(item.description, 60, y, { width: 230 })
          .text(String(item.quantity), 300, y, { width: 60, align: "center" })
          .text(`${symbol}${item.unitPrice.toLocaleString()}`, 360, y, {
            width: 80,
            align: "right",
          })
          .text(`${symbol}${item.lineTotal.toLocaleString()}`, 440, y, {
            width: 95,
            align: "right",
          });

        y += 22;
      });

      // ── TOTALS ───────────────────────────────────────────────
      y += 15;
      doc
        .moveTo(50, y)
        .lineTo(545, y)
        .strokeColor("#e5e7eb")
        .lineWidth(1)
        .stroke();

      y += 15;
      const totalsX = 350;

      const addTotalRow = (label, value, bold = false, color = "#333") => {
        doc
          .fontSize(10)
          .fillColor("#666")
          .font(bold ? "Helvetica-Bold" : "Helvetica")
          .text(label, totalsX, y)
          .fillColor(color)
          .text(`${symbol}${value.toLocaleString()}`, totalsX, y, {
            width: 195,
            align: "right",
          });
        y += 20;
      };

      addTotalRow("Subtotal:", invoice.subtotal || invoice.total);

      if (invoice.taxRate > 0) {
        addTotalRow(
          `Tax (${invoice.taxRate}% GST):`,
          invoice.taxAmount || 0
        );
      }

      addTotalRow("Total:", invoice.total, true, "#1a1a2e");
      addTotalRow("Amount Paid:", invoice.amountPaid, false, "#22c55e");
      addTotalRow("Balance Due:", invoice.balanceDue, true, invoice.balanceDue > 0 ? "#ef4444" : "#22c55e");

      // ── PAYMENTS SECTION ─────────────────────────────────────
      if (payments && payments.length > 0) {
        y += 10;
        doc
          .fontSize(12)
          .fillColor("#1a1a2e")
          .font("Helvetica-Bold")
          .text("Payment History", 50, y);

        y += 20;
        payments.forEach((p) => {
          doc
            .fontSize(10)
            .fillColor("#333")
            .font("Helvetica")
            .text(
              `• ${new Date(p.paymentDate).toLocaleDateString()} — ${p.method || "Payment"}: ${symbol}${p.amount.toLocaleString()}`,
              60,
              y
            );
          y += 18;
        });
      }

      // ── NOTES ────────────────────────────────────────────────
      if (invoice.notes) {
        y += 10;
        doc
          .fontSize(10)
          .fillColor("#666")
          .font("Helvetica-Bold")
          .text("Notes:", 50, y);
        doc
          .font("Helvetica")
          .text(invoice.notes, 50, y + 15, { width: 495 });
      }

      // ── FOOTER ───────────────────────────────────────────────
      doc
        .fontSize(9)
        .fillColor("#aaa")
        .text(
          "Generated by Invoice Management System",
          50,
          doc.page.height - 50,
          { align: "center", width: 495 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export default generateInvoicePDF