const express = require('express')
const cors = require('cors')
const pug = require('pug')
let app = express()
let port = process.env.PORT || 3000
let dataController = require('./api')

app.options('*', cors())
app.use(cors())
app.use('/api/data', dataController)
app.use(express.static('public'))

// app.use(express.static(__dirname + '/public'))
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/public/index.html')
// })

app.set('views', './src/views')
app.set('view engine', 'pug')

app.get('/', (req, res) => {
  res.render('_index')
})

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`)
})