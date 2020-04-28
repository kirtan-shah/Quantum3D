import { Vector3, ArrowHelper, CylinderGeometry, MeshBasicMaterial, Mesh, Euler } from './three/build/three.module.js'

function thickLine(pointX, pointY, thickness, color) {
    // edge from X to Y
    var direction = new Vector3().subVectors(pointY, pointX)
    var arrow = new ArrowHelper(direction.clone().normalize(), pointX)
    var rotation = new Euler().setFromQuaternion(arrow.quaternion)

    // cylinder: radiusAtTop, radiusAtBottom, 
    //     height, radiusSegments, heightSegments
    let geometry = new CylinderGeometry(thickness, thickness, direction.length(), 32, 100)
    let material = new MeshBasicMaterial( { color } )

    let mesh = new Mesh(geometry, material);

    mesh.setRotationFromEuler(rotation.clone())
    let mid = new Vector3().addVectors(pointX, direction.multiplyScalar(0.5));
    mesh.position.set(mid.x, mid.y, mid.z)
    return mesh
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

export { thickLine, shuffleArray }