var express = require('express')
var cors = require('cors')
// var fs = require('fs')
// var http = require('http')
var app = express()
var port = 3000
var dataController = require('./data')

// var htmlPort = process.env.PORT || 8080 

app.options('*', cors())
app.use(cors())
app.use('/api/data', dataController)
app.use(express.static('public'))

app.get('/api', (req, res) => {
  res.send('test')
})

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`)
})

// const server = http.createServer((req, res) => {
//   res.writeHead(200, { 'content-type': 'text/html' })
//   fs.createReadStream(`${__dirname}/public/demo.html`).pipe(res)
// })

// server.listen(htmlPort, () => {
//     console.log(`Frontend listening at http://localhost:${htmlPort}`)
// })
