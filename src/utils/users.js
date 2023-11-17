const users = []

//addUser, removeUser, getUser, getUsersInRoom

//add user to chat attendance
const addUser = ({ id, username, room }) => {
    //clean data from client
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //validate data from client
    if(!username || !room) {
        return {
            error: "Must provide username and room."
        }
    }

    //check for existing user
    const existingUser = users.find((user) => {
        //check if user's room and name are identical to an existing user's
        return user.room === room && user.username === username
        //return will only return to the nearest nested function
    })

    //validate username
    if(existingUser) {
        return {
            error: 'Username is in use! Try another.'
        }
    }

    //store user
    const user = { id, username, room }
    users.push(user)
    return { user }  //return user to the original function call
}

//remove user from chat attendance
const removeUser = (id) => {
    //look for a match
    const index = users.findIndex((user) => user.id === id) //shorthand for return with curly braces

    //if a match is found (index will be -1 by default)
    if(index !== -1) {
        return users.splice(index, 1)[0] //will only ever be removing one user, return the user object that was removed
    }
}

//get user by id
const getUser = (id) => {
    //look for a match, optimal code below
    return users.find((user) => user.id === id)
}

//get list of users in a given room
const getUsersInRoom = (room) => {
    //filter users by room
    return users.filter((user) => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}