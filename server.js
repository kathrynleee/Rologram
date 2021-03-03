var express = require('express')
var cors = require('cors')
var http = require('http')
var fs = require('fs')
var app = express()
// var path = require('path')
var port = process.env.PORT || 3000
var htmlPort = process.env.PORT || 8080

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

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' })
  fs.createReadStream(__dirname + '/html/index.html').pipe(res)
})

server.listen(htmlPort, () => {
    console.log(`Frontend listening at http://localhost:${htmlPort}`)
})

//fs.readFile(__dirname + '/html/index.html', (err, html) => {
//    if (err) throw err
//
//    http.createServer(function(request, response) {  
//        response.writeHeader(200, {"Content-Type": "text/html"})
//        response.write(html) 
//        response.end()
//    }).listen(htmlPort)
//})