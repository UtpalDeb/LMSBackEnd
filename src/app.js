import express, {urlencoded} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(cookieParser());
app.use(express.json({limit:'16kb'}));
app.use(urlencoded({extended:true,limit:'16kb'}));
app.use(express.static("public"));

import userRouter from "./routes/user.route.js";
import courseRouter from "./routes/course.route.js";
import paymentRouter from "./routes/payment.route.js";
import misleniousRouter from "./routes/mislenious.route.js";

app.use("/api/v1/user",userRouter);
app.use("/api/v1/course",courseRouter);
app.use("/api/v1/payment",paymentRouter);
app.use("/api/v1/stats",misleniousRouter);

export default app;