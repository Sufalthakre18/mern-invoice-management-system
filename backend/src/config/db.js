import mongoose from 'mongoose'

export default async function dbConnect() {
    if(mongoose.connections[0].readyState) return;

    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Database connection successful!");
        
    } catch (error) {
        console.error("database connection failed :- ",error.message);
        process.exit(1);
    }
}