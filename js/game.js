import { Vector3, Raycaster, Vector2, ShaderMaterial, Layers, AmbientLight, Mesh, DoubleSide, MeshBasicMaterial, IcosahedronGeometry, MeshPhongMaterial, DirectionalLight, SphereGeometry, MathUtils } from './three/build/three.module.js'
import { GUI } from './three/examples/jsm/libs/dat.gui.module.js'
import { EffectComposer } from './three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from './three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from './three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from './three/examples/jsm/postprocessing/ShaderPass.js'
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js'
import { DragControls } from './three/examples/jsm/controls/DragControls.js'
import Planet from './planet.js'
import Sun from './sun.js'
import Stars from './Stars.js'
import { DEFAULT_LAYER, BLOOM_LAYER } from './constants.js'
import DysonSphere from './DysonSphere.js'
import Road from './Road.js'
import TransactingFighters from './TransactingFighters.js'

export default class Game {
    constructor(renderer, scene, camera, loader) {
        this.renderer = renderer
        this.scene = scene
        this.camera = camera
        this.loader = loader
        
        this.orbitControls = new OrbitControls(camera, renderer.domElement)
        this.orbitControls.update()
        this.draggableObjects = []
        this.raycaster = new Raycaster()
        this.mouse = new Vector2()

        this.invisibleMaterial = new MeshBasicMaterial({ color: 'black' })

        /******* Load Map *******/
        this.planets = [
            new Planet(3, new Vector3(10, 0, 0)),
            //new Planet(1, new Vector3(-6, 6, 0)),
            new Planet(2, new Vector3(10, -10, 0)),
            new Planet(3, new Vector3(-10,  0, 0)),
            //new Planet(1, new Vector3(0, 0, 6))
        ]
        this.planets.forEach(p => scene.add(p.group))
        
        this.planets[0].fighters.add(1024)
        //scene.add(this.fighters.mesh)

        //roads
        this.roads = []
        for(let i = 0; i < this.planets.length; i++) {
            for(let j = 0; j < i; j++) {
                let road = new Road(this.planets[i], this.planets[j])
                this.roads.push(road)
                this.draggableObjects.push(road.arrowMesh)
                scene.add(road.lineMesh, road.arrowMesh)
            }
        }
        /******* End Load Map *******/

        this.sun = new Sun()
        this.sun.position = new Vector3(-40, 0, 0)
        scene.add(this.sun.mesh)

        this.dyson = new DysonSphere(20, new Vector3(-40, 0, 0))
        scene.add(this.dyson.mesh)
        this.dyson.update()
        
        let lights = [
            new DirectionalLight(0xffffff, 2, 0),
            new DirectionalLight(0xffffff, 2, 0),
            new DirectionalLight(0xffffff, 2, 0)
        ]
        lights[0].position.set(0, 1, 0)
        lights[1].position.set(1, 1, 0)
        lights[2].position.set(-1, -1, 0)
        lights.forEach(l => scene.add(l))

        let ambient = new AmbientLight(0xffffffff, 2)
        scene.add(ambient)  

        this.stars = new Stars(800, 5000)
        scene.add(this.stars.mesh)
        
        //bloom effect
        this.params = {
            strength: 1.5,
            threshold: 0,
            radius: 0
        }
        this.initBloom()
        this.bloomLayer = new Layers()
        this.bloomLayer.set(BLOOM_LAYER)
        this.materialCache = {}

        document.getElementById('power-panel').onclick = () => {
            for(let face of this.dyson.geometry.faces) {
                if(face.index == this.dyson.count) {
                    face.bloom = true
                    break
                }
            }
            this.dyson.count++
        }
        document.getElementById('shield-panel').onclick = () => this.dyson.count++

        /*
        let self = this
        let datgui = new GUI()
        datgui.add(this.dyson, 'count', 0, this.dyson.geometry.faces.length).onChange((val) => {
            self.dyson.count = Math.floor(Number(val))
        })
        datgui.add(this.params, 'threshold', 0, 1).onChange(this.initBloom.bind(this))
        datgui.add(this.params, 'strength', 0, 10).onChange(this.initBloom.bind(this))
        datgui.add(this.params, 'radius', 0, 1).onChange(this.initBloom.bind(this))
        */
        this.pendingTransactions = []
        this.dragControls = new DragControls(this.draggableObjects, camera, renderer.domElement)
        this.dragControls.addEventListener('dragstart', () => {
            this.orbitControls.enabled = false
            this.suppressClick = 1
            this.planetTransact = { from: null, to: null, count: 0 }
        })
        this.dragControls.addEventListener('dragend', (e) => {
            this.orbitControls.enabled = true
            e.object.road.reset()
            $('#move-label').hide()
            let { from, to, count } = this.planetTransact
            if(from !== null && to !== null && count !== 0) {
                let { particleData, points } = from.fighters.add(-count)
                let transaction = new TransactingFighters(from, to, count, particleData, points)
                scene.add(transaction.mesh)
                this.pendingTransactions.push(transaction)
            }
            from.deselect()
        })
        this.dragControls.addEventListener('drag', (e) => {
            let planet = e.object.road.which()
            e.object.position.sub(e.object.road.position).projectOnVector(e.object.direction).add(e.object.road.position) //along road line
            if(e.object.position.distanceTo(planet.position) < e.object.road.position.distanceTo(planet.position)) {
                e.object.position.copy(e.object.road.position)
            }

            let n = planet.fighters.n
            let ratio = new Vector3().subVectors(e.object.position, e.object.road.position).length() 
                / (e.object.direction.length() * .45 - e.object.road.other(planet).radius)
            let number = MathUtils.clamp(Math.round(ratio*n), 0, n)

            let coords = e.object.position.clone().project(this.camera)
            coords.x = (coords.x * window.innerWidth/2) + window.innerWidth/2
            coords.y = - (coords.y * window.innerHeight/2) + window.innerHeight/2
            $('#move-label').text(`${number}/${n}`)
            $('#move-label').css({ left: coords.x - $('#move-label').width()/2, top: coords.y - 60 })
            $('#move-label').show()
            this.planetTransact = { from: planet, to: e.object.road.other(planet), count: number }
        })
    }

