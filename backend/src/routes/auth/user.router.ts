import { Router } from "express";
import { upload } from "../../middlewares/multer.middleware";
import { register,login } from "../../controllers/auth/user.controller";


const router = Router();


router.route('/signup').post(
    upload.single('profilePhoto'),
    register
)

router.route('/login').post(login);

export default router;

