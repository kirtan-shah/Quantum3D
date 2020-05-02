import { TextureLoader, PointsMaterial, BufferGeometry, Vector3, Plane, Mesh, Points, BufferAttribute, DynamicDrawUsage, Group } from './three/build/three.module.js';

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
        this.logic.stepOrbit(dt)
        this.geometry.attributes.position.needsUpdate = true
    }

    add(n, auto=true, newParticleData) {
        let data = this.logic.add(n, auto, newParticleData)
        this.geometry.setDrawRange(0, this.logic.n)
        this.geometry.computeBoundingSphere()
        this.geometry.attributes.position.needsUpdate = true    
    }
}