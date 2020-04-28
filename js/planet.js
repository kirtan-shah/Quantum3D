import { SphereGeometry, MeshLambertMaterial, Mesh, MeshBasicMaterial } from './three/build/three.module.js'
import { BLOOM_LAYER } from './constants.js'

export default class Planet {

    constructor(radius, pos) {
        this.geometry = new SphereGeometry(radius, 64, 64)
        this.selectedMaterial = new MeshLambertMaterial({ color: 0x00ff00, emissive: 0x005700 })
        this.material = new MeshLambertMaterial({ color: 0xE5E5E5 })
        this.mesh = new Mesh(this.geometry, this.material)
        if(pos) this.mesh.position.set(pos.x, pos.y, pos.z)
        this.tl = gsap.timeline()
        this.lines = []
        this.hovered = false
        this.hover = false
        //objectMap[this.mesh.id] = this
    }

    set position(pos) {
        this.mesh.position.set(pos.x, pos.y, pos.z)
    }
    
    get position() {
        return this.mesh.position
    }

    get x() { return this.mesh.position.x }
    get y() { return this.mesh.position.y }
    get z() { return this.mesh.position.z }

    update() {
        if(this.hover && !this.hovered) {
            this.tl.clear()
            this.tl.to(this.mesh.scale, .4, { x: 1.2, y: 1.2, z: 1.2, ease: Expo.easeOut })
            this.hovered = true
        }
        if(!this.hover && this.hovered) {
            this.tl.clear()
            this.tl.to(this.mesh.scale, .4, { x: 1, y: 1, z: 1, ease: Expo.easeOut })
            this.hovered = false
        }
    }

    dispose() {
        this.geometry.dispose()
        this.material.dispose()
    }
}