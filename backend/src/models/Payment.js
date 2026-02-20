import mongoose from "mongoose";
const paymentSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "UPI", "CARD", "OTHER"],
      default: "OTHER",
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);