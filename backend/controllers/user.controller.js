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
        // token ka use h ke jb tk user login h tb tk browser me token hota h and jb token nhi h mtlb user logout h and dubara login krana pdega
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
        try {       // now profile edit logged in user ke he hogi to uske liye one method is frontend se lo (usning params) ya fir loggin in ke time pr cokkies me store hogi to wha se le lo to wha se lenge but iske liye backend me ek middleware use karna hoga 
            const userId=req.id // it is coming from midddleware authent vala
            const {bio,gender}= req.body;
            const profilePicture= req.file; // yha file directly aayegi from frontend and frontend se if file aayega to req.file se aayegi
            let cloudResponse;

            if(profilePicture){
                const fileUri= getDataUri(profilePicture); // ye yha se jayega in datauri.js and wha ek string file me convert ho j ayega to upload it to cloudinary
                cloudResponse= await cloudinary.uploader.upload(fileUri);  // yha se vo file upload ho  jaeyegi in cloudinary is funct ka code in cloudinary.js
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
    const follow = req.id // jo follow krega uski id (means meri)  //me 
    const follower= req.params.id // jisko follow krna h uske id param se aa jaeygi // myfriend
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
    // now check if folllow krna ya unfollow

    const isFollowing = user.following.includes(follower) // yha user ka following array check krega ki usne follow id ko follow kiya h ya ni
    if(isFollowing){
         // yha user follow kr rha h phle se to unfollow krne ka code
         // user.following.pull(follow); // user ka following array se follow id ko remove krega
         await Promise.all([
            User.updateOne({_id:follow} ,{$pull:{following:follower}}), // user ka following array se follow id ko remove 
            User.updateOne({_id:follower} ,{$pull:{followers:follow}}) // and jisko unfollow kiya h uske follower se remove
         ])
         return res.status(200).json({
            message:'Unfollowed',  
            success:true
         })
    }
    else{
        // yha user unfollow kr rha h to follow krne ka code
        // user.following.push(follow); is code se only follow krne vale ka update hoga but jisko follow kiya uski id bhi update honi chahiye so use promise
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
