import { User } from "../models/user.model.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";




export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(401).json({
                message: "Please fill all the fields"
            })
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(401).json({
                message: "Email already exists"
            })
        }
        const hashedpass = await bcrypt.hash(password, 10)
        await User.create({
            username,
            email,
            password: hashedpass
        })
        return res.status(201).json({
            message: "Account Creted!"
        })

    } catch (error) {
        console.log(error)
    }

}



export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check!",
                success: false,
            });
        }
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false,
            });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false,
            });
        };
        const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });

        // populate each post if in the posts array
        // const populatedPosts = await Promise.all(
        //     user.posts.map( async (postId) => {
        //         const post = await Post.findById(postId);
        //         if(post.author.equals(user._id)){
        //             return post;
        //         }
        //         return null;
        //     })
        // )
        // user = {
        //     _id: user._id,
        //     username: user.username,
        //     email: user.email,
        //     profilePicture: user.profilePicture,
        //     bio: user.bio,
        //     followers: user.followers,
        //     following: user.following,
        //     posts: populatedPosts
        // }
        return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 1 * 24 * 60 * 60 * 1000 }).json({
            message: `Welcome back ${user.username}`,
            success: true,
            user
        });

    } catch (error) {
        console.log(error);
    }
};

export const logout= async(req,res)=>{
    try {
        return res.cookie('token','',{maxAge:0}).json({
            message:'Logged out successfully',
            success:true
        }) 
         
    } catch (error) {
        console.log(error)
    }
}

export const getProfile=async(req,res)=>{
    try{
        const userId=req.params.id;  // ye vo id dega jis id pr user ne click liya kholne vaste by using route
        const user=await User.findById(userId).populate({path:'posts', createdAt:-1}).populate('bookmarks');
        return res.status(200).json({
            user,
            success:true

        })
    }
    catch(error){console.log(error)}    
}


export const editProfile= async(req,res)=>{
        try {       
            const userId=req.id 
            const {bio,gender}= req.body;
            const profilePicture= req.file; 
            let cloudResponse;

            if(profilePicture){
                const fileUri= getDataUri(profilePicture); 
                cloudResponse= await cloudinary.uploader.upload(fileUri);  
            }
            const user = await User.findById(userId).select('-password')
                    if(!user){
                return res.status(401).json({
                    message:'User not found',
                    success:false
                })
                 };
                 if(bio){ user.bio=bio; }
                 if(gender) {user.gender=gender}
                 if(profilePicture){ user.profilePicture=cloudResponse.secure_url; } // this is predefined cloudResponse.secure_url contains the URL of the uploaded image returned from Cloudinary
                 await user.save();
                 return res.status(200).json({
                    message:'Profile updated successfully',
                    success:true,
                    user
                    })



        } catch (error) {
            console.log(error)
        }
}
export const getSuggestedUser = async (req, res) => {
    try {
        const suggestedUser = await User.find({ _id: { $ne: req.id } }).select("-password");
        if (!suggestedUser) {
            return res.status(401).json({
                message: 'No suggested user found',
            });
        }
        return res.status(200).json({
            success: true,
            user: suggestedUser,
        });
    } catch (error) {
        console.log(error); // Log the error for debugging
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};



export const followOrUnfollow= async(req,res)=>{
    const follow = req.id  
    const follower= req.params.id 
    if(follow===follower){
        return res.status(401).json({
            message:'You cant follow yourself',
            success:false
        })
    }
    const user= await User.findById(follow);
    const friend= await User.findById(follower);
    if(!user || !friend){
        return res.status(401).json({
            message:'User not found',
            success:false
            })
            }

    const isFollowing = user.following.includes(follower) 
    if(isFollowing){
         await Promise.all([
            User.updateOne({_id:follow} ,{$pull:{following:follower}}),  
            User.updateOne({_id:follower} ,{$pull:{followers:follow}}) 
         ])
         return res.status(200).json({
            message:'Unfollowed',  
            success:true
         })
    }
    else{
        await Promise.all([
            User.updateOne({_id:follow},{$push:{following:follower}}),
            User.updateOne({_id:follower},{$push:{followers:follow}}) 
        ])
        return res.status(200).json({
            message:'followed',  
            success:true
         })
    }

}
