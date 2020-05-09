import express from 'express'
import socket from 'socket.io'
import GameLogic from './GameLogic.js'
const app = express()
const port = 971
app.use(express.static('public'))
express.static.mime.define({'application/wasm': ['wasm']})

let games = {}
function generateId() {
    let id = ''
    for(let i = 0; i < 4; i++) id += String.fromCharCode(65 + Math.floor(Math.random()*26))
    return id
}

let server = app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
let io = socket(server)

let sockets = {}

io.on('connection', function(socket) {
    socket.on('createRoom', () => {
        let room = generateId()
        games[room] = new GameLogic(io, room)
        socket.emit('roomCode', room)
    })
    socket.on('joinRoom', (room, name) => {
        if(!(room in games)) {
            socket.emit('joinFail')
        }
        else {
            socket.emit('joinSuccess')
            sockets[name] = socket
            games[room].addPlayer(name)
            socket.join(room)
            socket.room = room
            io.to(room).emit('playersList', games[room].getPlayerNames())
        }
        
    })
    socket.on('removePlayer', (room, name) => {
        if(!(room in games)) return
        games[room].removePlayer(name)
        sockets[name].disconnect()
        io.to(room).emit('playersList', games[room].getPlayerNames())
    })
    socket.on('startGame', (room) => {
        games[room].start()
        io.to(room).emit('startingGame', games[room].object)
    })
    socket.on('disconnect', () => {
        let room = ''
        for(let key of Object.keys(sockets)) {
            if(sockets[key] == socket) {
                games[socket.room].removePlayer(key)
                if(games[socket.room].players.length == 0) {
                    games[socket.room].close()
                    delete games[socket.room]
                }
                room = socket.room
                break
            }
        }
        if(!room || !games[room]) return
        io.to(room).emit('playersList', games[room].getPlayerNames())
    })
})
