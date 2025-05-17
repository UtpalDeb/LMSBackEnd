import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/AsyncHandler.js";
import {User} from "../models/user.model.js";
import jwt from "jsonwebtoken";


const verifyJWT = asyncHandler(async (req,res,next) =>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        if (!token) {
            throw new ApiError(400,"Token not find");
        }

        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECERET);

        const user = await User.findById(decodeToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(400,"Invalid accessToken");
        }

        req.user=user;
        next();

    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid accessToken");
    }
});

export { verifyJWT }