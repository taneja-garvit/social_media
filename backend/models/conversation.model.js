import mongoose from "mongoose";
const conversationSchema = new mongoose.Schema({
    participants: [{             // in array cz many ppl can chat at group chat
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    messages:[ {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    }],
})

export const Conversation = mongoose.model('Conversation', conversationSchema);