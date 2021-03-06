import { Vector3, Plane } from 'three'
import { randomGaussian, setSeed } from './utils.js'

const bufferLength = 4096

export default class FightersLogic {
    constructor(planet, n) {
        this.planet = planet
        this.n = n

        this.particleData = new Array(bufferLength)
        this.points = new Array(bufferLength * 3).fill(0)
        this.generate(0, this.n)
    }
    get object() {
        return { n: this.n }
    }

    update(dt, seed) {
        //setSeed(seed)
        //this.stepOrbit(dt)
    }

    //NOT NEEDED?
    stepOrbit(dt) {
        for(let i = 0; i < this.n; i++) {
            let v = new Vector3(this.points[i*3], this.points[i*3 + 1], this.points[i*3 + 2])
            v.applyAxisAngle(this.particleData[i].angle, this.particleData[i].orbitSpeed * dt)
            this.points[i*3 + 0] = v.x
            this.points[i*3 + 1] = v.y
            this.points[i*3 + 2] = v.z
            this.particleData[i].angle.add(new Vector3(randomGaussian(), randomGaussian(), randomGaussian()).setLength(.1)).normalize()
        }
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
            v.setLength(this.planet.radius * (Math.random() / 10 + 1.2))
            v.applyAxisAngle(angle, Math.random() * 2*Math.PI)
            this.points[i*3 + 0] = v.x
            this.points[i*3 + 1] = v.y
            this.points[i*3 + 2] = v.z 
            this.particleData[i] = { angle: angle.clone(), orbitSpeed }
        }
    }

    add(n, auto=true, newParticleData) {
        let data
        if(n > 0) {
            if(auto) this.generate(this.n, this.n + n)
            else {
                this.points[this.n*3 + 0] = newParticleData.position.x
                this.points[this.n*3 + 1] = newParticleData.position.y
                this.points[this.n*3 + 2] = newParticleData.position.z                
                this.particleData[this.n] = { angle: newParticleData.angle, orbitSpeed: newParticleData.orbitSpeed }
            }
        }
        this.n += n
        if(n < 0) {
            return { 
                particleData: this.particleData.slice(this.n, this.n - n),
                points: this.points.slice(this.n*3, (this.n - n)*3)
            }
        }
    }
}