import Invoice from "../models/Invoice.js";
import InvoiceLine from "../models/InvoiceLine.js";
import Payment from "../models/Payment.js";
import generateInvoicePDF from "../utils/pdfGenerator.js";

const EXCHANGE_RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
};

const recalculateTotals = async (invoice) => {
  const lines = await InvoiceLine.find({ invoiceId: invoice._id });
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const taxAmount = parseFloat(((subtotal * invoice.taxRate) / 100).toFixed(2));
  const total = parseFloat((subtotal + taxAmount).toFixed(2));
  const balanceDue = parseFloat((total - invoice.amountPaid).toFixed(2));

  invoice.subtotal = subtotal;
  invoice.taxAmount = taxAmount;
  invoice.total = total;
  invoice.balanceDue = balanceDue;

  return invoice;
};

const checkOverdue = (invoice) => {
  if (invoice.status !== "PAID" && invoice.balanceDue > 0) {
    if (new Date() > new Date(invoice.dueDate)) {
      invoice.status = "OVERDUE";
    }
  }
  return invoice;
};

const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });

    const updated = await Promise.all(
      invoices.map(async (inv) => {
        const checked = checkOverdue(inv);
        if (inv.isModified()) await inv.save();
        return checked;
      })
    );

    res.status(200).json({ invoices: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }


    checkOverdue(invoice);
    await invoice.save();

    const lineItems = await InvoiceLine.find({ invoiceId: invoice._id });
    const payments = await Payment.find({ invoiceId: invoice._id }).sort({
      paymentDate: -1,
    });

    res.status(200).json({
      invoice,
      lineItems,
      payments,
      summary: {
        subtotal: invoice.subtotal,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.balanceDue,
        currency: invoice.currency,
        isOverdue: invoice.isOverdue,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      customerName,
      customerEmail,
      issueDate,
      dueDate,
      taxRate,
      currency,
      notes,
      lineItems,
    } = req.body;

    if (!invoiceNumber || !customerName || !issueDate || !dueDate) {
      return res.status(400).json({ message: "Required fields missing" });
    }
    const exists = await Invoice.findOne({
      invoiceNumber,
      createdBy: req.user._id,
    });

    if (exists) {
      return res.status(400).json({
        message: "Invoice number already exists",
      });
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      customerName,
      customerEmail,
      issueDate,
      dueDate,
      taxRate: taxRate || 0,
      currency: currency || "INR",
      notes,
      createdBy: req.user._id,
    });


    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        await InvoiceLine.create({
          invoiceId: invoice._id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: parseFloat((item.quantity * item.unitPrice).toFixed(2)),
        });
      }

      // Recalculate totals
      await recalculateTotals(invoice);
      await invoice.save();
    }

    res.status(201).json({ message: "Invoice created", invoice });
  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const addPayment = async (req, res) => {
  try {
    const { amount, paymentDate, method, note } = req.body;

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }


    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Payment amount must be greater than 0" });
    }

    if (amount > invoice.balanceDue) {
      return res.status(400).json({
        message: `Amount exceeds balance due of ${invoice.currency} ${invoice.balanceDue}`,
      });
    }


    const payment = await Payment.create({
      invoiceId: invoice._id,
      amount,
      paymentDate: paymentDate || Date.now(),
      method: method || "OTHER",
      note,
    });

    invoice.amountPaid = parseFloat((invoice.amountPaid + amount).toFixed(2));
    invoice.balanceDue = parseFloat((invoice.balanceDue - amount).toFixed(2));

    if (invoice.balanceDue === 0) {
      invoice.status = "PAID";
    }

    await invoice.save();

    res.status(201).json({
      message: "Payment recorded successfully",
      payment,
      updatedSummary: {
        status: invoice.status,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.balanceDue,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const archiveInvoice = async (req, res) => {
  try {
    const { id } = req.body;

    const invoice = await Invoice.findOneAndUpdate(
      { _id: id, createdBy: req.user._id },
      { isArchived: true },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json({ message: "Invoice archived successfully", invoice });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const restoreInvoice = async (req, res) => {
  try {
    const { id } = req.body;

    const invoice = await Invoice.findOneAndUpdate(
      { _id: id, createdBy: req.user._id },
      { isArchived: false },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json({ message: "Invoice restored successfully", invoice });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const lineItems = await InvoiceLine.find({ invoiceId: invoice._id });
    const payments = await Payment.find({ invoiceId: invoice._id }).sort({
      paymentDate: -1,
    });

    const pdfBuffer = await generateInvoicePDF(invoice, lineItems, payments);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: "PDF generation failed", error: error.message });
  }
};


const convertCurrency = async (req, res) => {
  try {
    const { to } = req.query;
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (!EXCHANGE_RATES[to]) {
      return res.status(400).json({
        message: `Unsupported currency. Supported: ${Object.keys(EXCHANGE_RATES).join(", ")}`,
      });
    }

    // Convert from invoice's currency to INR first, then to target
    const toINR = invoice.total / EXCHANGE_RATES[invoice.currency];
    const converted = parseFloat((toINR * EXCHANGE_RATES[to]).toFixed(2));

    res.status(200).json({
      original: { amount: invoice.total, currency: invoice.currency },
      converted: { amount: converted, currency: to },
      rate: EXCHANGE_RATES[to] / EXCHANGE_RATES[invoice.currency],
      note: "Rates are static approximations. Use a live API for production.",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const InvoiceController = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  addPayment,
  archiveInvoice,
  restoreInvoice,
  downloadInvoicePDF,
  convertCurrency,
};

export default InvoiceController