import { Vector3 } from './three/build/three.module.js'
import Planet from './planet.js'
import Sun from './sun.js'
import DysonSphere from './DysonSphere.js'
import Road from './Road.js'

export default class Player {

    constructor(game) {
        this.game = game
        this.planets = [
            new Planet(3, new Vector3(10, 0, 0)),
            new Planet(2, new Vector3(10, -10, 0)),
            new Planet(3, new Vector3(-10,  0, 0))
        ]
        this.planets.forEach(p => game.scene.add(p.group))
        this.planets[0].fighters.add(1024)

        this.roads = []
        for(let i = 0; i < this.planets.length; i++) {
            for(let j = 0; j < i; j++) {
                let road = new Road(this.planets[i], this.planets[j])
                this.roads.push(road)
                this.game.draggableObjects.push(road.arrowMesh)
                game.scene.add(road.group)
            }
        }

        this.sun = new Sun()
        this.sun.position = new Vector3(-40, 0, 0)
        game.scene.add(this.sun.mesh)

        this.dyson = new DysonSphere(20, new Vector3(-40, 0, 0))
        game.scene.add(this.dyson.mesh)
        this.dyson.update()
        

    }

    update(dt) {
        for(let p of this.planets) p.update(dt)
        this.dyson.update()
    }

    addPowerPanel() {
        for(let face of this.dyson.geometry.faces) {
            if(face.index == this.dyson.count) {
                face.bloom = true
                break
            }
        }
        this.dyson.count++
    }
    addShieldPanel() {
        this.dyson.count++
    }

    mouseMove(event) { 
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1
        this.raycaster.setFromCamera(this.mouse, this.game.camera)

        for(let p of this.planets) {
            let intersects = this.raycaster.intersectObject(p.mesh, false)
            p.hover = intersects.length > 0
        }
        for(let r of this.roads) {
            r.material = r.arrowMaterial.color.set(0x7FFF7F)
            if(r.selected) {
                r.arrowMesh.layers.disable(BLOOM_LAYER)
                let intersects = this.raycaster.intersectObject(r.arrowMesh, false)
                if(intersects.length > 0) {
                    r.material = r.arrowMaterial.color.set(0xFFFFFF)
                    r.arrowMesh.layers.enable(BLOOM_LAYER)
                }
            }
        }
    }

    click(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1
        this.raycaster.setFromCamera(this.mouse, this.game.camera)

        for(let p of this.planets) {
            let intersects = this.raycaster.intersectObject(p.mesh, false)
            if(intersects.length > 0) p.select()
            else p.deselect()
        }

        let intersects = this.raycaster.intersectObject(this.dyson.mesh, true)
        if(intersects.length > 0) this.dyson.click = intersects[0].faceIndex
        else this.dyson.click = -1
    }
}