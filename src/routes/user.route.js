import { Router } from "express";
import { changeCurrentPassword, 
    getProfile, 
    logIn, 
    logOut, 
    registerUser, 
    updateProfile } from "../controllers/user.contoller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
    upload.single("avatar"),registerUser);
router.route("/logIn").post(logIn);
router.route("/logOut").delete(verifyJWT,logOut);
router.route("/profile").get(verifyJWT,getProfile);
router.route("/update/profile").patch(verifyJWT,upload.single("avatar"),updateProfile);
router.route("/change/password").patch(verifyJWT,changeCurrentPassword);

export default router;