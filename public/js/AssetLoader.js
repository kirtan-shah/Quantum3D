import { FileLoader, Cache } from './three/build/three.module.js'

export default class AssetLoader {

    constructor() {
        this.queue = {}
        this.fileLoader = new FileLoader()
        this.count = 0
        this.done = 0
        this.lock = false
        Cache.enabled = true
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