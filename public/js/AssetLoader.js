import { FileLoader, Cache } from './three/build/three.module.js'

export default class AssetLoader {

    constructor() {
        this.queue = {}
        this.fileLoader = new FileLoader()
        this.count = 0
        this.done = 0
        this.lock = false
        Cache.enabled = true
        this.imgList = []
    }

    getData(name) {
        return this.queue[name].data
    }

    add(name, type) {
        this.queue[name] = { type, data: null }
        this.count++
        switch(type) {
            case 'file':
                this.fileLoader.load(name, (data) => {
                    this.queue[name].data = data    
                    this.done++
                    if(this.onComplete && this.lock && this.done == this.count) this.onComplete()
                }, (xhr) => {
                    //progress
                }, (err) => {
                    console.error('Error loading', name, err)
                    this.done++
                    if(this.onComplete && this.lock && this.done == this.count) this.onComplete()
                })
                break
            case 'image':
                let self = this
                let img = new Image()
                img.onload = function() {
                    let index = self.imgList.indexOf(img)
                    if(index !== -1) self.imgList.splice(index, 1)
                    self.done++
                    if(self.onComplete && self.lock && self.done == self.count) self.onComplete()
                }
                this.imgList.push(img)
                img.src = name
                break
            default:
                console.error('Unknown data type:', type)
                break
        }

    }

    load(onComplete) {
        this.onComplete = onComplete
        this.lock = true
        if(this.done == this.count) onComplete()
    }
}