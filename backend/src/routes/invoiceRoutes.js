import express from "express"
import invoiceController from "../controllers/invoiceController";
import protect from "../middleware/authMiddleware";


const router = express.Router();

router.use(protect);

router.get("/", invoiceController.getAllInvoices);
router.post("/", invoiceController.createInvoice);

router.get("/:id", invoiceController.getInvoiceById);
router.post("/:id/payments", invoiceController.addPayment);
router.get("/:id/pdf", invoiceController.downloadInvoicePDF);
router.get("/:id/convert", invoiceController.convertCurrency);

router.post("/archive", invoiceController.archiveInvoice);
router.post("/restore", invoiceController.restoreInvoice);

export default router