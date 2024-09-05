// require('dotenv').config({path : './env'})

import dotenv from 'dotenv';
import connectDB from './db/dbConfig';

dotenv.config({
    path : './env'
})

connectDB()