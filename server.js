var cors = require('cors')
var express = require('express')
var fs = require('fs')
var http = require('http')
var app = express()

var port = process.env.PORT || 3000
var htmlPort = process.env.PORT || 8080 

var dataController = require('./data')

app.options('*', cors())
app.use(cors())
app.use('/api/data', dataController)

// app.get('/api', (req, res) => {
//   res.send(`${port}`)
// })

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`)
})

 const server = http.createServer((req, res) => {
   res.writeHead(200, { 'content-type': 'text/html' })
   fs.createReadStream(`${__dirname}/html/index.html`).pipe(res)
 })

 server.listen(htmlPort, () => {
     console.log(`Frontend listening at http://localhost:${htmlPort}`)
 })
