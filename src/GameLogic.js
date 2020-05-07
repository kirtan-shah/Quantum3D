import { Vector3 } from 'three'
import PlayerLogic from './PlayerLogic.js'
import PlanetLogic from './PlanetLogic.js'

export default class GameLogic {
    constructor(io, room) {
        this.io = io
        this.room = room
        this.players = []
        this.planets = {}
        this.creationTime = Date.now()
        this.seed = this.creationTime
    }

    update() {
        this.seed = Date.now()
        for(let player of this.players) player.update(10/1000, this.seed)
        this.io.to(this.room).emit('update', this.object)
    }
    get object() {
        let planets = {}
        Object.keys(this.planets).forEach((key, i) => planets[key] = this.planets[key].object)
        return {
            players: this.players.map(p => p.object),
            planets,
            baseSeed: this.seed
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
            this.players[i].planets[planet.id] = planet
        }
        for(let i = 0; i < 50; i++) {
            let r = Math.random()
            r = r*r
            r *= 1500
            let theta = Math.random() * 2*Math.PI
            let planet = new PlanetLogic(5 + Math.random()*2, new Vector3(r*Math.cos(theta), Math.random()*3000 - 1500, r*Math.sin(theta)))
            this.planets[planet.id] = planet
        }
        this.updateLoop = setInterval(this.update.bind(this), 10)
    }

    close() {
        clearInterval(this.updateLoop)
    }
}