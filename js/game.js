import { Vector3, Raycaster, Vector2, ShaderMaterial, Layers, PointLight, AmbientLight, Mesh, DoubleSide, MeshBasicMaterial, IcosahedronGeometry, MeshPhongMaterial, DirectionalLight, SphereGeometry } from './three/build/three.module.js'
import { GUI } from './three/examples/jsm/libs/dat.gui.module.js'
import { EffectComposer } from './three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from './three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from './three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from './three/examples/jsm/postprocessing/ShaderPass.js'
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js'
import Planet from './planet.js'
import Sun from './sun.js'
import Stars from './Stars.js'
import { DEFAULT_LAYER, BLOOM_LAYER } from './constants.js'
import { thickLine, shuffleArray } from './utils.js'
import DysonSphere from './DysonSphere.js'

export default class Game {
    constructor(renderer, scene, camera, loader) {
        this.renderer = renderer
        this.scene = scene
        this.camera = camera
        this.loader = loader
        
        this.controls = new OrbitControls(camera, renderer.domElement)
        this.controls.update()
        this.raycaster = new Raycaster()
        this.mouse = new Vector2()

        this.invisibleMaterial = new MeshBasicMaterial({ color: 'black' })

        /******* Load Map *******/
        this.planets = [
            new Planet(3, new Vector3(10, 10, 0)),
            //new Planet(1, new Vector3(-6, 6, 0)),
            //new Planet(1, new Vector3(6, -6, 0)),
            new Planet(3, new Vector3(-10, -10, 0)),
            //new Planet(1, new Vector3(0, 0, 6))
        ]
        this.planets.forEach(p => scene.add(p.mesh))

        //lines
        this.lines = []
        for(let i = 0; i < this.planets.length; i++) {
            for(let j = 0; j < i; j++) {
                let line = thickLine(this.planets[i].position, this.planets[j].position, .15, 0xFFFFFF)
                this.planets[i].lines.push(line)
                this.planets[j].lines.push(line)
                this.lines.push(line)
                scene.add(line)
            }
        }
        /******* End Load Map *******/

        this.sun = new Sun()
        this.sun.position = new Vector3(-40, 0, 0)
        scene.add(this.sun.mesh)

        this.dyson = new DysonSphere(20, new Vector3(-40, 0, 0))
        scene.add(this.dyson.mesh)
        this.dyson.update()

        //this.light = new PointLight(0xffffff, 2, 0)
        //this.light.position.set(-40, 0, 0)
        //scene.add(this.light)

        let lights = []
        /*lights[0] = new PointLight( 0xffffff, 1, 0 );
        lights[1] = new PointLight( 0xffffff, 1, 0 );
        lights[2] = new PointLight( 0xffffff, 1, 0 );*/
        lights[0] = new DirectionalLight(0xffffff, 1, 0)
        lights[1] = new DirectionalLight(0xffffff, 1, 0)
        lights[2] = new DirectionalLight(0xffffff, 1, 0)
        lights[3] = new DirectionalLight(0xffffff, 1, 0)

        lights[0].position.set(0, 200, 0)
        lights[1].position.set(100, 200, 100)
        lights[2].position.set(-100, -200, -100)
        lights[3].position.set(0, -200, 0)

        lights.forEach(l => scene.add(l))

        let ambient = new AmbientLight(0xffffffff, 2)
        scene.add(ambient)  

        this.stars = new Stars(700, 5000)
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
    }

    update() {
        this.controls.update()
        for(let p of this.planets) p.update()
        this.dyson.update()
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
        //event.preventDefault()
        for(let l of this.lines) {
            l.layers.set(DEFAULT_LAYER)
            l.material.color.set(0xFFFFFF)
        }
        for(let p of this.planets) {
            p.mesh.layers.set(DEFAULT_LAYER)
            p.mesh.material = p.material
            if(p.hover) {
                p.mesh.layers.enable(BLOOM_LAYER)
                p.mesh.material = p.selectedMaterial
                for(let l of p.lines) {
                    l.layers.enable(BLOOM_LAYER)
                    l.material.color.set(0x00FF00)
                }
            }
        }

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1
        this.raycaster.setFromCamera(this.mouse, this.camera)

        let intersects = this.raycaster.intersectObject(this.dyson.mesh, true)
        if(intersects.length > 0) this.dyson.click = intersects[0].faceIndex
        else this.dyson.click = -1
    }

    mouseMove(event) {
        event.preventDefault()
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1
        this.raycaster.setFromCamera(this.mouse, this.camera)

        for(let p of this.planets) {
            let intersects = this.raycaster.intersectObject(p.mesh, true)
            p.hover = intersects.length > 0
        }

    }

    resize() {
        this.bloom.setSize(window.innerWidth, window.innerHeight)
        this.combiner.setSize(window.innerWidth, window.innerHeight)
    }
}