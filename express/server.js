var express = require('express')
var cors = require('cors')
var app = express()
// var path = require('path')
var port = 3000

var dataController = require('./data')

app.options('*', cors())
app.use(cors())
app.use('/api/data', dataController)

// var root = path.normalize(__dirname + '/..')
// var client = path.join(root, 'client', 'dist')
// app.use(express.static(client))

app.get('/api', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`)
})