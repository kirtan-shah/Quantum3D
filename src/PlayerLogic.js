import { Vector3 } from 'three'
import SunLogic from './SunLogic.js'

export default class PlayerLogic {
    constructor(name) {
        this.name = name
        this.planets = {}
        this.sun = new SunLogic()
    }

    update(dt) {
        for(let planet of Object.values(this.planets)) planet.update(dt)
    }

    get object() {
        let planets = {}
        Object.keys(this.planets).forEach((key, i) => planets[key] = this.planets[key].object)
        return { 
            name: this.name, 
            planets,
            sun: this.sun.object
        }
    }
}