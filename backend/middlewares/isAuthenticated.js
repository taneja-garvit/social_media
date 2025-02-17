import jwt from "jsonwebtoken";
const isAuthenticated = async (req,res,next)=>{
    try {
        const token = req.cookies.token; // Here, we are retrieving the user's token from the cookies (the one generated during login)
        if(!token){  // If the token is not found, that means the user is not authenticated
            return res.status(401).json({
                message:'User not authenticated',
                success:false
            });
        }
        const decode =  jwt.verify(token, process.env.SECRET_KEY); // Here, we are verifying the token that came from cookies with the existing in env variable
        if(!decode|| !decode.userId){
            return res.status(401).json({
                message:'Invalid token',
                success:false
            });
        }
        req.id = decode.userId;
        next();
    } catch (error) {
        console.log(error);
    }
}
export default isAuthenticated;
