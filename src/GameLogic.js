import { Vector3 } from 'three'
import PlayerLogic from './PlayerLogic.js'
import PlanetLogic from './PlanetLogic.js'

export default class GameLogic {
    constructor(io, room) {
        this.io = io
        this.room = room
        this.players = []
        this.creationTime = Date.now()
    }

    update() {
        //update code
        this.io.to(this.room).emit('update', this.object)
    }
    get object() {
        return {
            players: this.players
        }
    }

    addPlayer(name) {
        this.players.push(new PlayerLogic(name))
    }
    removePlayer(name) {
        this.players = this.players.filter(p => p.name !== name)
    }

    getPlayerNames() {
        return this.players.map(p => p.name)
    }
    
    start() {
        for(let i = 0; i < this.players.length; i++) {
            let theta = 2*Math.PI * i / this.players.length
            let planet = new PlanetLogic(6, new Vector3(60*Math.cos(theta), 0, 60*Math.sin(theta)))
            this.players[i].planets.push(planet)
        }
        this.updateLoop = setInterval(this.update.bind(this), 10)
    }

    close() {
        clearInterval(this.updateLoop)
    }
}