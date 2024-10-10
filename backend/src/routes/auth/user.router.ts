import { Router } from "express";
import { upload } from "../../middlewares/multer.middleware";
import { register,login, getCurrentUser, updateProfile, forgotPassword, resendCode, verifyCode, refreshTokenRegenerate, logout } from "../../controllers/auth/user.controller";
import verifyJWT from "../../middlewares/auth.middleware";

/*
  register , 
    login,
    logout,
    refreshTokenRegenerate,
    getCurrentUser,
    forgotPassword,
    verifyCode,
    resendCode,
    updateProfile,

*/

const router = Router();


router.route('/signup').post(
    upload.single('profilePhoto'),
    register
)

router.route('/login').post(login);
router.route('/user-details').get(verifyJWT,getCurrentUser);
router.route('/update-profile').post(verifyJWT,updateProfile)
router.route('forgot-password').post(forgotPassword);
router.route('/resend-code').post(resendCode);
router.route('verify-code').post(verifyCode);
router.route('/refresh-regenerate').post(refreshTokenRegenerate)
router.route('/logout').post(verifyJWT,logout);


export default router;

