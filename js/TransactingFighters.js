import { Vector3, BufferGeometry, Points, PointsMaterial, BufferAttribute, DynamicDrawUsage, Plane } from './three/build/three.module.js'
import { randomGaussian, shiftElementsBack } from './utils.js'

export default class TransactingFighters {
    constructor(from, to, n, particleData, points) {
        this.from = from
        this.to = to
        this.n = n
        this.particleData = particleData

        this.points = points
        for(let i = 0; i < n; i++) {
            let p = new Vector3(this.points[i*3], this.points[i*3 + 1], this.points[i*3 + 2])
            let q = p.clone().applyAxisAngle(particleData[i].angle, .001)
            let velocity = new Vector3().subVectors(q, p).setLength(.06)
            particleData[i].velocity = velocity
            particleData[i].endDist = this.to.radius * (Math.random() / 10 + 1.2)
            p.add(from.position)
            this.points[i*3 + 0] = p.x
            this.points[i*3 + 1] = p.y
            this.points[i*3 + 2] = p.z 
        }

        this.geometry = new BufferGeometry()
        this.geometry.setDrawRange(0, n)
        this.geometry.setAttribute('position', new BufferAttribute(this.points, 3).setUsage(DynamicDrawUsage))

        this.material = new PointsMaterial( { size: .3, color: 0x00ff00 })
        this.mesh = new Points(this.geometry, this.material)
        this.n = n
    }

    update() {
        for(let i = 0; i < this.n; i++) {
            let p = new Vector3(this.points[i*3], this.points[i*3 + 1], this.points[i*3 + 2])
            let vel = this.particleData[i].velocity
            p.add(vel)
            let accel = new Vector3().subVectors(this.to.position, p).setLength(.01)
            vel.add(accel).setLength(.06)

            this.points[i*3 + 0] = p.x
            this.points[i*3 + 1] = p.y
            this.points[i*3 + 2] = p.z

            if(p.distanceTo(this.to) <= this.particleData[i].endDist) {
                let rand = new Vector3(Math.random(), Math.random(), Math.random())
                let p3 = new Vector3().crossVectors(rand, new Vector3().subVectors(p, this.to.position))
                let plane = new Plane().setFromCoplanarPoints(p, this.to.position, p3)
                p.sub(this.to.position).setLength(this.to.radius*1.2)
                let newParticleData = { angle: plane.normal.clone(), orbitSpeed: (Math.random() * 0.01) + 0.01, position: p.clone() }
                this.to.fighters.add(1, false, newParticleData)
                
                shiftElementsBack(this.points, i*3, 3, this.points.length)
                shiftElementsBack(this.particleData, i, 1, this.particleData.length)
                this.n--
                this.geometry.setDrawRange(0, this.n)
            }

        }
        this.geometry.attributes.position.needsUpdate = true
    }
}