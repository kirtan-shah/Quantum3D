import { Euler, Mesh, MeshPhongMaterial, CylinderBufferGeometry, MeshBasicMaterial, Vector3 } from './three/build/three.module.js'
import { thickLine } from './utils.js'
import { BLOOM_LAYER } from './constants.js'

export default class Road {
    constructor(p1, p2) {
        this.p1 = p1
        this.p2 = p2

        this.lineMesh = thickLine(p1.position, p2.position, .15, 0xFFFFFF)
        p1.roads.push(this)
        p2.roads.push(this)

        this.arrowGeometry = new CylinderBufferGeometry(.2, .5, 1.5, 8, 2)
        this.transparentMaterial = new MeshBasicMaterial({ transparent: true, opacity: 0 })
        this.arrowMaterial = new MeshPhongMaterial({ color: 0xFFFFFF, specular: 0x333333, shininess: 30, flatShading: true })
        this.arrowMesh = new Mesh(this.arrowGeometry, this.transparentMaterial)
        this.arrowMesh.setRotationFromEuler(this.lineMesh.rotation.clone())
        this.arrowMesh.direction = new Vector3().subVectors(p2.position, p1.position)
        this.arrowMesh.road = this

        this.selected = false
    }

    select(planet) {
        this.lineMesh.layers.enable(BLOOM_LAYER)
        this.lineMesh.material.color.set(0x00FF00)
        this.arrowMesh.layers.disable(BLOOM_LAYER)
        this.arrowMesh.material = this.arrowMaterial

        let rot = this.lineMesh.rotation.clone().toVector3()
        if(planet == this.p2) this.arrowMesh.setRotationFromEuler(new Euler().setFromVector3(rot.negate()))
        else this.arrowMesh.setRotationFromEuler(new Euler().setFromVector3(rot))

        this.selected = true
    }

    deselect() {
        this.lineMesh.layers.disable(BLOOM_LAYER)
        this.lineMesh.material.color.set(0xFFFFFF)
        this.arrowMesh.layers.enable(BLOOM_LAYER)
        this.arrowMesh.material = this.transparentMaterial
        
        this.selected = false
    }

    other(planet) {
        if(planet == this.p1) return this.p2
        if(planet == this.p2) return this.p1
        return null
    }

    which() {
        if(this.p1.selected) return this.p1
        if(this.p2.selected) return this.p2
        return null
    }

    get position() {
        return this.lineMesh.position
    }
}