import mongoose from "mongoose";

const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["DRAFT", "PAID", "OVERDUE"],
      default: "DRAFT",
    },

    
    taxRate: {
      type: Number,
      default: 0, // percentage e.g. 18 for 18% GST
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },

    subtotal: {
      type: Number,
      default: 0, // sum of line totals before tax
    },
    total: {
      type: Number,
      default: 0, // subtotal + taxAmount
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      enum: SUPPORTED_CURRENCIES,
      default: "INR",
    },

    
    notes: {
      type: String,
      trim: true,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

   
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Virtual: check if invoice is overdue
invoiceSchema.virtual("isOverdue").get(function () {
  return (
    this.status !== "PAID" &&
    this.balanceDue > 0 &&
    new Date() > new Date(this.dueDate)
  );
});

invoiceSchema.set("toJSON", { virtuals: true });
invoiceSchema.set("toObject", { virtuals: true });

export default mongoose.model("Invoice", invoiceSchema);


