import { Router } from 'express';
const router = Router();
import { registerUser } from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.js'

router.route("/register").post(upload.fields(
    [{name: "avatar", maxCount:1},
    {name:'coverImg', maxCount:1}
    ]),registerUser)

export default router;
