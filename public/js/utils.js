import { Vector3, ArrowHelper, CylinderGeometry, MeshBasicMaterial, Mesh, Euler } from './three/build/three.module.js'

function thickLine(pointX, pointY, thickness, color) {
    // edge from X to Y
    let direction = new Vector3().subVectors(pointY, pointX)
    let arrow = new ArrowHelper(direction.clone().normalize(), pointX)
    let rotation = new Euler().setFromQuaternion(arrow.quaternion)

    // cylinder: radiusAtTop, radiusAtBottom, 
    //     height, radiusSegments, heightSegments
    let geometry = new CylinderGeometry(thickness, thickness, direction.length(), 32, 100)
    let material = new MeshBasicMaterial( { color } )

    let mesh = new Mesh(geometry, material);

    mesh.setRotationFromEuler(rotation.clone())
    //let mid = new Vector3().addVectors(pointX, direction.multiplyScalar(0.5));
    //mesh.position.set(mid.x, mid.y, mid.z)
    return mesh
}

function rotationFromPoints(pointX, pointY) {
    let direction = new Vector3().subVectors(pointY, pointX)
    let arrow = new ArrowHelper(direction.clone().normalize(), pointX)
    let rotation = new Euler().setFromQuaternion(arrow.quaternion)
    return rotation
}

function getCoords(pos, camera) {
    let coords = pos.clone().project(camera)
    coords.x = (coords.x * window.innerWidth/2) + window.innerWidth/2
    coords.y = - (coords.y * window.innerHeight/2) + window.innerHeight/2
    return coords
}

function shuffleArray(array) {
	let currentIndex = array.length
	let temporaryValue, randomIndex

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex)
		currentIndex -= 1

		// And swap it with the current element.
		temporaryValue = array[currentIndex]
		array[currentIndex] = array[randomIndex]
		array[randomIndex] = temporaryValue
    }
	return array
}

var prng
var cache
var usingCache = false
var cacheIndex = 0
function initCache(n, seed) {
    cache = new Array(n)
    prng = new Math.seedrandom(seed)
    for(let i = 0; i < n; i++) cahce[i] = prng.quick()
}

function useCache() {
    usingCache = true
}
function setSeed(seed) {
    prng = new Math.seedrandom(seed)
}
function random() {
    if(!prng) return Math.random()
    if(usingCache) {
        let val = cache[cacheIndex]
        cacheIndex++
        if(cacheIndex >= cache.length) cacheIndex = 0
        return val;
    }
    if(!prng) prng = new Math.seedrandom()
    return prng.quick()
}
function randomGaussian() {
    var u = 0, v = 0
    while(u === 0) u = random() //Converting [0,1) to (0,1)
    while(v === 0) v = random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

function shiftElementsBack(arr, i, n, end) {
    for(let j = i; j < end - 1; j++) {
        arr[j] = arr[j + n]
    }
}

export { thickLine, rotationFromPoints, shuffleArray, setSeed, random, randomGaussian, shiftElementsBack, getCoords, initCache, useCache }