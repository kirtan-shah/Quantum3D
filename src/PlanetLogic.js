import FightersLogic from "./FightersLogic.js"
import { entityId } from './ID.js'

export default class PlanetLogic {

    constructor(radius) {
        this.radius = radius
        this.id = entityId()
        this.fighters = new FightersLogic(this, 0)
        this.orbitRadius = 0
        this.ring = -1
    }

    update(dt, seed) {
        this.fighters.update(dt, seed + this.id*100000)
    }

    get object() { 
        return { id: this.id, radius: this.radius, fighters: this.fighters.object, orbitRadius: this.orbitRadius }
    }


}