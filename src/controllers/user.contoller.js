import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId)=> {
    try {
        if (!userId) {
            throw new ApiError(400,"User id not found");
        }
    
        const user = await User.findById(userId);
    
        if (!user) {
            throw new ApiError(400,"User not found");
        }
    
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
    
        user.save({valdateBeforeSave:false});
    
        return {accessToken,refreshToken}
    } catch (error) {
        console.log("something is wrong while generating access and refresh token",error);
    }
}

const registerUser = asyncHandler(async (req,res)=> {
    const {fullName,email,password} = req.body;

    if ([fullName,email,password].some((field)=>field.trim()==="")) {
        throw new ApiError(400,"All fields are required");
    }

    const existedUser = await User.findOne({email});

    if (existedUser) {
        throw new ApiError(400,"Email already registerd");
    }

    const avatarLocalPath = req.file?.path;

    let avatar = "";

    if (avatarLocalPath) {
        avatar = await uploadOnCloudinary(avatarLocalPath);
    }

    const user = await User.create({
        fullName,
        email,
        password,
        avatar:avatar,
    });

    if (!user) {
        throw new ApiError(500,"user not registered");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "user registered successfully"
        )
    );
});

const logIn = asyncHandler( async (req,res)=> {
    const {email,password} = req.body;

    if (!email || !password) {
        throw new ApiError(400,"email and password are required");
    }

    const user = await User.findOne({email});

    if (!user) {
        throw new ApiError(400,"Invalid email");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(400,"Invalid credentials");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user?.id);
    console.log(accessToken,refreshToken);

    const loggedInUser = await User.findById(user?._id).select("-password -refreshToken");

    const options = {
        httpOnly:true,
        secure:true,
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {user:loggedInUser,accessToken,refreshToken},
            "User logged in successfully"
        )
    )
});

const logOut = asyncHandler( async (req,res)=> {
     await User.findByIdAndUpdate(req.user?.id,{
        $unset:{
            refreshToken:1,
        }
     },
     {
        new:true,
     }
    );

    const options = {
        httpOnly:true,
        secure:true,
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User logOut successfully")
    );
});

const refreshAccessToken = asyncHandler(async (req,res) =>{
    try {
        const incomingToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingToken) {
            throw new ApiError(401,"Unauthorized request");
        }

        const decodeToken = jwt.verify(incomingToken,process.env.REFERESH_TOKEN_SECERET);

        const user = await User.findById(decodeToken?._id);

        if (!user) {
            throw new ApiError(401,"Invalid refresh token");
        }

        const options = {
            httpOnly:true,
            secure:true,
        }

        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id);

        return res.status(201)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
            )
        )

    } catch (error) {
        throw new ApiError(error?.message || "accessToken expired");
    }
});

const changeCurrentPassword = asyncHandler(async (req,res) =>{
    const {oldPassword,newPassword} = req.body;

        const user = await User.findById(req.user?._id);
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if(!isPasswordCorrect){
            throw new ApiError(401,"Invalid old password");
        }

        user.password = newPassword;

        await user.save({validateBeforeSave:false});

        return res.status(200)
        .json(
            new ApiResponse(200,{},"Password changed successfully")
        )
});

const updateProfile = asyncHandler( async (req,res)=> {
    let {fullName,email} = req.body;

    if (!(fullName || email)) {
        throw new ApiError(400,"Full name or email required");
    }

    const avatarLocalPath = req.file?.path

    let avatar = "";

    if (avatarLocalPath) {
        avatar = await uploadOnCloudinary(avatarLocalPath);
    }

    const users = await User.findById(req.user.id);

    if (!email) {
        email = users.email;
    }

    if (!fullName) {
        fullName = users.fullName;
    }

    if (!avatar) {
        avatar = users.avatar;
    }

    const user = await User.findByIdAndUpdate(
        req.user?.id,
        {
            $set:{
                fullName,
                email,
                avatar
            }
        },
        {
            new:true
        }
    ).select("-password, -refreshToken");

    console.log(user);

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Profile updated successfuly")
    );
});

const getProfile = asyncHandler( async (req,res)=> {
    const user = await User.findOne(req.user._id).select("-password -refrshToken");

    return res.status(200).json(new ApiResponse(200,user,"Profile fetched successfully"));
});

export {
    registerUser,
    logIn,
    logOut,
    refreshAccessToken,
    changeCurrentPassword,
    updateProfile,
    getProfile,
}