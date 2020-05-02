import { TextureLoader, PointsMaterial, BufferGeometry, Vector3, Plane, Mesh, Points, BufferAttribute, DynamicDrawUsage, Group } from './three/build/three.module.js';
import Stars from './Stars.js'
import { randomGaussian } from './utils.js'

export default class Fighters {
    constructor(logic) {
        this.logic = logic

        this.geometry = new BufferGeometry()
        this.geometry.setDrawRange(0, this.logic.n)
        this.geometry.setAttribute('position', new BufferAttribute(this.logic.points, 3).setUsage(DynamicDrawUsage))

        this.material = new PointsMaterial( { size: .3, color: 0x00ff00 })
        this.mesh = new Points(this.geometry, this.material)
    }

    update(dt) {
        for(let i = 0; i < this.logic.n; i++) {
            let v = new Vector3(this.logic.points[i*3], this.logic.points[i*3 + 1], this.logic.points[i*3 + 2])
            v.applyAxisAngle(this.logic.particleData[i].angle, this.logic.particleData[i].orbitSpeed * dt)
            this.logic.points[i*3 + 0] = v.x
            this.logic.points[i*3 + 1] = v.y
            this.logic.points[i*3 + 2] = v.z
            this.logic.particleData[i].angle.add(new Vector3(randomGaussian(), randomGaussian(), randomGaussian()).setLength(.1)).normalize()
        }
        this.geometry.attributes.position.needsUpdate = true
    }

    add(n, auto=true, newParticleData) {
        if(n > 0) {
            if(auto) this.generate(this.logic.n, this.logic.n + n)
            else {
                this.logic.points[this.logic.n*3 + 0] = newParticleData.position.x
                this.logic.points[this.logic.n*3 + 1] = newParticleData.position.y
                this.logic.points[this.logic.n*3 + 2] = newParticleData.position.z                
                this.logic.particleData[this.logic.n] = { angle: newParticleData.angle, orbitSpeed: newParticleData.orbitSpeed }
            }
        }
        this.logic.n += n
        this.geometry.setDrawRange(0, this.logic.n)
        this.geometry.computeBoundingSphere()
        this.geometry.attributes.position.needsUpdate = true
        if(n < 0) {
            return { 
                particleData: this.logic.particleData.slice(this.logic.n, this.logic.n - n),
                points: this.logic.points.slice(this.logic.n*3, (this.logic.n - n)*3)
            }
        }
    }
}