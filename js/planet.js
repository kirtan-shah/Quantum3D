import { SphereGeometry, MeshLambertMaterial, MeshPhysicalMaterial, Mesh, Group } from './three/build/three.module.js'
import Fighters from './Fighters.js'
import { BLOOM_LAYER } from './constants.js'
import { getCoords } from './utils.js'

export default class Planet {

    constructor(radius, pos) {
        this.radius = radius
        this.geometry = new SphereGeometry(radius, 64, 64)
        this.selectedMaterial = new MeshLambertMaterial({ color: 0x111111, emissive: 0x222222 })
        this.material = new MeshLambertMaterial({ color: 0xE5E5E5 })
        this.mesh = new Mesh(this.geometry, this.material)
        this.group = new Group()
        this.group.add(this.mesh)
        if(pos) this.group.position.set(pos.x, pos.y, pos.z)
        this.fighters = new Fighters(this, 0)

        this.tl = gsap.timeline()
        this.roads = []
        this.hovered = false
        this.hover = false
        this.selected = false
    }

    set position(pos) {
        this.group.position.set(pos.x, pos.y, pos.z)
    }
    
    get position() {
        return this.group.position
    }

    get x() { return this.group.position.x }
    get y() { return this.group.position.y }
    get z() { return this.group.position.z }

    update(dt) {
        if(this.hover && !this.hovered) {
            this.tl.clear()
            this.tl.to(this.group.scale, .4, { x: 1.2, y: 1.2, z: 1.2, ease: Expo.easeOut })
            this.hovered = true
        }
        if(!this.hover && this.hovered && !this.selected) {
            this.tl.clear()
            this.tl.to(this.group.scale, .4, { x: 1, y: 1, z: 1, ease: Expo.easeOut })
            this.hovered = false
        }
        this.fighters.update(dt)
    }

    showLabel() {
        $('#planet-label').text(`Fighters: ${this.fighters.n}`)
        $('#planet-label').show()
    }
    static hideLabel() {
        $('#planet-label').fadeOut(200)
    }

    select() {
        this.mesh.layers.enable(BLOOM_LAYER)
        this.mesh.material = this.selectedMaterial
        for(let r of this.roads) {
            r.select(this)
        }
        this.selected = true
    }

    deselect() {
        this.mesh.layers.disable(BLOOM_LAYER)
        this.mesh.material = this.material
        for(let r of this.roads) {
            if(!r.other(this).selected) {
                r.deselect()
            }
        }
        this.selected = false
    }

    dispose() {
        this.geometry.dispose()
        this.material.dispose()
    }
}