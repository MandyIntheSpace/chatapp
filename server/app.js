const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const validator = require('validator')
const { Server } = require('socket.io')
const http = require('http')
// const { default: CreateRoom } = require('../client/chatapp/src/CreateRoom/CreateRoom')

const app = express()
const port = 5000
// const router = require('./router')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.json())

const server = http.createServer(app)
// const io = socketio(server)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});


const url = 'mongodb+srv://timsinarewon:mandip123@cluster0.dakffnl.mongodb.net/chatapp?retryWrites=true&w=majority';

mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log("mongodb is connected");
    })
    .catch((err) => {
        console.log(err);
    });

const userSchema = new mongoose.Schema({
    username: String,
    email: {
        type: String,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: "The email which you have entered is invalid"
        }
    },
    password: String
}, { collection: 'registration' })

const User = mongoose.model('User', userSchema)



app.post("/registeruser", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(200).send("User registered successfully.");
    } catch (err) {
        if (err.code === 11000) {
            // Duplicate key error
            res.status(409).send("Email already registered.");
        } else {
            res.status(500).send("Error while registering the user.");
        }
    }
});



app.post("/loginuser", async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email: email, password: password })

        if (existingUser) {
            res.status(200).send('User logged in successfully')
        }
        else {
            res.status(401).send('Invalid email and password')
        }
    }
    catch (error) {
        res.status(500).send("Error while loggin in")
        console.log(error)
    }
})


const createRoomSchema = new mongoose.Schema({
    username: String,
    roomID: {
        type: String,
        required: true,
        unique: true,
    },

}, { collection: 'createRoom' });

const createRoom = mongoose.model('createRoom', createRoomSchema)

app.post("/createroom", async (req, res) => {
    const { username, roomID } = req.body

    if (roomID.length < 4) {
        return res.status(400).send("Room ID should be at least 4 characters long")
    }

    try {
        const newCreateRoomSchema = new createRoom({ username, roomID })
        await newCreateRoomSchema.save()
        res.status(200).send("The new room is successfully created")
    }
    catch (err) {
        if (err.name === "ValidationError") {
            res.status(400).send(err.message)
            console.log(err.message)
        }
        else if (err.code === 11000) {
            res.status(409).send("The same room id is already created")
        } else {
            res.status(500).send("Error while creating a new room")
        }
    }

})

app.post("/joinroom", async (req, res) => {
    const { username, room } = req.body

    const existingRoom = await createRoom.findOne({ roomID: room })
    try {
        if (existingRoom) {
            res.status(200).status("Joined the Room Successfully")
        }
        else {
            res.status(401).send("Invalid room id rendered")
        }
    }
    catch (error) {
        res.status(500).send("Error while entering the room")
        console.log(error)
    }

})


io.on('connection', (socket) => {
    console.log(`The scoket is being connected ${socket.id}`)

    //for getting the value from the frontend
    socket.on("join_room", (data) => {
        socket.join(data)
        console.log(`User with the id ${socket.id} joined the room: ${data}`)
    })

    socket.on("send_message", (data) => {~
        socket.to(data.actualRoom).emit("receive_message", data)
        console.log(data)
    })

    socket.on("disconnect", () => {
        console.log(`User Disconnected ${socket.id}`)
    })
})




// app.use(router)

server.listen(port, () => {
    console.log(`Server started on the ${port}`)
})