import {Router} from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js";
import { addLecturesToCourseById, 
    createCourse, 
    deleteCourseLecture, 
    getAllCourses, 
    getLecturesByCourseId, 
    removeCourse, 
    updateCourseById, 
    updateLectureById } from "../controllers/course.controller.js";

const router = Router();

router.route("/create").post(verifyJWT,
    upload.fields(
        [
            {
                name:"thumbnail",
                maxCount:1
            }
        ]
    ),createCourse);
router.route("/:courseId/update").patch(verifyJWT,upload.single("thumbnail"),updateCourseById);
router.route("/get/all").get(getAllCourses);
router.route("/delete/c/:courseId").delete(verifyJWT,removeCourse);
router.route("/add/lectue/c/:courseId").patch(verifyJWT,upload.fields([
    {
        name:"lectures"
    }
]),addLecturesToCourseById);
router.route("/update/c/:courseId/l/:lectureId").patch(verifyJWT,updateLectureById);
router.route("/get/lectures/c/:courseId").get(verifyJWT,getLecturesByCourseId);
router.route("/delete/lecture/:lectureId/c/:courseId").delete(verifyJWT,deleteCourseLecture);

export default router;