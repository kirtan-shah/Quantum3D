import FightersLogic from "./FightersLogic.js"
import { entityId } from './ID.js'

export default class PlanetLogic {

    constructor(radius, position) {
        this.position = position
        this.radius = radius
        this.id = entityId()
        this.fighters = new FightersLogic(this, 1024)
    }

    update(dt, seed) {
        this.fighters.update(dt, seed + this.id*100000)
    }

    get object() { 
        return { id: this.id, radius: this.radius, position: this.position, fighters: this.fighters.object }
    }


}