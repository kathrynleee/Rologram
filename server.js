var express = require('express')
var cors = require('cors')
var app = express()
var port = process.env.PORT || 3000
var dataController = require('./data')
// var databaseController = require('./database')

app.options('*', cors())
app.use(cors())
app.use('/api/data', dataController)
// app.use('/api/data', databaseController)
app.use(express.static('public'))

app.get('/api', (req, res) => {
  res.send('test')
})

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`)
})