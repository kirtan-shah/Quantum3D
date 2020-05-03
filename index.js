import express from 'express'
import GameLogic from './public/logic/GameLogic.js'
const app = express()
const port = 971

let game = new GameLogic()

app.use(express.static('public'))
app.get('/calculate', (req, res) => res.send(game.test()))

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))