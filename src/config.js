const mongoose=require("mongoose");
const connect=mongoose.connect("mongodb://localhost:27017/registration")
connect.then(()=>{
    console.log("connected");
})
.catch(()=>{
    console.log("can't connect");
})
const LoginSchema= new mongoose.Schema({
    name: {
        type: String,
        required:true
    },
    password: {
        type: String,
        required: true
    },
    Gsuite : {
        type: String,
        required :  true
    },
    enrollment_number  : {
        type : String,
        required : true
    },
    department : {
        type : String,
        required : true
    },
    mobile : {
        type : Number,
        required : true
    },
    year : {
        type : Number,
        required : true
    },
    userImage: {
        type: String 
    },
    isAdmin: {
        type: Boolean,
        default: false 
    },
    approved : {
        type : Boolean,
        default : false
    },
    active : {
        type : Boolean,
        default : true
    },
    logged: {
        type : Boolean,
        default : false
    },
    date : {
        type : String
    }
});
const collection=new mongoose.model("users",LoginSchema);
module.exports=collection;