const express = require('express')
const data  = require('./data.js')
const router = express.Router()
router.use(express.json())
router.use(express.urlencoded({
  extended: true
}))

// return elements of all versions
router.get('/elements', (req, res) => {
  res.json(data.getAllElements())
})

// return list of versions
router.get('/versions', (req, res) => {
  res.json(data.getVersionList())
})

// return username
router.get('/username', (req, res) => {
  res.json(data.getUsername())
})

// return path for given class
router.get('/path/:version/:id', (req, res) => {
  var id = req.params.id
  var version = req.params.version
  var path = data.findPath(id, version)
  res.json(path)
})

// return styles for cytoscape
router.get('/styles', (req, res) => {
  res.json(data.getStyles())
})

// return data of specific version
router.get('/elements/:version', (req, res) => {
  var version = req.params.version
  res.json(data.getDataByVersion(version))
})

// return list of role changed classes for specific version
router.get('/roleChanged/:version', (req, res) => {
  var version = req.params.version
  res.json(data.getRoleChangedClasses(version))
})

// return data of specific pattern
router.post('/pattern', (req, res) => {
  var level = req.body.level
  var options = req.body.options
  res.json(data.getPattern(level, options))
})

// return ranking list of specific level of pattern
router.get('/pattern/:level/:version', (req, res) => {
  var level = req.params.level
  var version = req.params.version
  res.json(data.getPatternRanking(level, version))
})

// return list of dominant role in each version
router.get('/roles/versions', (req, res) => {
  res.json(data.getVersionDominantRoleList())
})

// return list of dominant role changes in specific package
router.get('/roles/package/:id', (req, res) => {
  var id = req.params.id
  res.json(data.getPackageDominantRoleList(id))
})

// return role list of specific class
router.get('/roles/:id', (req, res) => {
  const id = req.params.id
  res.json(data.getClassRoleList(id))
})

// return list of system level changes compared to given version
router.get('/changes/system/:version/:comparedVersion', (req, res) => {
  const version = req.params.version
  const comparedVersion = req.params.comparedVersion
  res.json(data.getSystemLevelChanges(version, comparedVersion))
})

// return list of package level changes compared to given version
router.get('/changes/package/:version/:comparedVersion/:package', (req, res) => {
  const version = req.params.version
  const comparedVersion = req.params.comparedVersion
  const package = req.params.package
  res.json(data.getPackageLevelChanges(version, comparedVersion, package))
})

// return list of class level changes compared to given version
router.get('/changes/class/:version/:comparedVersion/:selectedClass', (req, res) => {
  const version = req.params.version
  const comparedVersion = req.params.comparedVersion
  const selectedClass = req.params.selectedClass
  res.json(data.getClassLevelChanges(version, comparedVersion, selectedClass))
})

module.exports = router
