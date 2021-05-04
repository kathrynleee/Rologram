const express = require('express')
const cors = require('cors')
let app = express()
let port = process.env.PORT || 3000
let dataController = require('./data')
// let databaseController = require('./database')

app.options('*', cors())
app.use(cors())
app.use('/api/data', dataController)
// app.use('/api/data', databaseController)
app.use(express.static('dist'))

app.get('/api', (req, res) => {
  res.send('test')
})

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`)
})