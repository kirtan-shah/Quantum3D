import { Vector3, PointLight, Group } from './three/build/three.module.js'
import Planet from './Planet.js'
import Sun from './Sun.js'
import { DysonSphere, DysonMesh } from './DysonSphere.js'
import Road from './Road.js'
import { DEFAULT_LAYER, BLOOM_LAYER } from './constants.js'

export default class Player {

    constructor(game, playerData) {
        this.game = game
        
        this.system = new Group()
        this.system.position.copy(playerData.position)
        this.planets = {}
        for(let key in playerData.planets) {
            let planetData = playerData.planets[key]
            planetData.seed = playerData.seed + planetData.id
            this.planets[key] = new Planet(planetData)
            this.system.add(this.planets[key].group)
        }

        this.dyson = new DysonSphere(50, new Vector3())
        this.system.add(this.dyson.group)
        game.scene.add(this.system)

        this.roads = []
        /*
        for(let i = 0; i < this.planets.length; i++) {
            for(let j = 0; j < i; j++) {
                let road = new Road(this.planets[i], this.planets[j])
                this.roads.push(road)
                this.game.draggableObjects.push(road.arrowMesh)
                game.scene.add(road.group)
            }
        }*/
        this.powerPanels = 0
        this.shieldPanels = 0
        this.energy = 10000
        this.updatePowerPanelCost()
        this.updateShieldPanelCost()
    }

    update(data, dt) {
        for(let planetData of Object.values(data.planets)) {
            planetData.seed = data.seed
            let planet = this.planets[planetData.id]
            planet.update(planetData, dt)
            planet.group.position.applyAxisAngle(new Vector3(0, 1, 0), planet.orbitSpeed)
        }
        this.dyson.update(dt)   
        
        this.energy += this.powerPanels * 1 * dt
        this.shield = this.powerPanels * 10 + this.shieldPanels * 100
        $('#energy').html(~~this.energy)
        $('#shield').html(~~this.shield)
    }

    powerPanelCost() {
        return ~~(10*Math.pow(1.07, this.powerPanels))
    }
    updatePowerPanelCost() {
        $('#power-panel').html(`Power Panel <icon>⚡</icon>${this.powerPanelCost()}`)
        this.checkFilled()
    }
    shieldPanelCost() {
        return ~~(5*Math.pow(1.06, this.shieldPanels))
    }
    updateShieldPanelCost() {
        $('#shield-panel').html(`Shield Panel <icon>⚡</icon>${this.shieldPanelCost()}`)
        this.checkFilled()
    }
    checkFilled() {
        if(this.shieldPanels + this.powerPanels >= 80) {
            $('#power-panel').addClass('disabled')
            $('#shield-panel').addClass('disabled')
        }
    }

    addPowerPanel() {
        if(this.energy < this.powerPanelCost() || this.shieldPanels + this.powerPanels >= 80) return
        this.energy -= this.powerPanelCost()
        for(let face of this.dyson.geometry.faces) {
            if(face.index == this.dyson.count) {
                face.bloom = true
                break
            }
        }
        this.dyson.count++
        this.powerPanels++
        this.updatePowerPanelCost()
    }
    addShieldPanel() {
        if(this.energy < this.shieldPanelCost() || this.shieldPanels + this.powerPanels >= 80) return
        this.energy -= this.shieldPanelCost()
        this.dyson.count++
        this.shieldPanels++
        this.energy -= 10
        this.updateShieldPanelCost()
    }

    mouseMove(raycaster) { 
        let oneHovered = false
        for(let p of Object.values(this.planets)) {
            let intersects = raycaster.intersectObject(p.mesh, false)
            p.hover = intersects.length > 0
            if(p.hover || p.selected) {
                p.showLabel(this.game.camera)
                oneHovered = true
            }
        }
        if(!oneHovered) Planet.hideLabel()

        for(let r of this.roads) {
            r.material = r.arrowMaterial.color.set(0x7FFF7F)
            if(r.selected) {
                r.arrowMesh.layers.disable(BLOOM_LAYER)
                let intersects = raycaster.intersectObject(r.arrowMesh, false)
                if(intersects.length > 0) {
                    r.material = r.arrowMaterial.color.set(0xFFFFFF)
                    r.arrowMesh.layers.enable(BLOOM_LAYER)
                }
            }
        }
    }

    click(raycaster) {
        for(let p of Object.values(this.planets)) {
            let intersects = raycaster.intersectObject(p.mesh, false)
            if(intersects.length > 0) p.select()
            else p.deselect()
        }

        let intersects = raycaster.intersectObject(this.dyson.mesh, true)
        if(intersects.length > 0) this.dyson.click = intersects[0].faceIndex
        else this.dyson.click = -1
    }
}