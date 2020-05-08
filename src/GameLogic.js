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
            let planet = new PlanetLogic(11, new Vector3(700*Math.cos(theta), 0, 700*Math.sin(theta)))
            planet.fighters.n = 1024
            this.players[i].planets[planet.id] = planet
            this.players[i].sun.position.set(800*Math.cos(theta), 0, 800*Math.sin(theta))
        }
        let n = 5
        for(let r of [150, 300, 600]) {
            let offset = 2*Math.PI / n / 2
            for(let theta = 0; theta < 2*Math.PI; theta += 2*Math.PI / n) {
                let v = new Vector3(r*Math.cos(theta + offset), 0, r*Math.sin(theta + offset))
                let planet = new PlanetLogic(8, v)
                this.planets[planet.id] = planet
            }
            n*=2
        }
        this.updateLoop = setInterval(this.update.bind(this), 10)
    }

    close() {
        clearInterval(this.updateLoop)
    }
}