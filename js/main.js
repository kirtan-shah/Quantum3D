import * as THREE from './three/build/three.module.js'
import Stats from './three/examples/jsm/libs/stats.module.js'
import Game from './game.js'
import AssetLoader from './AssetLoader.js'
import { Spinner } from './lib/spin.js'
import { spinnerOptions } from './constants.js'

/* let target = document.getElementById('loading-screen')
new Spinner(spinnerOptions).spin(target)
setTimeout(() => {
    $('#loading-screen').fadeOut(1000)
    $('#loading-screen *').fadeOut(500)
}, 2000)*/

let canvas = document.createElement('canvas')
let context = canvas.getContext('webgl2', { alpha: true })
let renderer = new THREE.WebGLRenderer({ canvas: canvas, context: context, antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
//renderer.outputEncoding = THREE.GammaEncoding
//renderer.gammaFactor = 2.2
renderer.toneMappingExposure = Math.pow( 1.0 , 4.0 ) 
renderer.toneMapping = THREE.ReinhardToneMapping //used for emulating HDR
document.body.appendChild(renderer.domElement)

let stats = new Stats()
document.body.appendChild(stats.dom)

let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000)
camera.position.z = 60

let gameState = null
let loader = new AssetLoader()
loader.add('../shader/add.vert', 'file')
loader.add('../shader/add.frag', 'file')
loader.load(() => {
    gameState = new Game(renderer, scene, camera, loader)
    requestAnimationFrame(render)
    clock.start()
})

let clock = new THREE.Clock()

function update(dt) {
    stats.update()
    if(gameState) gameState.update(dt)
}
function render() {
    update(clock.getDelta())
    requestAnimationFrame(render)
    gameState.draw()
}

window.addEventListener('resize', () => {
    let width = window.innerWidth
    let height = window.innerHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
    if(gameState) gameState.resize()
})

window.addEventListener('mousemove', (event) => { gameState.mouseMove(event) })
window.addEventListener('touchstart', (event) => { console.log(event);gameState.mouseMove(event.touches[0]);gameState.click(event.touches[0]) })

function onClick(event) { gameState.click(event) }
//window.addEventListener('touchend', (event) => { gameState.mouseMove(event.touches[0]);gameState.click(event.touches[0]) })
window.addEventListener('click', onClick)