
export default class SpaceFlyControls {
    constructor(camera, dom) {
        dom.addEventListener('mousemove', this.mouseMove)
        dom.addEventListener('touchstart', (e) => { this.click(e.touches[0]); this.mouseMove(e.touches[0]) })
    }

    click() {

    }

    mouseMove() {

    }
}