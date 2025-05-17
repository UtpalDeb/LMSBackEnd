import { configDotenv } from "dotenv";
import connectDb from "./db/index.js";
import app from "./app.js";


configDotenv(
    {
        path:'./.env'
    }
);

connectDb()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=> {
        console.log(`app is listen at ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log('mongodb connection failed !!!',error);
});