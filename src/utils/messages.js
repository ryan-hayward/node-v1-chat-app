//file is focused on generating messages

const generateMessage = (text, username) => {
    
    return {
        username,
        text,
        createdAt: new Date().getTime() //get timestamp of message
    }
}

const generateLocationMessage = (url, username) => {

    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}