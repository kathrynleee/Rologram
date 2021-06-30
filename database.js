const express = require('express')
const fs = require('fs')
const _ = require('lodash')
const neo4j = require('neo4j-driver')
const parser = require('parse-neo4j')
const router = express.Router()
router.use(express.json())
router.use(express.urlencoded({
  extended: true
}))

const driver = new neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'test1234'))

getVersions()
// return elements of all versions
router.get('/elements', (req, res) => {
  var version = req.params.version
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  const params = { version: version }
  const cypher =
    `
      MATCH (n)
      WHERE n:Class OR n:Package OR n:Dependency
      RETURN n
    `
  session
    .run(cypher, params)
    .catch(e => console.log(e))
    .then(parser.parse)
    .then(parsed => {
      var results = []
      parsed.forEach(p => results.push({ data: p }))
      res.json(results)
    })
    .then(() => session.close())
})

// return list of versions
router.get('/versions', (req, res) => {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  const cypher = 'MATCH (v: Version) RETURN v.id ORDER BY v.date'
  session
    .run(cypher)
    .catch(e => console.log(e))
    .then(parser.parse)
    .then(parsed => res.json(parsed))
    .then(() => session.close())
})

// return username
router.get('/username', (req, res) => {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  const cypher = 'MATCH (p: Path) RETURN p.username LIMIT 1'
  session
    .run(cypher)
    .catch(e => console.log(e))
    .then(parser.parse)
    .then(parsed => res.json(parsed[0]))
    .then(() => session.close())
})

// return path for given class
router.get('/path/:version/:id', (req, res) => {
  var id = req.params.id
  var version = req.params.version
  var index = id.lastIndexOf('.')
  var package = id.slice(0, index)
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  const params = { version: version, package: package }
  const cypher =
    `
      MATCH (p: Package)-[:IN_PATH]->(path: Path)
      WHERE p.version = $version AND path.package = $package
      RETURN path.path AS path, path.username AS username, path.package AS package
    `
  session
    .run(cypher, params)
    .catch(e => console.log(e))
    .then(parser.parse)
    .then(parsed => res.json(parsed[0]))
    .then(() => session.close())
})

// return styles for cytoscape
router.get('/styles', (req, res) => {
  var styleFile = __dirname + '/data/style.cycss'
  var styles = JSON.parse(fs.readFileSync(styleFile))
  res.json(styles)
})

// return data of specific version
router.get('/elements/:version', (req, res) => {
  const version = req.params.version
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  const params = { version: version }
  const cypher =
    `
      MATCH (n {version: $version})
      WHERE n:Class OR n:Package OR n:Dependency
      RETURN n
    `
  session
    .run(cypher, params)
    .catch(e => console.log(e))
    .then(parser.parse)
    .then(parsed => {
      var results = []
      parsed.forEach(p => results.push({ data: p }))
      res.json(results)
    })
    .then(() => session.close())
})

// return list of role changed classes for specific version
router.get('/roleChanged/:version', (req, res) => {
  const version = req.params.version
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  const params = { version: version }
  const cypher =
    `
      MATCH (c: Class)
      WITH c.id AS id, collect(distinct(c.role)) AS roles, collect(c.version) AS versions
      ORDER BY id
      WHERE SIZE(roles) > 1 AND $version IN versions
      RETURN collect(id)
    `
  session
    .run(cypher, params)
    .catch(e => console.log(e))
    .then(parser.parse)
    .then(parsed => res.json(parsed[0]))
    .then(() => session.close())
})

// return data of specific pattern
router.post('/pattern', (req, res) => {
  var level = req.body.level
  var options = req.body.options
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  if(level === 1) {
    var params = { option: options[0] }
    var cypher =
      `
        MATCH (a: Class)
        WHERE a.role IN $option
        RETURN a.version AS version, count(*) AS count
      `
  } else if(level === 2) {
    var params = { option: options[0], option1: options[1] }
    var cypher =
      `
        MATCH (a: Class)-[:DEPENDS_ON]->(b: Class)
        WHERE a.role IN $option AND b.role IN $option1
        RETURN a.version AS version, count(*) AS count
      `
  } else if(level === 3) {
    var params = { option: options[0], option1: options[1], option2: options[2] }
    var cypher =
      `
        MATCH (a: Class)-[:DEPENDS_ON]->(b: Class)-[:DEPENDS_ON]->(c: Class)
        WHERE a.role IN $option AND b.role IN $option1 AND c.role IN $option2
        RETURN a.version AS version, count(*) AS count
      `
  }
  session
    .run(cypher, params)
    .catch(e => console.log(e))
    .then(parser.parse)
    .then(parsed => res.json(parsed))
    .then(() => session.close())
})

