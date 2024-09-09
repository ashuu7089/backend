import {mongoose, Schema} from "mongoose";

 const subcriptionSchema = new Schema({
    subcriber : {
        type : Schema.Types.ObjectId, //one who is subcribing
        ref : "User"
    },
    channels : {
        type : Schema.Types.ObjectId, //one who is subcriber
        ref : "User"
    }
 },{
    timestamps : true
 })


 export const Subscription = mongoose.model('Subcription', subcriptionSchema)