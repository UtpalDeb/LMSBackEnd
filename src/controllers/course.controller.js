import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { Course } from "../models/course.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { mongoose, isValidObjectId } from "mongoose";

const createCourse = asyncHandler(async (req,res)=> {
    const {title,description,category,createdBy} = req.body;

    if ([title,description,category,createdBy].some((fields)=>{fields?.trim===""})) {
        throw new ApiError(400,"All fields are required");
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    let thumbnail = "";

    if (thumbnailLocalPath) {
        thumbnail= await uploadOnCloudinary(thumbnailLocalPath);
    }

    const course = await Course.create({
        title,
        description,
        category,
        createdBy,
        thumbnail:thumbnail,
    });

    if (!course) {
        throw new ApiError(500,"course not created");
    }

    return res.status(200).json(new ApiResponse(200,course,"course created successfully"));
});

const updateCourseById = asyncHandler( async (req,res)=>{
    const {courseId} = req.params;
    const {title,description,category} = req.body;

    if (!(isValidObjectId(courseId) || (title || description || category))) {
        throw new ApiError(400,"course id not found");
    }

    const thumbnailLocalPath = req.file?.path;
    let thumbnail = req.user?.thumbnail;

    if (thumbnailLocalPath) {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    }

    const course = await Course.findByIdAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(courseId)
        },
        {
            $set:{
                title:title,
                description:description,
                category:category,
                thumbnail:thumbnail,
            }
        },
        {
            new:true,
        }
    );

    if (!course) {
        throw new ApiError(500,"Course not updated");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,course,"course updated successfully")
    );
});

const getAllCourses = asyncHandler( async (req,res)=> {
    const courses = await Course.find({}).select("-lectures");

    if (!courses) {
        return res.status(200).json(new ApiResponse(200,{},"no any courses found"));
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,courses,"course fetched successfylly")
    );
});

const removeCourse = asyncHandler( async (req,res)=> {
    const {courseId} = req.params;

    if (!isValidObjectId(courseId)) {
        throw new ApiError(400,"Invalid courseId");
    }

    await Course.findByIdAndDelete(courseId);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Course deleted successfully"
        )
    );
});

const addLecturesToCourseById = asyncHandler(async (req,res)=> {
    const {courseId} = req.params;
    const {title,description}=req.body;
    console.log(courseId);
    console.log(title);
    console.log(description);

    if (!(isValidObjectId(courseId) || (title && description))) {
        throw new ApiError(400,"invalid object id or empty fields");
    }

    const course = await Course.findById(courseId);

    if (!courseId) {
        throw new ApiError(400,"invalid course id");
    }

    const lectureData = {
        title,
        description,
        lecture:{}
    }

    const lectureLocalPath = req.files?.lectures[0]?.path;
    console.log(lectureLocalPath);
    
    if (lectureData) {
        const lecture = await uploadOnCloudinary(lectureLocalPath);
        if (!lecture) {
            throw new ApiError(500,"Lecture not uploaded");
        }

        lectureData.lecture=lecture;
    }

    course.lectures.push(lectureData);
    course.numberOfLectures = course.lectures.length;

    await course.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            course,
            "Added lecture successfully",
        )
    );
});

const updateLectureById = asyncHandler(async (req,res)=> {
    const {title,description} = req.body;
    const {courseId,lectureId} = req.params;

    if (!(isValidObjectId(courseId) || isValidObjectId(lectureId))) {
        throw new ApiError(400,"invalid course or lecture id");
    }

    if (!(title || description)) {
        throw new ApiError(400,"title or description are required");
    }

    const course = await Course.findById(courseId);

    if (!course) {
        throw new ApiError(400,"course not found");
    }

    const lectureIndex = course.lectures.findIndex(lecture=>lecture._id.toString()==lectureId);

    if (lectureIndex==-1) {
        throw new ApiError(400,"lecture not found");
    }

    const updatedLectureData = {
        title,
        description,
        lecture:course.lectures[lectureIndex].lecture,
    }

    //update lecture data
    course.lectures[lectureIndex] = updatedLectureData;
    await course.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            course,
            "lecture data updated successfully"
        )
    );
});

const deleteCourseLecture = asyncHandler(async (req,res)=> {
    const {courseId,lectureId} = req.params;

    if (!(isValidObjectId(courseId) || isValidObjectId(lectureId))) {
        throw new ApiError(400,"course or lecture id is invalid");
    }

    console.log(courseId);

    const course = await Course.findById(courseId);

    console.log(course);

    if (!course) {
        throw new ApiError(400,"course not found");
    }

    const lectureIndex = course.lectures.findIndex(lecture=>lecture._id.toString()===lectureId);

    if (lectureIndex==-1) {
        throw new ApiError(400,"lecture not found");
    }

    course.lectures.splice(lectureIndex,1);
    course.numberOfLectures=course.lectures.length;

    await course.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            course,
            "lecture deleted successfully"
        )
    );
});

const getLecturesByCourseId = asyncHandler(async (req,res)=> {
    const {courseId} = req.params;

    if (!isValidObjectId(courseId)) {
        throw new ApiError("Invalid courseId");
    }

    console.log(courseId);

    const course = await Course.findById(courseId);

    console.log(course);

    if (!course) {
        throw new ApiError(400,"course not found");
    }

    const lectures = course.lectures;
    console.log(lectures);

    return res
    .status(200)
    .json(
        new ApiResponse(200,lectures,"Lectures fetched successfully")
    );
});
export {
    createCourse,
    updateCourseById,
    getAllCourses,
    removeCourse,
    addLecturesToCourseById,
    updateLectureById,
    deleteCourseLecture,
    getLecturesByCourseId,
}