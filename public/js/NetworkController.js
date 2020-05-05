
export default class NetworkController {

    constructor(server, onStart) {
        this.server = server
        this.onStart = onStart
        this.gameObject = {}
        this.room = ''
        this.pollingPlayers = 0
        this.creator = false
    }

    initSocket() {
        const self = this
        const socket = this.socket
        socket.on('playersList', (players) => {
            let str = ''
            players.forEach((player) => str += `<span letters="${player.substring(player.length-4)}">${player.substring(0, player.length - 4)}</span>`)
            $('#players').html(str)
            if(this.creator) $('#players').children().click((event) => self.removePlayer(event.target.innerHTML + event.target.getAttribute('letters')))
        })
        socket.on('startingGame', (object) => {
            $('#backdrop').fadeOut(200)
            $('.page').fadeOut(200)
            this.gameObject = object
            this.onStart()
        })
        socket.on('update', (object) => this.gameObject = object)
        socket.on('disconnect', () => location.reload())

    }
    createRoom() {
        const self = this
        const socket = io()
        this.name = $('#nickname').val() + this.generateId()

        socket.on('connect', () => {
            socket.emit('createRoom')
        })
        socket.on('roomCode', (code) => {
            self.room = code
            $('#room-code').text(`Room Code: ${self.room}`)
            socket.emit('joinRoom', self.room, self.name)
        })
        this.socket = socket
        this.initSocket()
        this.creator = true
    }
    joinRoom(code) {
        const self = this
        const socket = io()
        this.room = code
        this.name = $('#nickname').val() + this.generateId()

        socket.on('connect', () => socket.emit('joinRoom', self.room, self.name))
        this.socket = socket
        this.initSocket()
        this.creator = false
    }
    startGame() {
        this.socket.emit('startGame', this.room)
    }
    removePlayer(player) {
        console.log(this.name, player)
        if(this.name === player) {
            alert('You can\'t remove yourself!')
            return
        }
        this.socket.emit('removePlayer', this.room, player)
    }

    generateId() {
        let id = ''
        for(let i = 0; i < 4; i++) id += String.fromCharCode(65 + Math.floor(Math.random()*26))
        return id
    }

}

