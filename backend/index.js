import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { urlencoded } from "express"; 
import dotenv from "dotenv";
import connectdb from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";
import messRoute from "./routes/message.route.js";
import { app, server } from "./socket/socket.js";



dotenv.config({})

//middlewares
app.use(express.json())
app.use(cookieParser()) // using this as jb browser se request aaygi backend me to token store cookie me he store hongi nhi to cookie parse jhi hogi
app.use(urlencoded({extended: true}));
const corsOptions={
    origin:'http://localhost:5173',
    credentials:true,
}
app.use(cors(corsOptions))


app.use("/api/v1/user",userRoute) // yha se saare routes chlenge
app.use("/api/v1/post", postRoute);
app.use("/api/v1/message", messRoute);



const port=process.env.port||8000;
server.listen(port,()=>{
 connectdb()               // yha pr call hua connection String and upr import 
console.log(`Server running at ${port}`)
})