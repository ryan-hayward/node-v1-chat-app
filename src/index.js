const http = require('http')
const express = require('express')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

//set up an express app and define the specified port
const app = express()
const server = http.createServer(app) //create a new web server explicitly to enable usage of socket.io
const io = socketio(server) //configure socketio with the server
const port = process.env.PORT || 3000

//serve up the public directory
app.use(express.static(path.join(__dirname, '../public/')))

//dummy var too demonstrate for socket emit
//let count = 0

//server (emit) => client (receive) - count updated
//client (emit) => server (receive) - increment

//print msg when a given client connects. Socket is an object that contains info on the client
//socket.emit is for a singular connection, call io.emit instead to emit event to all available connections
io.on('connection', (socket) => {
    console.log('New Websocket Connection')

    // listen for the chat room the user would like to join
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({  //destructure from the add user call
            id: socket.id,
            username,
            room
        })
        // send error if the username & room combo has been added already
        if (error) {
            return callback(error)
        }

        socket.join(user.room) // join a given chat room, can only be done on the server

        socket.emit('message', generateMessage('Welcome!', "Admin")) //welcome user to room
        socket.broadcast.to(user.room).emit('message', generateMessage(user.username + " has joined the chat.", "Admin")) //alert
        //get list of users in room for the sidebar
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        // socket.emit (only one client), io.emit (all clients), socket.broadcast.emit (all clients except sending client)
        // io.to.emit (emit to everyone in a room), socket.broadcast.to.emit (send to all in room except sender)

        callback()
    })

    //listen for event submitted by client
    socket.on("sendMsg", (message, callback) => {
        const filter = new Filter() //declare new filter for bad words
        //call the callback to reject the message
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed. Go fuck yourself.')
        }
        const user = getUser(socket.id) //get user who has initiated the event

        io.to(user.room).emit('message', generateMessage(message, user.username))
        callback()
    })

    //listen for client location
    socket.on("sendLocation", (position, callback) => {
        //param to send to generateLocationMessage
        const url = "https://google.com/maps?q=" + position.latitude + "," + position.longitude

        const user = getUser(socket.id) //get user who has initiated the event

        io.to(user.room).emit('locationMessage', generateLocationMessage(url, user.username))

        if (!position.latitude || !position.longitude) {
            return callback(error)
        }

        callback()
    })

    //built-in socket.io event for when the client disconnects
    socket.on('disconnect', () => {

        const user = removeUser(socket.id)  //either get user removed or undefined

        if(user) {
            io.to(user.room).emit('message', generateMessage(user.username + " has disconnected from the chat.", "Admin"))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

//have the server listen on the specified port + a success message
server.listen(port, () => {
    console.log('Server is up and running on port ' + port)
})
