import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import dbConnect from './config/db.js';
import authRoutes from "./routes/authRoutes.js"

dotenv.config();

const app = express();


dbConnect();

app.use(cors());
app.use(express.json());


// Health check
app.get("/", (req, res) => {
  res.json({ message: "Invoice API is running 🚀"});
});

app.use('/api/auth',authRoutes)


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});