//import FightersLogic from "./FightersLogic.js"
import { entityId } from './ID.js'

export default class PlanetLogic {

    constructor(radius, position) {
        this.position = position
        this.radius = radius
        this.id = entityId()
        //this.fighters = new FightersLogic(this, 0)
    }

    get object() { 
        return { id: this.id, radius: this.radius, position: this.position }
    }


}