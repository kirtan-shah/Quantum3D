import seedrandom from 'seedrandom'

var prng
function setSeed(seed) {
    prng = seedrandom(seed)
}

function random() {
    if(!prng) prng = seedrandom()
    return prng.quick()
}

function randomGaussian(seeded) {
    var u = 0, v = 0
    while(u === 0) u = seeded ? random() : Math.random() //Converting [0,1) to (0,1)
    while(v === 0) v = seeded ? random() : Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

export {
    setSeed, random, randomGaussian
}