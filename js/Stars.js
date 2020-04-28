import { Points, BufferGeometry, Vector3, PointsMaterial, TextureLoader } from './three/build/three.module.js'
import { BLOOM_LAYER } from './constants.js'

export default class Stars {

    constructor(r, n) {
        this.points = []
        for(let i = 0; i < n; i++) {
           let radius = (Math.random()*2 + 1) * r
           let theta = Math.random() * 2*Math.PI
           let z = Math.random() * 2*radius - radius
           let rho = Math.sqrt(radius*radius - z*z)
           let x = rho * Math.cos(theta)
           let y = rho * Math.sin(theta)
           this.points.push(new Vector3(x, y, z))
        }
        
        this.sprite = new TextureLoader().load('../star.png')
        this.geometry = new BufferGeometry().setFromPoints(this.points)
        this.material = new PointsMaterial( { size: 10, sizeAttenuation: true, map: this.sprite, alphaTest: .1,
            transparent: true, color: 0x888888 } )
        this.mesh = new Points(this.geometry, this.material)
        this.mesh.layers.enable(BLOOM_LAYER)
    }


}