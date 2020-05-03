import FightersLogic from "./FightersLogic.js"


export default class PlanetLogic {

    constructor(radius, position) {
        this.position = position
        this.radius = radius
        this.fighters = new FightersLogic(this, 0)
    }


}