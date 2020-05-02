import { IcosahedronGeometry, Geometry, MeshBasicMaterial, MeshLambertMaterial, TextureLoader, MeshPhongMaterial, Vector3, Face3, DoubleSide, Mesh, MeshPhysicalMaterial } from './three/build/three.module.js'
import { shuffleArray } from './utils.js'


class DysonSphere {

    constructor(r, pos) {
        if(!DysonSphere.transparentMaterial) 
            DysonSphere.transparentMaterial = new MeshBasicMaterial({ transparent: true, opacity: 0 })
        if(!DysonSphere.invisibleMaterial)
            DysonSphere.invisibleMaterial = new MeshBasicMaterial({ color: 'black' })

        let icoGeometry = new IcosahedronGeometry(r, 1)
        let geometry = new Geometry()
        for(let i = 0; i < icoGeometry.faces.length; i++) {
            let a = icoGeometry.vertices[icoGeometry.faces[i].a].clone()
            let b = icoGeometry.vertices[icoGeometry.faces[i].b].clone()
            let c = icoGeometry.vertices[icoGeometry.faces[i].c].clone()
            let centroid = new Vector3().add(a).add(b).add(c).divideScalar(3)
            let k = 1
            let delta = new Vector3(k - 1, k - 1, k - 1).multiply(centroid)
            let selectDelta = new Vector3(.25, .25, .25).multiply(centroid)

            geometry.vertices.push(
                a.add(delta),
                b.add(delta),
                c.add(delta)
            )
            let face = new Face3(0 + i*3, 1 + i*3, 2 + i*3)
            face.delta = delta
            face.original = { a: a.clone(), b: b.clone(), c: c.clone() }
            face.selectDelta = selectDelta
            geometry.faces.push(face)
        }
        geometry.computeBoundingSphere()
        icoGeometry.dispose()
        shuffleArray(geometry.faces)
        geometry.faces.forEach((face, i) => {
            face.index = i
            //face.bloom = Math.random() < .25
        })

        this.count = 0 //geometry.faces.length
        this.geometry = geometry
        this.material = new MeshPhongMaterial({ color: 0xcebc21, emissive: 0x2b0b0b, specular: 0x111111, shininess: 30, flatShading: true })
        this.mesh = new DysonMesh(this.geometry, [ DysonSphere.transparentMaterial, this.material, DysonSphere.invisibleMaterial ])
        this.mesh.position.set(pos.x, pos.y, pos.z)
        this.mesh.dyson = this

        this.click = -1
        this.clicked = -1
    }

    update() {
        for(let i = 0; i < this.geometry.faces.length; i++) {
            this.geometry.faces[i].materialIndex =  this.geometry.faces[i].index < this.count ? 1 : 0
        }
        this.geometry.sortFacesByMaterialIndex()
        this.geometry.elementsNeedUpdate = true

        if(this.click != this.clicked) {
            if(this.clicked != -1) {
                let tl = gsap.timeline()
                let face = this.geometry.faces[this.clicked]
                let { a, b, c } = face.original               
                tl.to(this.geometry.vertices[face.a], .4, { x: a.x, y: a.y, z: a.z, ease: Expo.easeOut }).eventCallback('onUpdate', this.updateAnim.bind(this))
                tl.to(this.geometry.vertices[face.b], .4, { x: b.x, y: b.y, z: b.z, ease: Expo.easeOut }, 0).eventCallback('onUpdate', this.updateAnim.bind(this))
                tl.to(this.geometry.vertices[face.c], .4, { x: c.x, y: c.y, z: c.z, ease: Expo.easeOut }, 0).eventCallback('onUpdate', this.updateAnim.bind(this))
                this.clicked = this.click
            }
            if(this.click != -1) {
                let tl = gsap.timeline()
                let face = this.geometry.faces[this.click]
                let a = face.selectDelta.clone().add(this.geometry.vertices[face.a])
                let b = face.selectDelta.clone().add(this.geometry.vertices[face.b])
                let c = face.selectDelta.clone().add(this.geometry.vertices[face.c])
                tl.to(this.geometry.vertices[face.a], .4, { x: a.x, y: a.y, z: a.z, ease: Expo.easeOut }).eventCallback('onUpdate', this.updateAnim.bind(this))
                tl.to(this.geometry.vertices[face.b], .4, { x: b.x, y: b.y, z: b.z, ease: Expo.easeOut }, 0).eventCallback('onUpdate', this.updateAnim.bind(this))
                tl.to(this.geometry.vertices[face.c], .4, { x: c.x, y: c.y, z: c.z, ease: Expo.easeOut }, 0).eventCallback('onUpdate', this.updateAnim.bind(this))
                this.clicked = this.click
            }
        }
    }

    updateAnim() {
        this.geometry.verticesNeedUpdate = true
    }

    darken() {
        for(let i = 0; i < this.geometry.faces.length; i++) {
            if(this.geometry.faces[i].bloom) continue
            if(this.geometry.faces[i].materialIndex == 1) this.geometry.faces[i].materialIndex = 2
        }
        this.geometry.elementsNeedUpdate = true
    }

    restore() {
        for(let i = 0; i < this.geometry.faces.length; i++) {
            if(this.geometry.faces[i].bloom) continue
            if(this.geometry.faces[i].materialIndex == 2) this.geometry.faces[i].materialIndex = 1
        }
        this.geometry.elementsNeedUpdate = true
    }
}

class DysonMesh extends Mesh {
    constructor(geometry, material) {
        super(geometry, material)
    }
}

export { DysonSphere, DysonMesh }