import express from "express"
import invoiceController from "../controllers/invoiceController.js";
import protect from "../middleware/authMiddleware.js";


const router = express.Router();

router.use(protect);

router.get("/", invoiceController.getAllInvoices);
router.post("/", invoiceController.createInvoice);

router.post("/archive", invoiceController.archiveInvoice);
router.post("/restore", invoiceController.restoreInvoice);
router.get("/:id", invoiceController.getInvoiceById);
router.post("/:id/payments", invoiceController.addPayment);
router.get("/:id/pdf", invoiceController.downloadInvoicePDF);
router.get("/:id/convert", invoiceController.convertCurrency);


export default router