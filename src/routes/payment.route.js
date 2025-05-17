import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allPayments, 
    buySubscription, 
    cancelSubscription, 
    getRazorpayApiKey, 
    verifySubscription } from "../controllers/payment.controller.js";

const router = Router();

router.route("/get/razor-pay-api-key").get(verifyJWT,getRazorpayApiKey);
router.route("/buy/subscription").post(verifyJWT,buySubscription);
router.route("/verify/subscription").post(verifyJWT,verifySubscription);
router.route("/cancel/subscription").delete(verifyJWT,cancelSubscription);
router.route("/get/all/payment").get(verifyJWT,allPayments);

export default router;