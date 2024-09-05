import mongoose from "mongoose";
import { DB_Name } from "../constants";

const connectDB = async() => {
    try {
      const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_Name}`)
        console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`); //comment connection instance
    } catch (error) {
        console.log("mongoDB error", error);
        process.exit(1)
    }
}

export default connectDB;
