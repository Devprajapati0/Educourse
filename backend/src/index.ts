import app from './app';
import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';

dotenv.config(); 
const prisma = new PrismaClient();

const connectDb = async () => {
  try {
    // Optionally connect to the database (Prisma automatically handles connections during queries)
    await prisma.$connect();
    console.log(`\n PostgreSQL connected successfully using Prisma`);

  } catch (error) {
    console.error("Database connection error || DB || index.db.js ||", error);
    process.exit(1);
  }
};

connectDb()
.then(()=>{
    app.listen(8000,()=>{
        console.log(`🧿 Server is running at port : ${process.env.PORT} `)
    })
})
.catch((error)=>{ 
    console.log("Mongo DB connection failed || index.js ",console.error())
})