    update() {
        this.orbitControls.update()
        for(let p of this.planets) p.update()
        this.dyson.update()
        let keepTransactions = []
        for(let fighters of this.pendingTransactions) {
            fighters.update()
            if(fighters.n !== 0) keepTransactions.push(fighters)
        }
        this.pendingTransactions = keepTransactions
    }

    draw() {
        this.renderer.setClearColor(0x000000)
        this.scene.traverse(this.darkenMaterials.bind(this))
        this.bloom.render()
        this.scene.traverse(this.restoreMaterials.bind(this))
        this.combiner.render()
    }

    darkenMaterials(obj) {
        if(obj.isMesh && this.bloomLayer.test(obj.layers) === false && obj != this.dyson.mesh) {
            this.materialCache[obj.uuid] = obj.material
            obj.material = this.invisibleMaterial
        }
        if(obj == this.dyson.mesh) {
            this.dyson.darken()
        }
    }
    restoreMaterials(obj) {
        if(this.materialCache[obj.uuid]) {
            obj.material = this.materialCache[obj.uuid]
            delete this.materialCache[obj.uuid]
        }
        if(obj == this.dyson.mesh) {
            this.dyson.restore()
        }
    }

    initBloom() {        
        let bloom = new EffectComposer(this.renderer)
        bloom.setSize(window.innerWidth, window.innerHeight)
        bloom.renderToScreen = false
        
        let renderScene = new RenderPass(this.scene, this.camera)
        let bloomPass = new UnrealBloomPass(new Vector2(window.innerHeight, window.innerHeight), 1.5, .4, .85)
        bloomPass.strength = this.params.strength
        bloomPass.threshold = this.params.threshold
        bloomPass.radius = this.params.radius
        bloom.addPass(renderScene)
        bloom.addPass(bloomPass)

        let combiner = new EffectComposer(this.renderer)
        combiner.setSize(window.innerWidth, window.innerHeight)
        var finalPass = new ShaderPass(
            new ShaderMaterial( {
                uniforms: {
                    tex1: { value: null },
                    tex2: { value: bloom.renderTarget2.texture }
                },
                vertexShader: this.loader.getData('../shader/add.vert'),
                fragmentShader: this.loader.getData('../shader/add.frag'),
                defines: {}
            } ), 'tex1'
        )
        combiner.addPass(renderScene)
        combiner.addPass(finalPass)

        this.bloom = bloom
        this.combiner = combiner
    }

    click(event) {
        if(this.suppressClick == 1) {
            this.suppressClick = 0
            return
        }
        //event.preventDefault()
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1
        this.raycaster.setFromCamera(this.mouse, this.camera)

        for(let p of this.planets) {
            let intersects = this.raycaster.intersectObject(p.mesh, false)
            if(intersects.length > 0) p.select()
            else p.deselect()
        }

        let intersects = this.raycaster.intersectObject(this.dyson.mesh, true)
        if(intersects.length > 0) this.dyson.click = intersects[0].faceIndex
        else this.dyson.click = -1
    }

    mouseMove(event) {
        //event.preventDefault()
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1
        this.raycaster.setFromCamera(this.mouse, this.camera)

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

    resize() {
        this.bloom.setSize(window.innerWidth, window.innerHeight)
        this.combiner.setSize(window.innerWidth, window.innerHeight)
    }
}