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
        for(let player of this.players) player.update(1/90, this.seed)
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
            for(let r of [150, 320, 470]) {
                let theta = 2*Math.PI * i / this.players.length
                let planet = new PlanetLogic(15)
                planet.fighters.n = 128
                planet.orbitRadius = r
                planet.orbitSpeed = 0.7 / r
                this.players[i].planets[planet.id] = planet
                this.players[i].position.set(1000*Math.cos(theta), 0, 1000*Math.sin(theta))
            }
        }
        this.createRing(35, 4)
        this.createRing(150, 10)
        this.updateLoop = setInterval(this.update.bind(this), 1000/90)
    }

    createRing(r, n, thetaStart=0, thetaLength=2*Math.PI) {
        for(let theta = thetaStart; theta < thetaStart + thetaLength; theta += 2*Math.PI / n) {
            let planet = new PlanetLogic(8, new Vector3(r*Math.cos(theta), 0, r*Math.sin(theta)))
            this.planets[planet.id] = planet
        }
    }

    close() {
        clearInterval(this.updateLoop)
    }
}