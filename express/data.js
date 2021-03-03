var express = require('express')
var _ = require('lodash')
var fs = require('fs')
var router = express.Router()

var system = 'bitcoin-wallet'
// var system = 'k9'
var dataFile = '../data/' + system + '-data-parent.json'
var versionFile = '../data/' + system + '.txt'

// test
router.get('/text', (req, res) => {
  res.json({
    message: 'Test'
  })
})

// return styles for cytoscape
router.get('/styles', (req, res) => {
  var styles = JSON.parse(fs.readFileSync('style.cycss'))
  res.json(styles)
})

// read data json file
var elements = JSON.parse(fs.readFileSync(dataFile))

// // filter data by version
// router.get('/elements', (req, res) => {
//   var data = getDataByVersion('bitcoin-wallet-7.44')
//   res.json(data)
// })

// return data of specific version
router.get('/elements/:version', async function (req, res) {
  var version = req.params.version
  res.json(getDataByVersion(version))
})

// return parents of specific version
router.get('/parents/:version', async function (req, res) {
  var version = req.params.version
  res.json(getParentsByVersion(version))
})

function getDataByVersion (version) {
  var data = { nodes: [], edges: [] }
  _.forEach(elements.nodes, function (d) {
    if (d.data.version === version) {
      data.nodes.push(d)
    }
  })
  _.forEach(elements.edges, function (d) {
    if (d.data.version === version) {
      data.edges.push(d)
    }
  })
  return data
}

function getParentsByVersion (version) {
  var data = getDataByVersion(version)
  var parents = data.nodes.filter(n => n.data.role === undefined)
  return parents
}

// get list of versions in order
var versions = readTextFile(versionFile)
function readTextFile (file) {
  var array = fs.readFileSync(file, 'utf8').toString().split('\n')
  return array
}

// return list of versions
router.get('/versions', function (req, res) {
  res.json(versions)
})

router.get('/changes', async function (req, res) {
  res.json(findAllChanges())
})

// return changes between previous and given versions
router.get('/changes/:version', async (req, res) => {
  const { version } = req.params
  res.json(findChanges(version))
})

function findAllChanges () {
  var changes = []
  _.forEach(versions, function (v, i) {
    if (i !== versions.length - 1) {
      var from = getDataByVersion(v)
      var to = getDataByVersion(versions[i + 1])

      var addedNodes = _.differenceBy(to.nodes, from.nodes, 'data.id')
      var removedNodes = _.differenceBy(from.nodes, to.nodes, 'data.id')

      /* find change of roles and store the later version in changedRoles */
      var fromObjects = []
      var toObjects = []
      _.forEach(from.nodes, function (d) {
        var obj = _.pick(d, ['data.id', 'data.role'])
        fromObjects.push(obj)
      })
      _.forEach(to.nodes, function (d) {
        var obj = _.pick(d, ['data.id', 'data.role'])
        toObjects.push(obj)
      })
      var fromChangedRolesPlusRemovedNodes = _.differenceWith(fromObjects, toObjects, _.isEqual)
      var toChangedRolesPlusAddedNodes = _.differenceWith(toObjects, fromObjects, _.isEqual)

      var changedRoles = _.intersectionBy(toChangedRolesPlusAddedNodes, fromChangedRolesPlusRemovedNodes, 'data.id')

      var changeObj = {
        from: v,
        to: versions[i + 1],
        addedNodes: addedNodes,
        removedNodes: removedNodes,
        changedRoles: changedRoles
      }
      changes.push(changeObj)
    }
  })
  return changes
}

function findChanges (version) {
  // find previous version
  var index = versions.indexOf(version)
  if (index !== 0) {
    var previous = versions[index - 1]
  } else {
    return
  }

  var from = getDataByVersion(previous)
  var to = getDataByVersion(version)

  var addedNodes = _.differenceBy(to.nodes, from.nodes, 'data.id')
  var removedNodes = _.differenceBy(from.nodes, to.nodes, 'data.id')

  // find newly added and removed edges
  var fromEdges = []
  var toEdges = []
  _.forEach(from.edges, (d) => {
    var obj = _.pick(d, ['data.source', 'data.target'])
    fromEdges.push(obj)
  })
  _.forEach(to.edges, (d) => {
    var obj = _.pick(d, ['data.source', 'data.target'])
    toEdges.push(obj)
  })

  var removedEdges = _.differenceWith(fromEdges, toEdges, _.isEqual)
  var addedEdges = _.differenceWith(toEdges, fromEdges, _.isEqual)

  // find change of roles and store the later version in changedRoles
  var fromObjects = []
  var toObjects = []
  _.forEach(from.nodes, (d) => {
    var obj = _.pick(d, ['data.id', 'data.role'])
    fromObjects.push(obj)
  })
  _.forEach(to.nodes, (d) => {
    var obj = _.pick(d, ['data.id', 'data.role'])
    toObjects.push(obj)
  })
  var fromChangedRolesPlusRemovedNodes = _.differenceWith(fromObjects, toObjects, _.isEqual)
  var toChangedRolesPlusAddedNodes = _.differenceWith(toObjects, fromObjects, _.isEqual)

  var changedRoles = _.intersectionBy(toChangedRolesPlusAddedNodes, fromChangedRolesPlusRemovedNodes, 'data.id')

  // get all package nodes
  // var parents = from.nodes.filter((n) => n.data.role === undefined)

  var changeObj = {
    from: previous,
    to: version,
    addedNodes,
    removedNodes,
    addedEdges,
    removedEdges,
    changedRoles
  }

  return changeObj
}

module.exports = router
