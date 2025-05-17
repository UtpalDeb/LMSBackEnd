import { mongoose, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Name is required'],
            minLength: [3, 'Name must be at least 5 character'],
            maxLength: [20, 'Name should be less than 20 character'],
            lowercase: true,
            trim: true
        },
        email: {
            type: String,
            required: [true, 'email is required'],
            lowercase: true,
            trim: true,
            unique: true
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minLength: [4, 'Password must be at least 4 character'],
        },
        avatar: {
            public_id: {
                type: String
            },
            secure_url: {
                type: String
            }
        },
        role: {
            type: String,
            default: 'USER',
            enum: ['USER', 'ADMIN']
        },
        subscription:{
            id:{
                type:String,
            },
            status:{
                type:String,
            }
        }
    },
    {
        timestamps:true,
    }
);

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    this.password= await bcrypt.hash(this.password,10);
    next();
});

userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken= function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            fullName:this.fullName,
            userName:this.userName,
        },
        `${process.env.ACCESS_TOKEN_SECERET}`,
        {
            expiresIn:`${process.env.ACCESS_TOKEN_EXPIRY}`,
        },
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        `${process.env.REFERESH_TOKEN_SECERET}`,
        {
            expiresIn:`${process.env.REFERESH_EXPIRY}`,
        },
    )
}

export const User = mongoose.model("User",userSchema);