import { Vector3, Raycaster, Vector2, ShaderMaterial, Layers, AmbientLight, DoubleSide, MeshBasicMaterial, DirectionalLight, MathUtils } from './three/build/three.module.js'
import { GUI } from './three/examples/jsm/libs/dat.gui.module.js'
import { EffectComposer } from './three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from './three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from './three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from './three/examples/jsm/postprocessing/ShaderPass.js'
import { TrackballControls } from './three/examples/jsm/controls/TrackballControls.js'
import { DragControls } from './three/examples/jsm/controls/DragControls.js'
import Stars from './Stars.js'
import Player from './Player.js'
import { DysonMesh } from './DysonSphere.js'
import { BLOOM_LAYER } from './constants.js'
import TransactingFighters from './TransactingFighters.js'
import { getCoords } from './utils.js'
import Planet from './Planet.js'

export default class Game {
    constructor(controller, renderer, scene, camera, loader) {
        Object.assign(this, {
            controller, renderer, scene, camera, loader,
            raycaster: new Raycaster(),
            mouse: new Vector2(),
            draggableObjects: [],
            trackballControls: new TrackballControls(camera, renderer.domElement),
            invisibleMaterial: new MeshBasicMaterial({ color: 'black' })
        })
        this.initObjects()

        this.stars = new Stars(1500, 3000)
        scene.add(this.stars.mesh)
    
        this.trackballControls.panSpeed = .5
        this.trackballControls.rotateSpeed = 3
        this.trackballControls.maxDistance = this.stars.r - 10
        this.trackballControls.update()

        let lights = [
            new DirectionalLight(0xffffff, 2, 0),
            new DirectionalLight(0xffffff, 2, 0),
            new DirectionalLight(0xffffff, 2, 0),
            new AmbientLight(0xffffff, 2)
        ]
        lights[0].position.set(0, 1, 0)
        lights[1].position.set(1, 1, 0)
        lights[2].position.set(-1, -1, 0)
        lights.forEach(l => scene.add(l))
        
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

        $('#power-panel').click(() => this.me.addPowerPanel())
        $('#shield-panel').click(() => this.me.addShieldPanel())

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
            this.trackballControls.enabled = false
            this.suppressClick = 1
            this.planetTransact = { from: null, to: null, count: 0 }
        })
        this.dragControls.addEventListener('dragend', (e) => {
            this.trackballControls.enabled = true
            e.object.road.reset()
            $('#move-label').hide()
            let { from, to, count } = this.planetTransact
            if(from !== null && to !== null && count !== 0) {
                new Audio("/sounds/move.wav").play()
                let { particleData, points } = from.fighters.add(-count)
                let transaction = new TransactingFighters(from, to, count, particleData, points)
                scene.add(transaction.mesh)
                this.pendingTransactions.push(transaction)
                from.deselect()
            }
        })
        this.dragControls.addEventListener('drag', (e) => {
            let road = e.object.road
            let from = road.which()
            let to = road.other(from)
            let arrow = e.object
            let arrowPos = arrow.position
            arrowPos.projectOnVector(arrow.direction) //along road line
            if(arrowPos.distanceTo(from.position) < road.initPos.distanceTo(from.position)) {
                road.reset()
            }
            let n = from.fighters.n
            let ratio = new Vector3().subVectors(arrowPos, road.initPos).length() 
                / (arrow.direction.length() * .45 - to.radius)
            let number = MathUtils.clamp(Math.round(ratio*n), 0, n)

            let coords = getCoords(arrowPos, this.camera)
            $('#move-label').text(`${number}/${n}`)
            $('#move-label').css({ left: coords.x - $('#move-label').width()/2, top: coords.y - 60 })
            $('#move-label').show()
            this.planetTransact = { from, to, count: number }
        })

        let myAudio = new Audio("/sounds/bgsound.mp3")
        myAudio.addEventListener('ended', function() {
            this.currentTime = 0
            this.play()
        }, false)
        myAudio.play()
    }

    initObjects() {
        let gameObject = this.controller.gameObject
        this.players = {}
        for(let playerData of gameObject.players) {
            //let planets = player.planets.map(p => new Planet(p.radius, p.position))
            playerData.seed = gameObject.baseSeed
            let player = new Player(this, playerData)
            if(playerData.name === this.controller.name) this.me = player
            else this.players[playerData.name] = player
        }
        this.planets = {}
        for(let planetData of Object.values(gameObject.planets)) {
            planetData.seed = gameObject.baseSeed + planetData.id * 100000
            let planet = new Planet(planetData)
            this.planets[planet.id] = planet
            this.scene.add(this.planets[planet.id].group)
        }
    }

    update(keys, dt) {
        //dt = dt / this.controller.queue.length
        for(let i = 0; i < this.controller.queue.length; i++) {
            dt = this.controller.dt
            let gameObject = this.controller.queue.shift()
            for(let playerData of gameObject.players) {
                playerData.seed = gameObject.baseSeed
                if(playerData.name === this.controller.name) this.me.update(playerData, dt)
                else this.players[playerData.name].update(playerData, dt)
            }

            let direction = this.camera.getWorldDirection(new Vector3())
            if(keys[69]) this.camera.up.applyAxisAngle(direction, -3 * dt)
            if(keys[81]) this.camera.up.applyAxisAngle(direction, 3 * dt)
            this.trackballControls.update()
            
            this.bloomPass.strength = 1.5 + 0.1*Math.sin(2*Math.PI * Date.now() / 4000)

            let keepTransactions = []
            for(let fighters of this.pendingTransactions) {
                fighters.update(dt)
                if(fighters.n !== 0) keepTransactions.push(fighters)
            }
            this.pendingTransactions = keepTransactions
        }
    }

    draw() {
        this.renderer.setClearColor(0x000000)
        this.scene.traverse(this.darkenMaterials.bind(this))
        this.bloom.render()
        this.scene.traverse(this.restoreMaterials.bind(this))
        this.combiner.render()
    }

    darkenMaterials(obj) {
        if(obj.isMesh && this.bloomLayer.test(obj.layers) === false && !(obj instanceof DysonMesh)) {
            this.materialCache[obj.uuid] = obj.material
            obj.material = this.invisibleMaterial
        }
        if(obj instanceof DysonMesh) {
            obj.dyson.darken()
        }
    }
    restoreMaterials(obj) {
        if(this.materialCache[obj.uuid]) {
            obj.material = this.materialCache[obj.uuid]
            delete this.materialCache[obj.uuid]
        }
        if(obj instanceof DysonMesh) {
            obj.dyson.restore()
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
        this.bloomPass = bloomPass
    }

    setRaycaster(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1
        this.raycaster.setFromCamera(this.mouse, this.camera)
    }

    click(event) {
        if(this.suppressClick == 1) {
            this.suppressClick = 0
            return
        }
        this.setRaycaster(event)
        this.me.click(this.raycaster)
    }

    mouseMove(event) {
        this.setRaycaster(event)
        this.me.mouseMove(this.raycaster)
    }

    resize() {
        this.bloom.setSize(window.innerWidth, window.innerHeight)
        this.combiner.setSize(window.innerWidth, window.innerHeight)
    }
}