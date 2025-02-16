import mongoose from "mongoose";
const connectdb=async()=>{
    try {
        mongoose.connect(process.env.mongodb)
        console.log("connected to database")
    } catch (error) {
        console.log(error,"db not connected")
    }
}
export default connectdb;   