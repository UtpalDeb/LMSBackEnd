import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

const stats = asyncHandler(async (req,res)=> {
    const user = await User.findById(req.user?.id);
    
    if (user.role != "ADMIN") {
        throw new ApiError(400,"User can not access dashboard");
    }
    const users = await User.find({});
    const userCount = await users.length;
    const subscriberCount = users.filter((user)=>user.subscription.status==='active').length;

    const stat = {
        users:users,
        userCount:userCount,
        subscriberCount:subscriberCount,
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            stat,
            "stats geting successfully"
        )
    );
});

export {
    stats,
}