import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Payment } from "../models/payment.model.js";
import crypto from "crypto";
import Razorpay from "razorpay";

export const razorpay = new Razorpay ({
    key_id:`${process.env.RAZORPAY_KEY_ID}`,
    key_secret:`${process.env.RAZORPAY_KEY_SECRET}`
});

const getRazorpayApiKey = asyncHandler( async (req,res)=> {
    const razorpayApiKey = process.env.RAZORPAY_KEY_ID;

    return res
    .status(200)
    .json(
        new ApiResponse(200,{razorpayApiKey},"Razorpay api key fetched successfully")
    );
});

const buySubscription = asyncHandler(async (req,res)=> {
    const user = await User.findById(req.user?.id);

    if (!user) {
        throw new ApiError(400,"user not found please log in!!");
    }

    if (user.role == "ADMIN") {
        throw new ApiError(400,"Admin not buy course");
    }

    const subscription = await razorpay.subscriptions.create({
        plan_id: process.env.RAZORPAY_PLAN_ID,
        customer_notify: 1,
        total_count: 1,
    });

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscription.id,
            "Subscribed successfully"
        )
    );
});

const verifySubscription = asyncHandler(async (req,res)=> {
    const {razorpay_payment_id,razorpay_signature,razorpay_subscription_id} = req.body;

    const user = await User.findById(req.user?.id);

    if (!user) {
        throw new ApiError(400,"user not found");
    }

    const subscriptionId = user.subscription.id;

    const generatedsignature = crypto
    .createHmac("sha256",process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_payment_id}|${subscriptionId}`)
    .digest("hex");

    if (generatedsignature != razorpay_signature) {
        throw new ApiError(400,"Payment not verified");
    }

    const payment = await Payment.create({
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
    });

    user.subscription.status = "active";
    await user.save();
    console.log(user);

    if (!payment) {
        throw new ApiError(500,"payment not created");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            payment,
            "payment verified successfully"
        )
    );
});

const cancelSubscription = asyncHandler(async (req,res)=> {
    const user = await User.findById(req.user?.id);

    if (!(user && user.role != "ADMIN")) {
        throw new ApiError(400,"invalid user");
    }

    const subscriptionId = user.subscription.id;

    if (!subscriptionId) {
        throw new ApiError(400,"subscription id not found");
    }

    await razorpay.subscriptions.cancel(subscriptionId);

    user.subscription.status = "false";
    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "unsubscribe successfully"
        )
    );
});

const allPayments = asyncHandler(async (req,res)=> {
    const {count} = req.query;
    const startDate = new Date(2024, 4 - 1, 1).toDateString();

    const allPayment = await razorpay.subscriptions.all({
        count:count || 10,
        status:"completed",
    });

    const monthlySale = await razorpay.subscriptions.all({
        count:count || 10,
        from:startDate
    });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {allPayment,monthlySale},
            "Payment fetched successfully"
        )
    );
});

export {
    getRazorpayApiKey,
    buySubscription,
    verifySubscription,
    cancelSubscription,
    allPayments,
}