import Planet from './Planet.js'
import { Vector3, SphereGeometry, MeshLambertMaterial, MeshBasicMaterial, Mesh, TextureLoader } from './three/build/three.module.js'
import { BLOOM_LAYER } from './constants.js'

export default class Sun {
    constructor() {
        this.geometry = new SphereGeometry(4, 32, 32)
        this.material = new MeshBasicMaterial({ map: new TextureLoader().load('/img/2k_sun.jpg') })// new MeshLambertMaterial({ color: 0xFF7F00, emissive: 0xFF9c70 })
        this.mesh = new Mesh(this.geometry, this.material)
        this.mesh.layers.enable(BLOOM_LAYER)
        this.tl = gsap.timeline()
        this.hovered = false
        this.hover = false
    }

    get position() { return this.mesh.position }

    update(dt) {
        // this.mesh.rotation.x += .05 * dt
        // this.mesh.rotation.y += .15 * dt
    }

}