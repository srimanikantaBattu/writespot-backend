const User = require('../models/userModel')
const HttpError = require("../models/errorModel")
const bcryptjs = require('bcryptjs')
const jsonwebtoken = require('jsonwebtoken')
const fs=require('fs')
const {v4:uuid} = require('uuid')
const path = require('path')
const expressAsyncHandler = require('express-async-handler')
// ====== REGISTER A NEW USER
// POST REQ : api/users/register UNPROTECTED


const registerUser = async(req,res,next)=>{
    try {
        const {name,email,password,password2} = req.body;
        if(!name || !email || !password){
            return next(new HttpError("Fill in All Fields",422))
        }

        const newEmail = email.toLowerCase()
        const emailExists = await User.findOne({email:newEmail});
        if(emailExists)
            return next(new HttpError("Email Already Exists",422))
        if((password.trim()).length<6)
            return next(new HttpError("Password should be atleast 6 characters",422))
    
    if(password!=password2)
        return next(new HttpError("Passwords do not match",422))
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password,salt);
    const newUser= await User.create({name,email:newEmail,password:hashedPassword});
    res.status(201).json(`New User ${newUser.email} registered.`)
    } catch (error) {
        return next(new HttpError("User registration failed.",422))
    }
}



// ====== LOGIN A  USER
// POST REQ : api/users/login UNPROTECTED
const loginUser = async(req,res,next)=>{
    try {
        
        const {email,password} = req.body;
        console.log("Hello")
        if(!email || !password){
           
            return next(new HttpError("Fill in all the fields.",422))
        }
        const newEmail = email.toLowerCase();
        
        const user = await User.findOne({email:newEmail});
        
        if(!user){
            return next(new HttpError("Invalid Credentials .",422))
        }
        
        const comparePass = await bcryptjs.compare(password,user.password);
        if(!comparePass)
            return next(new HttpError("Invalid Credentials.",422));
        const {_id:id,name} = user;
        const token = jsonwebtoken.sign({id,name},process.env.JWT_SECRET,{expiresIn:"1d"});
    res.status(200).json({token,id,name})
    } catch (error) {
        return next(new HttpError("Login failed. Please check your credentials",422))
    }
    
}



// ====== USER PROFILE
// POST REQ : api/users/:id PROTECTED
const getUser = async(req,res,next)=>{
    try {
        const {id} = req.params;
        const user = await User.findById(id).select('-password');
        if(!user)
            return next(new HttpError("Usernot found",404));
        res.status(200).json(user)
    } catch (error) {
        return next(new HttpError(error));
    }
}



// change User Avatar
// PROTECTED

const changeAvatar = async(req,res,next)=>{
    try {
       if(!req.files.avatar)
        return next(new HttpError("Please choose an image",422))
    // find user 
    const user = await User.findById(req.user.id);
    if(user.avatar)
        {
            fs.unlink(path.join(__dirname,"..",'uploads',user.avatar),(err)=>{
                if(err)
                    return next(new HttpError(err))

            })
        }
        const {avatar} = req.files;
        // if(avatar.size > 500000)
        //     return next(new HttpError("Profile Picture is too Big. Should be less than 500kb"),422)
        let filename ;
        filename = avatar.name;
        let splittedFileName= filename.split('.');
        let newFileName  = splittedFileName[0] + uuid() + '.'+splittedFileName[splittedFileName.length-1];
        avatar.mv(path.join(__dirname,'..','uploads',newFileName),async(err)=>{
            if(err)
                return next(new HttpError(err));
            const updatedAvatar = await User.findByIdAndUpdate(req.user.id,{avatar:newFileName},{new:true})
            if(!updatedAvatar)
                return next(new HttpError("Avatar Couldnot be Changed",422))
            res.status(200).json(updatedAvatar)
        })
    } catch (error) {
        return next(new HttpError(error))
    }
}



// EDIT USER DETAILS
// PROTECTED

const editUserDetails =async (req,res,next)=>{
    try {
        const {name,email,currentPassword,newPassword,newConfirmPassword} = req.body;
        if(!name || !currentPassword || !newPassword)
            {
                return next(new HttpError("Fill in all fields.",422))

            }
            // get user from database
            const user = await User.findById(req.user.id);
            if(!user){
                return next(new HttpError("User not found",403));
            }
            // make sure new email doesn't exist
            const emailExist = await User.findOne({email});
            if(emailExist && (emailExist._id!=req.user.id)){
                return next(new HttpError("Email Already Exists",422))
            }
            // compare current password to db pass
            const validateUserPassword = await bcryptjs.compare(currentPassword,user.password);
            if(!validateUserPassword)
                return next(new HttpError("Invalid Current Password",422))
            // compare new Passwords
            if(newPassword!==newConfirmPassword)
                return next(new HttpError("New Password do not match !",422))
            // hash new Password
            const salt = await bcryptjs.genSalt(10);
            const hash = await bcryptjs.hash(newPassword,salt);
            // update userinfo in database
            const newInfo = await User.findByIdAndUpdate(req.user.id,{name,email,password:hash},{new:true})
            res.status(200).json(newInfo)
        } catch (error) {
        return next(new HttpError(error))
    }
}



// GET AUTHORS
// UNPROTECTED

const getAuthors = async(req,res,next)=>{
    try {
        const authors = await User.find().select('-password');
        res.json(authors);
    } catch (error) {
        return next(new HttpError(error));
    }
}

module.exports={registerUser,loginUser,getUser,changeAvatar,editUserDetails,getAuthors}