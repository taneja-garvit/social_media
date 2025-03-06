import sharp from 'sharp';  // this is lib to optimize img size etc
import cloudinary from '../utils/cloudinary.js';
import { Post } from '../models/post.model.js'
import { User } from '../models/user.model.js'
import { Comment } from '../models/comment.model.js'
import { getReceiverSocketId, io } from '../socket/socket.js';

export const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const  image  = req.file;
        const authorId = req.id;

        if (!image) {
            return res.status(400).json({
                message: "Please upload an image"
            })
        }
        const optimizedImageBuffer = await sharp(image.buffer)
            .resize({ width: 800, height: 800, fit: 'inside' })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer();
        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`; // this is also a method to convert img to data uri

        const cloudResponse = await cloudinary.uploader.upload(fileUri);
        const post = await Post.create({
            caption,
            image: cloudResponse.secure_url,
            author: authorId,
        })
        const user = await User.findById(authorId);
        if (user) {
            user.posts.push(post._id);
            await user.save();
        }
        await post.populate({ path: 'author', select: '-password' })
        return res.status(201).json({
            message: "Post created successfully",
            success: true,
            post
        })

    } catch (error) {
        console.log(error);

    }
}

export const getAllPost = async (req, res) => {
    try { // this below line is jo feed me post aati h uske liye us post me author ka naam or dp aati h
        const posts = await Post.find().sort({ createdAt: -1 }).populate({ path: 'author', select: 'username profilePicture' }) // it is sorted by time of upload //.populate('fieldToBePopulated', 'fieldsFromReferencedCollection') mtlb populate ese kaam krega ke post me author ke details add kr dega kya kya username,profilePicture to jiske add krni h vo path me and then uski kya kya add krni h vo select me
            .populate({
                // ab post me neeche comments bhi aate h to path comments
                path: 'comments',
                sort: { createdAt: -1 },
                populate: { // ab comments me author ka naam or dp aata h to ye uska
                    path: 'author',
                    select: 'username profilePicture'
                }
            })
        return res.status(200).json({
            message: "Posts fetched successfully",
            success: true,
            posts
        })
    } catch (error) {
        console.log("Error in creating post:", error);

        // Respond with an error message and proper status code
        return res.status(500).json({
            message: "Something went wrong while creating the post.",
            success: false
        });

    }
}


// now apni post show krne ke liye my profile
export const getUserPost = async (req, res) => {
    try {
        const authorId = req.id;
        const allPost = await Post.find({ author: authorId }).sort({ createdAt: -1 }).populate({   // allpost becomes an array cz .find method of mongo returns an array
            path: 'author', // whole idea same as above
            select: 'username profilePicture'
        }).populate({
            path: 'comments',
            sort: { createdAt: -1 },
            populate: {
                path: 'author',
                select: 'username profilePicture'
            }
        })
        if (!allPost) return res.status(404).json({ message: "No post found", success: false });
        return res.status(200).json({
            message: "Posts fetched successfully",
            success: true,
            allPost,
        })

    } catch (error) {
        console.log(error);
    }
}


export const likePost = async (req, res) => {
    try {
        const whoWillLike = req.id; // ye logged in user ki value leta h 
        const postId = req.params.id; // params is using as ye api se value aayegi vo lega /:id/ ye vali
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        // like logic started
        await post.updateOne({ $addToSet: { likes: whoWillLike } });  // add to set is a type of set jo duplicate allow nhi krta
        await post.save();

        // implement socket io for real time notification
        const user = await User.findById(whoWillLike).select('username profilePicture');
         
        const postOwnerId = post.author.toString();
        if(postOwnerId !== whoWillLike){ // tbhi notif jaaye if dusre ke post like ho
            // emit a notification event
            const notification = {
                type:'like',
                userId:whoWillLike,
                userDetails:user,
                postId,
                message:'Your post was liked'
            }
            const postOwnerSocketId = getReceiverSocketId(postOwnerId); // we are passing postOwnerId because we want to send notification to post owner
            io.to(postOwnerSocketId).emit('notification', notification);
        }

        return res.status(200).json({message:'Post liked', success:true});
    } catch (error) {

    }
}

export const dislikePost = async (req, res) => {
    try {
        const whoWillLike = req.id; // params is using as ye api se value pass krega
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        // like logic started
        await post.updateOne({ $pull: { likes: whoWillLike } });   // add to set is a type of set jo duplicate allow nhi krta
        await post.save();

        // implement socket io for real time notification
        const user = await User.findById(whoWillLike).select('username profilePicture');
        const postOwnerId = post.author.toString();
        if(postOwnerId !== whoWillLike){
            // emit a notification event
            const notification = {
                type:'dislike',
                userId:whoWillLike,
                userDetails:user,
                postId,
                message:'Your post was liked'
            }
            const postOwnerSocketId = getReceiverSocketId(postOwnerId); // we are passing postOwnerId because we want to send notification to post owner
            io.to(postOwnerSocketId).emit('notification', notification);
        }



        return res.status(200).json({message:'Post disliked', success:true});
    } catch (error) {

    }
}

export const addComment = async (req, res) => {
    try {
        const whoWillComment = req.id;
        const postId = req.params.id;
        const {text} = req.body;
        const post = await Post.findById(postId);
        if (!text) return res.status(404).json({ message: "comment is required", success: false })
        if (!post) return res.status(404).json({ message: "No post found", success: true })
        //comment logic
        const comment = await Comment.create({  // isme whi saare field lene hote h jo schema me defined ho fir unki value jha se aari vo : ke aage lih do
            text: text,
            author: whoWillComment,
            post: postId
        })
        await comment.populate({
            path: 'author',
            select: 'username profilePicture'
        })
        post.comments.push(comment._id);
        await post.save()
        return res.status(201).json({
            message: "Comment added successfully",
            success: true,
            comment,
        })
    } catch (error) {
        console.log(error);

    }
}

export const getComment = async (req, res) => {
    try {
        const postId = req.params.id;

        const comments = await Comment.find({ post: postId }).populate({
            path: 'author',
            select: 'username profilePicture'
        })

        if (!comments) return res.status(404).json({ message: "No comments found", success: true })
        return res.status(200).json({
            message: "Comments found",
            success: true,
            comments
        })
    } catch (error) {
        console.log(error);

    }
}

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id // it is important as logged in user he apni post delete kr skta ho
        const post = await Post.findById(postId)
        if (!post) return res.status(404).json({ message: "No post found", success: true })
        if (post.author.toString() !== authorId) return res.status(403).json({  // yha pr check hoga post ka author or ab jo id mil rhi h vo same h na (authorId.toString())
            message: "You are not authorized to delete this post",
            success: false
        })
        await Post.findByIdAndDelete(postId);

        // remove post id from the user's post jo user ka schema bna hua hai usme jo post h 
        let user = await User.findById(req.id)
        user.posts = user.posts.filter(id => id.toString() !== postId)  // isse vo sari post array me aajegi jo postid delete ho chuki and abhi bhi user post array me h
        await user.save();

        // delete associated coments of that posts
        await Comment.deleteMany({ post: postId });

        return res.status(200).json({ message: "Post deleted successfully", success: true });
    } catch (error) {
        console.log(error);

    }
}

export const bookmarkPost = async(req,res)=>{
    try {
        const postId=req.params.id;
        const authorid=req.id;
        const post=await Post.findById(postId);
        if(!post) return res.status(404).json({message:"No post found",success:true})
        const user= await User.findById(authorid);
    if(!user) return res.status(404).json({message:"No user found",success:false})
        if(user.bookmarks.includes(postId)){  // getting check if it is already in bookamrk array same logic as follwer checking
            // now if bookmark nhi h to krne ka logic or viceversa
            await user.updateOne({$pull:{bookmarks:postId}});  // bbokmark removed
            await user.save();
            return res.status(200).json({type:'unsaved', message:"Post unbookmarked successfully",success:true})
        }
        else{
            await user.updateOne({$addToSet:{bookmarks:postId}});  // bookmark removed
            await user.save();
            return res.status(200).json({type:'saved', message:"Post bookmarked successfully",success:true})
        }
    } catch (error) {
        console.log(error);
        
    }
}