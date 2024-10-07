import { Router } from "express";
import { upload } from "../../middlewares/multer.middleware";

const router = Router();


router.route('/signup').post(
    upload.single('profilePhoto'),
    
)
export default router;

