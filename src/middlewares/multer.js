import multer from "multer";
import path from "path";

import { fileURLToPath } from 'url';

// Simulate __dirname in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.resolve(__dirname, '../../public/temp');

    // Callback with the resolved path
    cb(null, uploadPath);
    },
    filename: function (req, file, cb) {

      cb(null, file.originalname)
    }
  })
  
 export const upload = multer({ 
    storage,
})