
export default class GameLogic {
    constructor() {
        this.player = new PlayerLogic(this)
        
    }

    test() {
        return this.player.test()
    }
}