import { Vector3 } from '/js/three/build/three.module.js'

const bufferLength = 4096

export default class FightersLogic {
    
    constructor(planet, n) {
        this.planet = planet
        this.n = n
        this.bufferLength = bufferLength

        this.particleData = new Array(bufferLength)
        this.points = new Float32Array(bufferLength * 3)
        for(let i = 0; i < this.points.length; i++) this.points[i] = 0
        this.generate(0, this.n)
    }

    generate(start, n) {
        for(let i = start; i < n; i++) {
            let v = new Vector3()
            let angle = new Vector3(randomGaussian(), randomGaussian(), randomGaussian()).normalize()
            let initialPos = new Vector3(Math.random(), Math.random(), Math.random())
            let orbitPlane = new Plane(angle.clone())
            let orbitSpeed = (Math.random() * 0.6) + 0.6
            if(Math.random() < .5) orbitSpeed *= -1
            orbitPlane.projectPoint(initialPos, v)
            v.setLength(this.logic.planet.radius * (Math.random() / 10 + 1.2))
            v.applyAxisAngle(angle, Math.random() * 2*Math.PI)
            this.points[i*3 + 0] = v.x
            this.points[i*3 + 1] = v.y
            this.points[i*3 + 2] = v.z 
            this.particleData[i] = { angle: angle.clone(), orbitSpeed }
        }
    }
}