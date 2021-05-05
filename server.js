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
app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})

// app.get('/api', (req, res) => {
//   res.send('test')
// })

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`)
})