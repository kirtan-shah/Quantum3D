import { Vector3 } from 'three'
import SunLogic from './SunLogic.js'

export default class PlayerLogic {
    constructor(name) {
        this.name = name
        this.planets = {}
        this.position = new Vector3()
    }

    update(dt, seed) {
        for(let planet of Object.values(this.planets)) planet.update(dt, seed)
    }

    get object() {
        let planets = {}
        Object.keys(this.planets).forEach((key, i) => planets[key] = this.planets[key].object)
        return { 
            name: this.name, 
            planets,
            position: this.position
        }
    }
}