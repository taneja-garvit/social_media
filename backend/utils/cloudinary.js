import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv"

dotenv.config({})

// Configuration of cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME, // Your Cloudinary cloud name
    api_key: process.env.API_KEY,       // Your Cloudinary API key
    api_secret: process.env.API_SECRET  // Your Cloudinary API secret
});

// Export the cloudinary instance to use it in other files
export default cloudinary;
