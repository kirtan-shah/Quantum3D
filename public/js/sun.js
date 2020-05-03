import Planet from './planet.js'
import { Vector3, SphereGeometry, MeshLambertMaterial, MeshBasicMaterial, Mesh } from './three/build/three.module.js'
import { BLOOM_LAYER } from './constants.js'

export default class Sun {
    constructor() {
        this.geometry = new SphereGeometry(4, 32, 32)
        this.material = new MeshLambertMaterial({ color: 0xFF7F00, emissive: 0xFF9c70 })
        this.mesh = new Mesh(this.geometry, this.material)
        this.mesh.layers.enable(BLOOM_LAYER)
        this.tl = gsap.timeline()
        this.hovered = false
        this.hover = false
    }

    set position(v) {
        this.mesh.position.set(v.x, v.y, v.z)
    }

    get position() { return this.mesh.position }
    get x() { return this.mesh.position.x }
    get y() { return this.mesh.position.y }
    get z() { return this.mesh.position.z }

    update() {
        //let t = Date.now()
        //this.mesh.position.set(10*Math.cos(2*Math.PI * t / 60000.0), 10*Math.sin(2*Math.PI * t / 60000.0), 10)
    }

}