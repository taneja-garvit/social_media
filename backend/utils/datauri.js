import DataUriParser from "datauri/parser.js" //This is a library that helps convert files (like images, videos, etc.) into Data URIs.
import path from "path"

const parser= new DataUriParser()

const getDataUri = (file) => {
    const extName = path.extname(file.originalname).toString(); // Extracts the file extension (e.g., .png, .jpg)
    return parser.format(extName, file.buffer).content; // Converts the file to Data URI format
}

export default getDataUri;

// this whole thing was used for cloudinary