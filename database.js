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
const driver = new neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "test1234"))

// return list of versions
router.get('/versions', async (req, res) => {
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
  var index = id.lastIndexOf('.')
  var package = id.slice(0, index)
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  const params = { version: req.params.version, package: package }
  const cypher =
    `
      MATCH (p: Package)-[:IN_PATH]->(path: Path)
      WHERE p.version = $version AND path.package = $package
      RETURN path.path AS path, path.username AS username
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
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  const params = { version: req.params.version }
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

// return list of dominant role in each version
router.get('/roles/versions', (req, res) => {
  res.json([])
  // let countList = [], maxList = [], resultList = []
  // let session = driver.session({ defaultAccessMode: neo4j.session.READ })
  // // get count for all roles in each version
  // let cypher =
  //   `
  //     MATCH (c: Class)-[:HAS_ROLE]->(r: Role) 
  //     RETURN c.version AS version, r.name AS role, count(c) AS count
  //     ORDER BY version ASC, count DESC
  //   `
  // session
  //   .run(cypher)
  //   .catch(e => console.log(e))
  //   .then(parser.parse)
  //   .then(parsed => countList = parsed)
  //   .then(() => session.close())

  // session = driver.session({ defaultAccessMode: neo4j.session.READ })
  // // get max count for each version
  // cypher =
  // `
  //   MATCH (c: Class)-[:HAS_ROLE]->(r: Role)
  //   WITH c.version AS version, c.role AS role, count(c) AS count
  //   RETURN version, MAX(count) AS count
  //   ORDER BY version ASC
  // `
  // session
  //   .run(cypher)
  //   .catch(e => console.log(e))
  //   .then(parser.parse)
  //   .then(parsed => maxList = parsed)
  //   .then(() => session.close())

  //   versions.forEach(v => {
  //     var max = maxList.find(m => m.version === v)
  //     var count = countList.filter(c => c.version === v && c.count === max.count)
  //     var roleList = _.map(count, c => c.role)
  //     var obj = { version: v, role: roleList }
  //     resultList.push(obj)
  //   })
  // res.json(resultList)
})

// return list of dominant role changes in specific package
router.get('/roles/package/:id', (req, res) => {
  // const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  // const params = { id: req.params.id }
  // const cypher =
  //   `
  //     MATCH (c: Class)-[:HAS_ROLE]->(r: Role)
  //     RETURN c.version AS version, r.name AS role, count(c) AS count
  //     ORDER BY version ASC, count DESC

    
  //     MATCH (a: Package)-[:BELONGS_TO]->(b: Package)
  //     WHERE b.id = 'wallet'
  //     return DISTINCT a.id

  //   `
  // session
  //   .run(cypher, params)
  //   .catch(e => console.log(e))
  //   .then(parser.parse)
  //   .then(parsed => res.json(parsed))
  //   .then(() => session.close())
})

// return role list of specific class
router.get('/roles/:id', (req, res) => {
  const id = req.params.id
  res.json(getClassRoleList(id))
})

// return list of system level changes compared to given version
router.get('/changes/system/:version/:comparedVersion', (req, res) => {
  const version = req.params.version
  const comparedVersion = req.params.comparedVersion
  res.json(getSystemLevelChanges(version, comparedVersion))
})

// return list of package level changes compared to given version
router.get('/changes/package/:version/:comparedVersion/:package', (req, res) => {
  const version = req.params.version
  const comparedVersion = req.params.comparedVersion
  const package = req.params.package
  res.json(getPackageLevelChanges(version, comparedVersion, package))
})

// return list of class level changes compared to given version
router.get('/changes/class/:version/:comparedVersion/:selectedClass', (req, res) => {
  const version = req.params.version
  const comparedVersion = req.params.comparedVersion
  const selectedClass = req.params.selectedClass
  res.json(getClassLevelChanges(version, comparedVersion, selectedClass))
})

module.exports = router