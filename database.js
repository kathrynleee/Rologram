const express = require('express')
const fs = require('fs')
const neo4j = require('neo4j-driver')
const parser = require('parse-neo4j')
const router = express.Router()

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
  var version = req.params.version
  var index = id.lastIndexOf('.')
  var package = id.slice(0, index)
})

// return styles for cytoscape
router.get('/styles', (req, res) => {
  var styleFile = __dirname + '/data/style.cycss'
  var styles = JSON.parse(fs.readFileSync(styleFile))
  res.json(styles)
})

// return data of specific version
router.get('/elements/:version', (req, res) => {
  var version = req.params.version
  res.json(getDataByVersion(version))
})

// return data of specific pattern
router.post('/pattern', (req, res) => {
  var level = req.body.level
  var options = req.body.options
  res.json(getPattern(level, options))
})

// return list of dominant role in each version
router.get('/roles/versions', (req, res) => {
  res.json(getVersionDominantRoleList())
})

// return list of dominant role changes in specific package
router.get('/roles/package/:id', (req, res) => {
  var id = req.params.id
  res.json(getPackageDominantRoleList(id))
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