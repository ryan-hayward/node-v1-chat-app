//connect to the server, initialize client-side socket
const socket = io()

// Elements from the DOM
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('#txt-input')
const $messageFormButton = document.querySelector('#msg-button')
const $sendLocation = document.querySelector('#send-location')
const $messages = document.querySelector("#messages")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#loc-message-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true }) //parses query string from Join room form

//run a function upon receiving an event from the server
// socket.on('countUpdated', (countA) => {
//     console.log('the count has been updated.', countA)
// })

//send the user-inputted message to the server
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault() //prevent empty string or default value from being passed

    $messageFormButton.setAttribute('disabled', 'disabled')  // disable button

    //send message back to server
    socket.emit('sendMsg', $messageFormInput.value, (error) => {
        $messageFormButton.removeAttribute('disabled') //re-enable button upon message emittance
        $messageFormInput.value = '' //clear message form
        $messageFormInput.focus() //put cursor on the form input

        if(error) {
            return console.log(error)
        }
        return console.log('Message Delivered.')
    })
})

//send location when the user presses the share location button
$sendLocation.addEventListener('click', () => {
    //send alert if geolocation is not supported by the browser
    if(!navigator.geolocation) {
        return alert("Geolocation not supported by your browser.")
    }

    $sendLocation.setAttribute('disabled', 'disabled') //disable the button until location is fetched below

    //get current location via mozilla dev network browser api
    //no need to install anything here since client is executing this code
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("sendLocation", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (error) => {
            if(error) {
                return console.log("Oops. Something went wrong.") //failure msg
            }

            $sendLocation.removeAttribute('disabled') //re-enable button
            return console.log("Location shared!")  //success msg
        })
    })
})

//auto-scrolling logic, called whenever a new message is rendered AND
//the user is scrolled to the bottom of the chat
const autoscroll = () => {
    //new message element from chat.html
    const $newMessage = $messages.lastElementChild
    //getComputedStyle provided by the browser
    const newMessageStyles = getComputedStyle($newMessage)
    //get the height of the new message and add margin
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    //get visible height (scrollbar height)
    const visibleHeight = $messages.offsetHeight
    //get total height of container
    const containerHeight = $messages.scrollHeight
    //compute how far down we have scrolled thus far from the top
    const scrollOffset = $messages.scrollTop + visibleHeight
    //check if we were scrolled to the bottom already
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight // will push us to the bottom
    }
}


//SHOW generic messages
socket.on('message', (message) => {
    
    //no need to install mustache as it is included in index.html file
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm:ss a')
    })  //stores the final html to be rendered in the browser
    //insert html
    $messages.insertAdjacentHTML('beforeend', html) //new messages at the bottom of the message div
    autoscroll()
})

//SHOW location messages
socket.on('locationMessage', (locationMessage) => {

    const html = Mustache.render(locationTemplate, {
        username: locationMessage.username,
        locationUrl: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('h:mm:ss a')
    })

    console.log(html)

    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//get users in room
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

//let client know if there is an error
socket.emit('join', { username, room }, (error) => {
    //show error if error
    if (error) {
        alert(error)  //send alert
        location.href = '/'  //send to the root of the site
    }

})