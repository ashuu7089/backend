// require('dotenv').config({path : './env'})

import dotenv from 'dotenv';
import connectDB from './db/dbConfig.js';
import { app } from './app.js';

dotenv.config({
    path : './.env'
})

connectDB()
.then((response)=>{
    app.listen(process.env.PORT || 8500,  ()=> {
        console.log(`Server running on port : ${process.env.PORT }`);
    })
})
.catch((error)=> {
    console.log("MongoDB connection Error : ", error);
    throw error;
})