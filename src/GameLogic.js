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
            let planet = new PlanetLogic(11, new Vector3(650*Math.cos(theta), 0, 650*Math.sin(theta)))
            this.players[i].planets[planet.id] = planet
        }
        let n = 6
        let toggle = false
        for(let r of [150, 300, 600]) {
            for(let theta = 0; theta < 2*Math.PI; theta += 2*Math.PI / n) {
                let v = new Vector3()
                if(toggle) v.set(r*Math.cos(theta), r*Math.sin(theta), 0)
                else v.set(r*Math.cos(theta), 0, r*Math.sin(theta))
                let planet = new PlanetLogic(8, v)
                this.planets[planet.id] = planet
            }
            //toggle = !toggle
            n*=2
        }
        this.updateLoop = setInterval(this.update.bind(this), 10)
    }

    close() {
        clearInterval(this.updateLoop)
    }
}