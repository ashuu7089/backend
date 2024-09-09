import { Router } from 'express';
const router = Router();
import { registerUser, loginUser, logoutUser, accessRefreshToken } from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.js'
import { verifyJWT } from '../middlewares/auth.middleware.js';

router.route("/register").post(upload.fields(
    [{name: "avatar", maxCount:1},
    {name:'coverImg', maxCount:1}
    ]),registerUser)

router.route("/login").post(loginUser)
router.route('/logout').post( verifyJWT, logoutUser)
router.route('/refresh_token').post(accessRefreshToken)

export default router;
