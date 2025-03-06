// import {Server} from "socket.io";
// import express from "express";
// import http from "http";

// const app = express();

// const server = http.createServer(app);

// const io = new Server(server, {
//     cors:{
//         origin:'http://localhost:5173/',
//         methods:['GET','POST']
//     }
// })

// const userSocketMap = {} ; // this map stores socket id corresponding the user id; userId -> socketId

// export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId]; // this function returns the socket id of the receiver user of reciever jo mess ke part me need h

// io.on('connection', (socket)=>{      // ye socket basically ek client h jo frontend se connection hone pr aayega
//     const userId = socket.handshake.query.userId;
//     if(userId){
//         userSocketMap[userId] = socket.id;
//     }

//     io.emit('getOnlineUsers', Object.keys(userSocketMap));  // these emit event are listened by client side
 
//     socket.on('disconnect',()=>{
//         if(userId){
//             delete userSocketMap[userId];
//         }
//         io.emit('getOnlineUsers', Object.keys(userSocketMap));
//     });
// })

// export {app, server, io};


// // import {Server} from 'socket.io';
// // import express from 'express';
// // import http from 'http'; // this is inbuilt

// // const app= express()

// // const server = http.createServer(app);  

// // const io = new Server(server, {        // ese socket ka ek server reate ho jayega
// //     cors: {
// //         origin: "http://localhost:5173",
// //         methods: ["GET", "POST"],
// //     }
// // })

// // const userSocketMap = {}  // this map will store socket id correspond to that user ki id ; userid => socketid , isse ye pta chlega kon kon online h jis jis user id ki socket id hogi vo online show ho ga

// // io.on('connection', (socket)=>{
// //     const userId =  socket.handshake.query.userId
// //     if(userId){  //if login h tbhi aayegi userId
// //         userSocketMap[userId]= socket.id; // to map me socketid store ho jayegi
// //     }
// //     io.emit('getOnlineUsers', Object.keys(userSocketMap))  //io.emit() function is broadcasting an event ('getOnlineUsers') to all connected clients. 
// //     //'getOnlineUsers': This is the name of the event being emitted. All connected clients can listen for this event on their side, and when it's emitted,
// //     //Object.keys(userSocketMap): This gets an array of all the user IDs that are currently in userSocketMap
// //     // to userSocketMap me whi id h jinki socke id h to technically whi users online h to object.keys me whi id store ho rhi h
// //     //  userSocketMap stores a mapping between user IDs and their corresponding socket IDs, using Object.keys() will return all the currently online user IDs. In other words, it shows which users are online based on who is connected.
// //     // on disconnect
// //     socket.on('disconnect', () => {
// //         delete userSocketMap[userId]; // to map se userId delete ho jayega
// //         });
// //         io.emit('getOnlineUsers', Object.keys(userSocketMap)) // update online users list jo disconnect/delete hua
// // })

// // export  {app,server,io}   // ye index.js me import




import {Server} from "socket.io";
import express from "express";
import http from "http";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors:{
        origin:process.env.URL,
        methods:['GET','POST']
    }
})

const userSocketMap = {} ; // this map stores socket id corresponding the user id; userId -> socketId

export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

io.on('connection', (socket)=>{
    const userId = socket.handshake.query.userId;
    if(userId){
        userSocketMap[userId] = socket.id;
    }

    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    socket.on('disconnect',()=>{
        if(userId){
            delete userSocketMap[userId];
        }
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });
})

export {app, server, io};