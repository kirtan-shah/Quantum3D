import { Vector3, Raycaster, Vector2, ShaderMaterial, Layers, AmbientLight, PointLight, DoubleSide, MeshBasicMaterial, IcosahedronGeometry, MeshPhongMaterial, DirectionalLight, SphereGeometry, MathUtils } from './three/build/three.module.js'
import { GUI } from './three/examples/jsm/libs/dat.gui.module.js'
import { EffectComposer } from './three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from './three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from './three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from './three/examples/jsm/postprocessing/ShaderPass.js'
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js'
import { DragControls } from './three/examples/jsm/controls/DragControls.js'
import Stars from './Stars.js'
import Player from './Player.js'
import { DysonMesh } from './DysonSphere.js'
import { DEFAULT_LAYER, BLOOM_LAYER } from './constants.js'
import TransactingFighters from './TransactingFighters.js'
import { getCoords } from './utils.js'

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

        this.player = new Player(this)

        let lights = [
            new DirectionalLight(0xffffff, 1),
            //new PointLight(0xffffff, 2, 0, 0),
            //new PointLight(0xffffff, 2, 0, 0)
        ]
        lights[0].position.set(-1, 1, 1).normalize()
        //lights[1].position.set(1000, 1000, 0)
        //lights[2].position.set(-1000, -1000, 0)
        lights.forEach(l => scene.add(l))

        let ambient = new AmbientLight(0x333333)
        scene.add(ambient)  

        let sunlight = new PointLight(0xffffff, 5)
        sunlight.position.set(-200, 0, 0)
        scene.add(sunlight)
        this.stars = new Stars(800, 5000)
        //this.stars.mesh.add(sunlight)
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

        document.getElementById('power-panel').onclick = () => this.player.addPowerPanel()
        document.getElementById('shield-panel').onclick = () => this.player.addShieldPanel()

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
    }

    update(dt) {
        this.orbitControls.update()
        this.player.update(dt)
        this.bloomPass.strength = 1.5 + 0.1*Math.sin(2*Math.PI * Date.now() / 4000)
        
        let keepTransactions = []
        for(let fighters of this.pendingTransactions) {
            fighters.update(dt)
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

    click(event) {
        if(this.suppressClick == 1) {
            this.suppressClick = 0
            return
        }
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.player.click(this.raycaster)
    }

    mouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1
        this.raycaster.setFromCamera(this.mouse, this.camera)

        this.player.mouseMove(this.raycaster)
    }

    resize() {
        this.bloom.setSize(window.innerWidth, window.innerHeight)
        this.combiner.setSize(window.innerWidth, window.innerHeight)
    }
}