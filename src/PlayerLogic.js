import { Vector3 } from 'three'

export default class PlayerLogic {
    constructor(name) {
        this.name = name
        this.planets = []
        this.sun = new SunLogic()
    }

    get object() {
        return { 
            name: this.name, 
            planets: this.planets.map(p => p.object),
            sun: this.sun.object
        }
    }
}