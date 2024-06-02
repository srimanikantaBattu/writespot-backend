const Post = require('../models/postModel')
const User = require('../models/userModel')
const path = require('path');
const fs = require('fs');
const {v4:uuid} = require('uuid');
const HttpError = require('../models/errorModel')

const createPost = async (req,res,next)=>{
    try {
        let {title,category,description} = req.body;
        if(!title || !category || !description.length || !req.files)
            return next(new HttpError("Fill in all the fields and choose thumbnail",422));
        const {thumbnail} = req.files;
        // file size
        if(thumbnail.size > 2000000)
            return next(new HttpError("Thumbnail too big. File Should be less than 2mb",422));
        let fileName = thumbnail.name;
        let splittedFileName = fileName.split('.');
        let newFilename = splittedFileName[0]+uuid()+"."+splittedFileName[splittedFileName.length-1];
        thumbnail.mv(path.join(__dirname,'..','/uploads',newFilename),async (err)=>{
            if(err)
                return next(new HttpError(err));
            else{
                const newPost = await Post.create({title,category,description,thumbnail:newFilename,creator:req.user.id})
                if(!newPost)
                    return next(new HttpError("Post couldn't be Created",422)); 
                // post count inc by 1
                const currentUser = await User.findById(req.user.id);
                console.log(req.user.id);
                const userPostCount = currentUser.posts+1;
                await User.findByIdAndUpdate(req.user.id,{posts:userPostCount});
                res.status(201).json(newPost);
            }
        })
    } catch (error) {
        return next(new HttpError(error));
    }
}




const createComment = async (req,res,next)=>{
    let {commentedUser,comment,postID,userID} = req.body;
    try {
        const thatpost = await Post.findById(postID);
        const date = new Date();
        const isoString = date.toISOString();
        thatpost.comments.push({commentedUser:commentedUser,comment:comment,times:isoString,userID:userID})
       console.log(thatpost.comments)
       await Post.findByIdAndUpdate(postID,{comments:thatpost.comments});
    } catch (error) {
        return next(new HttpError(error));
    }
}





const getPost = async (req,res,next)=>{
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if(!post)
            return next(new HttpError("Post not found",404));
        res.status(200).json(post)
    } catch (error) {
        return next(new HttpError(error));
    }
}





const getPosts = async (req,res,next)=>{
    try {
        const posts = await Post.find().sort({updatedAt:-1})
        res.status(200).json(posts);
    } catch (error) {
        return next(new HttpError(error))
    }
}




const getCatPosts = async (req,res,next)=>{
    try {
        const {category} = req.params;
        const catPosts = await Post.find({category}).sort({createdAt:-1});
        res.status(200).json(catPosts)
    } catch (error) {
        return next(new HttpError(error))
    }
}



const getUserPosts = async (req,res,next)=>{
    try {
        const {id} = req.params;
        const posts = await Post.find({creator:id}).sort({createdAt:-1});
        res.status(200).json(posts);
    } catch (error) {
        return next(new HttpError(error));
    }
}



const editPost = async (req,res,next)=>{
    try {
        let fileName;
        let newFilename;
        let updatedPost;
        const postId = req.params.id;
        let {title,category,description} = req.body;
        // react Quill has already 11
        if(!title || !category || description.length<12){
            return next(new HttpError("Fill in all Field",422));}
            else{
                // get old post
                const oldPost = await Post.findById(postId);
                if(req.user.id==oldPost.creator){
                    if(!req.files){
                        updatedPost = await Post.findByIdAndUpdate(postId,{title,category,description},{new:true});
                    }
                else{
                // delete old thumbnail
                fs.unlink(path.join(__dirname,'..','uploads',oldPost.thumbnail),async (err)=>{
                    if(err)
                        return next(new HttpError(err))
                })
                // upload new thumbnail
                const {thumbnail} = req.files;
                if(thumbnail.size >2000000){
                    return next(new HttpError("Thumbnail is too big. Should be less than 2mb"))

                }
                fileName = thumbnail.name;
                let splittedFileName = fileName.split('.');
                newFilename = splittedFileName[0]+uuid()+'.'+splittedFileName[splittedFileName.length -1];
                thumbnail.mv(path.join(__dirname,'..','uploads',newFilename),async (err)=>{
                    if(err)
                        return next(new HttpError(err))
                })
                updatedPost = await Post.findByIdAndUpdate(postId,{title,category,description,thumbnail:newFilename},{new:true});
        }
    }
    }
        if(!updatedPost){
            console.log(updatedPost);
            return next(new HttpError("Could not Update the post",400))
        }
        res.status(200).json(updatedPost);
    } catch (error) {
        return next(new HttpError(error))
    }
}




const deletePost = async (req,res,next)=>{
    try {
        const postId = req.params.id;
        if(!postId){
            return next(new HttpError("Post Unavailable",400));
        }
        const post = await Post.findById(postId);
        const fileName = post?.thumbnail;
        if(req.user.id==post.creator){
        // delete thumbnail
        fs.unlink(path.join(__dirname,"..",'uploads',fileName),async (err)=>{
            if(err)
                return next(new HttpError(err))
            await Post.findByIdAndDelete(postId);
            // find user and reduce count
            const currentUser = await User.findById(req.user.id);
            const userPostCount = currentUser?.posts-1;
            await User.findByIdAndUpdate(req.user.id,{posts:userPostCount})
            res.json(`Post ${postId} deleted Successfully`);
            
        })
    }else{
        console.log("Hello")
        return next(new HttpError("POST Couldn't be Deleted",403))
    }
        
    } catch (error) {
        return next(new HttpError(error))
    }
}

module.exports = {createPost,getPosts,getPost,getCatPosts,getUserPosts,editPost,deletePost,createComment}