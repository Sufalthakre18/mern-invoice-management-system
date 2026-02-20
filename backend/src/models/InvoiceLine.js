import mongoose from "mongoose";
const invoiceLineSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
    },
  },
  { timestamps: true }
);


invoiceLineSchema.pre("save", function (next) {
  this.lineTotal = parseFloat((this.quantity * this.unitPrice).toFixed(2));
  next();
});

export default mongoose.model("InvoiceLine", invoiceLineSchema);