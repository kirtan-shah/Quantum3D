import * as THREE from './three/build/three.module.js'
import Stats from './three/examples/jsm/libs/stats.module.js'
import NetworkController from './NetworkController.js'
import Game from './Game.js'
import EmptyGame from './EmptyGame.js'
import AssetLoader from './AssetLoader.js'
import { Spinner } from './lib/spin.js'
import { spinnerOptions } from './constants.js'

let target = document.getElementById('loading-screen')
new Spinner(spinnerOptions).spin(target)
function stopSpinner() {
    $('#loading-screen').fadeOut(1000)
    $('#loading-screen *').fadeOut(500)
}

let canvas = document.createElement('canvas')
let context = canvas.getContext('webgl2', { alpha: true })
let renderer = new THREE.WebGLRenderer({ canvas: canvas, context: context, antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMappingExposure = Math.pow( 1.0 , 4.0 ) 
renderer.toneMapping = THREE.ReinhardToneMapping //used for emulating HDR
document.body.appendChild(renderer.domElement)

let stats = new Stats()
document.body.appendChild(stats.dom)

let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000)
camera.position.z = 60

let game = new EmptyGame()
let controller
let loader = new AssetLoader()
loader.add('../shader/add.vert', 'file')
loader.add('../shader/add.frag', 'file')
loader.add('/img/8k_stars_milky_way.jpg', 'image')
loader.add('/img/2k_sun.jpg', 'image')
loader.load(() => {
    stopSpinner()
    controller = new NetworkController('http://localhost:971', () => {
        game = new Game(controller, renderer, scene, camera, loader)
        requestAnimationFrame(render)
        clock.start()
    })
})
let keys = new Array(256).fill(false)

let clock = new THREE.Clock()
function update(dt) {
    stats.update()
    if(game) game.update(keys, dt)
}
function render() {
    update(clock.getDelta())
    requestAnimationFrame(render)
    game.draw()
}

window.addEventListener('resize', () => {
    let width = window.innerWidth
    let height = window.innerHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
    if(game) game.resize()
})

window.addEventListener('mousemove', (event) => { game.mouseMove(event) })
window.addEventListener('touchstart', (event) => { game.mouseMove(event.touches[0]);game.click(event.touches[0]) })
function onClick(event) { game.click(event) }
window.addEventListener('click', onClick)
window.addEventListener('keydown', (event) => keys[event.keyCode] = true)
window.addEventListener('keyup', (event) => keys[event.keyCode] = false)

$('#nickname, #room-code-input').on('keyup', (event) => {
    if(event.keyCode === 13) {
        event.preventDefault()
        $('#enter').click()
    }
});

$(document).ready(() => {
    $('.page').hide()
    $('#container').show()
    history.pushState({page: 'container'}, 'mainmenu')
})
window.onpopstate = (event) => {
    $('.page').fadeOut(200)
    $('#' + event.state.page).show()
}
$('#enter').click(() => {
    $('.page').hide()
    if(history.state.creator) {
        controller.createRoom()
        $('#start-game').fadeIn(200)
    }
    else {
        $('#start-game').hide()
        controller.joinRoom($('#room-code-input').val().toUpperCase())
    }
    $('#join-room-content').fadeIn(200)
})
$('#join-room').click(() => {
    history.pushState({page: 'join-room-content', creator: false}, 'join-room')
    $('.page').hide()
    $('#room-code-input-group').fadeIn(200)
    $('#enter-nickname-content').fadeIn(200, () => $('#nickname').focus())
    //$('#join-room-content').show()
})
$('#create-room').click(() => {
    history.pushState({page: 'join-room-content', creator: true}, 'create-room')
    $('.page').hide()
    $('#room-code-input-group').hide()
    $('#enter-nickname-content').fadeIn(200, () => $('#nickname').focus())
    //$('#create-room-content').show()
})
$('#start-game').click(() => controller.startGame())