// return ranking list of specific level of pattern
router.get('/pattern/:level/:version', (req, res) => {
  const level = req.params.level
  const version = req.params.version
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  const params = { version: version }
  if(level == 1) {
    var cypher = 
      `
        MATCH (c: Class)
        WHERE c.version = $version
        RETURN [c.role] AS pattern, count(*) AS count
        ORDER BY count DESC
      `
  } else if(level == 2) {
    var cypher = 
      `
        MATCH (c1: Class)-[:DEPENDS_ON]->(c2: Class)
        WHERE c1.version = $version AND c2.version = $version
        RETURN [c1.role, c2.role] AS pattern, count(*) AS count
        ORDER BY count DESC
      `
  } else {
    var cypher = 
      `
        MATCH (c1: Class)-[:DEPENDS_ON]->(c2: Class)-[:DEPENDS_ON]->(c3: Class)
        WHERE c1.version = $version AND c2.version = $version AND c3.version = $version
        RETURN [c1.role, c2.role, c3.role] AS pattern, count(*) AS count
        ORDER BY count DESC
      `
  }
  session
    .run(cypher, params)
    .catch(e => console.log(e))
    .then(parser.parse)
    .then(parsed => res.json(parsed))
    .then(() => session.close())
})

// return list of dominant role in each version
router.get('/roles/versions', (req, res) => {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  const cypher =
    `
      MATCH (c: Class)-[:HAS_ROLE]->(r: Role)
      RETURN c.version AS version, r.name AS role, count(c) AS count
      ORDER BY version ASC, count DESC
    `
  session
    .run(cypher)
    .catch(e => console.log(e))
    .then(parser.parse)
    .then(parsed => {
      let resultList = []
      versionList.forEach(v => {
        var filtered = _.filter(parsed, { 'version': v })
        var max = _.maxBy(filtered, 'count').count
        var filtered = _.filter(parsed, { 'version': v, 'count': max })
        var roleList = _.map(filtered, c => c.role)
        var obj = { version: v, role: roleList }
        resultList.push(obj)
      })
      res.json(resultList)
    })
    .then(() => session.close())
})

let versionList = []
function getVersions() {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  const cypher = 'MATCH (v: Version) RETURN v.id ORDER BY v.date'
  session
    .run(cypher)
    .catch(e => console.log(e))
    .then(parser.parse)
    .then(parsed => versionList = parsed)
    .then(() => session.close())
}

// return list of dominant role changes in specific package
router.get('/roles/package/:id', (req, res) => {
  const id = req.params.id
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  const params = { id: id }
  const cypher =
    `
      MATCH (p: Package), (c: Class)
      WHERE p.id = $id AND p.version = c.version AND c.parent = p.id
      RETURN p.version AS version,  c.role AS role, count(c.role) AS count
      ORDER BY p.version ASC, count DESC
    `
  session
    .run(cypher, params)
    .catch(e => console.log(e))
    .then(parser.parse)
    .then(parsed => {
      let resultList = []
      versionList.forEach(v => {
        var filtered = _.filter(parsed, { 'version': v })
        if(filtered.length > 0) {
          var max = _.maxBy(filtered, 'count').count
          var filtered = _.filter(parsed, { 'version': v, 'count': max })
          var roleList = _.map(filtered, c => c.role)
          var obj = { version: v, role: roleList }
          resultList.push(obj)
        }
      })
      res.json(resultList)
    })
    .then(() => session.close())
})

// return role list of specific class
router.get('/roles/:id', (req, res) => {
  const id = req.params.id
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  const params = { id: id }
  const cypher =
    `
      MATCH (c: Class)
      WHERE c.id = $id
      RETURN c.version AS version, c.role AS role
      ORDER BY c.version
    `
  session
    .run(cypher, params)
    .catch(e => console.log(e))
    .then(parser.parse)
    .then(parsed => res.json(parsed))
    .then(() => session.close())
})

// return list of system level changes compared to given version
// router.get('/changes/system/:version/:comparedVersion', (req, res) => {
//   const version = req.params.version
//   const comparedVersion = req.params.comparedVersion
// })

// return list of package level changes compared to given version
// router.get('/changes/package/:version/:comparedVersion/:package', (req, res) => {
//   const version = req.params.version
//   const comparedVersion = req.params.comparedVersion
//   const package = req.params.package
// })

// return list of class level changes compared to given version
// router.get('/changes/class/:version/:comparedVersion/:selectedClass', (req, res) => {
//   const version = req.params.version
//   const comparedVersion = req.params.comparedVersion
//   const selectedClass = req.params.selectedClass
// })

module.exports = router