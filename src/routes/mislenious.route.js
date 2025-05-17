import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import { stats } from "../controllers/mislenious.controller.js";

const router = Router();

router.route("/get").get(verifyJWT,stats);

export default router;