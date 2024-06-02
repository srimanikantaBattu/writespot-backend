const {Schema,model} = require("mongoose");

const postSchema = new Schema({
    title:{type:String,required:true},
    category:{type:String,enum:["Agriculture" , "Education" , "Business" , "Entertainement" , "Art" , "Economy" , "Weather" , "Cricket" , "Uncategorized"],message:"Value is not supported"},
    description:{type:String,required:true},
    creator:{type:Schema.Types.ObjectId,ref:"User"},
    thumbnail:{type:String,required:true},
    comments:{type:[{
        commentedUser:{type:String},
        comment:{type:String,required:true},
        times:{type:String},
        userID:{type:String}
    }]}
},{timestamps:true})

module.exports = model("Post",postSchema);