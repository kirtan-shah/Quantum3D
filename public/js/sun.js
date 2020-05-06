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

    update() {
        //let t = Date.now()
        //this.mesh.position.set(10*Math.cos(2*Math.PI * t / 60000.0), 10*Math.sin(2*Math.PI * t / 60000.0), 10)
    }

}