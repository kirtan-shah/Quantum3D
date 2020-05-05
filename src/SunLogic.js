import { Vector3 } from 'three'
import { entityId } from './ID.js'

export default class SunLogic {
    constructor() {
        this.position = new Vector3()
        this.id = entityId()
    }

    get object() {
        return {
            id: this.id,
            position: this.position
        }
    }
}