var express = require('express')
var _ = require('lodash')
var fs = require('fs')
var router = express.Router()

var system = 'bitcoin-wallet'
// var system = 'k9'
var dataFile = __dirname + '/data/' + system + '-data-parent.json'
var versionFile = __dirname + '/data/' + system + '.txt'
var styleFile = __dirname + '/data/style.cycss'

// test
// router.get('/text', (req, res) => {
//   res.json({
//     message: 'Test'
//   })
// })

// return styles for cytoscape
router.get('/styles', (req, res) => {
  var styles = JSON.parse(fs.readFileSync(styleFile))
  res.json(styles)
})

// read data json file
var elements = JSON.parse(fs.readFileSync(dataFile))

// return data of specific version
router.get('/elements/:version', async function (req, res) {
  var version = req.params.version
  res.json(getDataByVersion(version))
})

// return elements of all versions
router.get('/elements', async function (req, res) {
  res.json(elements)
})

// return role list of specific class
router.get('/roles/:id', async function (req, res) {
  var id = req.params.id
  var nodeList = _.filter(elements.nodes, ['data.id', id])
  res.json(nodeList)
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

// find parent id by given id
const getParentPackage = (id) => {
  let index = id.lastIndexOf('.')
  return (index !== -1) ? id.slice(0, index) : ''
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
// router.get('/changes/:version', async (req, res) => {
//   const { version } = req.params
//   res.json(findChanges(version))
// })

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

// function findChanges (version) {
//   // find previous version
//   var index = versions.indexOf(version)
//   if (index !== 0) {
//     var previous = versions[index - 1]
//   } else {
//     return
//   }

//   var from = getDataByVersion(previous)
//   var to = getDataByVersion(version)

//   var addedNodes = _.differenceBy(to.nodes, from.nodes, 'data.id')
//   var removedNodes = _.differenceBy(from.nodes, to.nodes, 'data.id')

//   // find newly added and removed edges
//   var fromEdges = []
//   var toEdges = []
//   _.forEach(from.edges, (d) => {
//     var obj = _.pick(d, ['data.source', 'data.target'])
//     fromEdges.push(obj)
//   })
//   _.forEach(to.edges, (d) => {
//     var obj = _.pick(d, ['data.source', 'data.target'])
//     toEdges.push(obj)
//   })

//   var removedEdges = _.differenceWith(fromEdges, toEdges, _.isEqual)
//   var addedEdges = _.differenceWith(toEdges, fromEdges, _.isEqual)

//   // find change of roles and store the later version in changedRoles
//   var fromObjects = []
//   var toObjects = []
//   _.forEach(from.nodes, (d) => {
//     var obj = _.pick(d, ['data.id', 'data.role'])
//     fromObjects.push(obj)
//   })
//   _.forEach(to.nodes, (d) => {
//     var obj = _.pick(d, ['data.id', 'data.role'])
//     toObjects.push(obj)
//   })
//   var fromChangedRolesPlusRemovedNodes = _.differenceWith(fromObjects, toObjects, _.isEqual)
//   var toChangedRolesPlusAddedNodes = _.differenceWith(toObjects, fromObjects, _.isEqual)

//   var changedRoles = _.intersectionBy(toChangedRolesPlusAddedNodes, fromChangedRolesPlusRemovedNodes, 'data.id')

//   // get all package nodes
//   // var parents = from.nodes.filter((n) => n.data.role === undefined)

//   var changeObj = {
//     from: previous,
//     to: version,
//     addedNodes,
//     removedNodes,
//     addedEdges,
//     removedEdges,
//     changedRoles
//   }

//   return changeObj
// }

router.get('/changes/class/:version/:class', async function (req, res) {
  var selectedVersion = req.params.version
  var selectedClass = req.params.class
  res.json(getClassChanges(selectedVersion, selectedClass))
})

// find lists of difference between the given version and each version of given class
function getClassChanges(selectedVersion, selectedClass) {
  let c = []
  const relatedElements = getRelatedElements(selectedClass)
  let from = _.find(relatedElements, ['version', selectedVersion])
  if(from === undefined) {
    console.log('error from getting class changes for ' + selectedVersion + ' ' + selectedClass)
  }
  _.remove(from.nodes, n => {
    return n.data.id === selectedClass
  })

  _.forEach(relatedElements, to => {
    let addedNodes = _.differenceBy(to.nodes, from.nodes, 'data.id')
    let removedNodes = _.differenceBy(from.nodes, to.nodes, 'data.id')

    let addedParents = _.differenceBy(to.parents, from.parents, 'data.id')
    let removedParents = _.differenceBy(from.parents, to.parents, 'data.id')

    let fromEdges = [], toEdges = []
    _.forEach(from.edges, d => {
        fromEdges.push(_.pick(d, ['data.source', 'data.target']))
    })
    _.forEach(to.edges, d => {
        toEdges.push(_.pick(d, ['data.source', 'data.target']))
    })
    let removedEdges = _.differenceWith(fromEdges, toEdges, _.isEqual)
    let addedEdges = _.differenceWith(toEdges, fromEdges, _.isEqual)

    var changeObj = {
        version: to.version,
        addedNodes: addedNodes,
        removedNodes: removedNodes,
        addedParents: addedParents,
        removedParents: removedParents,
        addedEdges: addedEdges,
        removedEdges: removedEdges
      }
      c.push(changeObj)
  })
  return c
}

// get list of all elements related to given class for versions which contains the class
function getRelatedElements(selectedClass) {
  let relevantElements = []
  _.forEach(versions, v => {
    // only continue if the class exist 
    const n = _.find(elements.nodes, n => { 
      return n.data.id === selectedClass && n.data.version === v
    })
    if(n !== undefined) {
      const nodes = _.filter(elements.nodes, ['data.version', v])
      const edges = _.filter(elements.edges, ['data.version', v])
      
      // find in edges 
      let inEdges = []
      const firstLvlInEdges = _.filter(edges, ['data.target', selectedClass])
      const firstLvlInNodes = _.map(firstLvlInEdges, 'data.source')
      const secondLvlInEdges = _.filter(edges, e => {
          return _.includes(firstLvlInNodes, e.data.target)
      })
      const secondLvlInNodes = _.map(secondLvlInEdges, 'data.source')
      const thirdLvlInEdges = _.filter(edges, e => {
          return _.includes(secondLvlInNodes, e.data.target)
      })
      const thirdLvlInNodes = _.map(thirdLvlInEdges, 'data.source')
      inEdges = _.union(firstLvlInEdges, secondLvlInEdges, thirdLvlInEdges)

      // find out edges
      let outEdges = []
      const firstLvlOutEdges = _.filter(edges, ['data.source', selectedClass])
      const firstLvlOutNodes = _.map(firstLvlOutEdges, 'data.target')
      const secondLvlOutEdges = _.filter(edges, e => {
          return _.includes(firstLvlOutNodes, e.data.source)
      })
      const secondLvlOutNodes = _.map(secondLvlOutEdges, 'data.target')
      const thirdLvlOutEdges = _.filter(edges, e => {
          return _.includes(secondLvlOutNodes, e.data.source)
      })
      const thirdLvlOutNodes = _.map(thirdLvlOutEdges, 'data.target')
      outEdges = _.union(firstLvlOutEdges, secondLvlOutEdges, thirdLvlOutEdges)
  
      const edgeList = _.union(inEdges, outEdges)

      // // get list of nodes in found edges
      // let sourceNodes = _.map(edgeList, 'data.source')
      // let targetNodes = _.map(edgeList, 'data.target')
      // const nodesFromEdges = _.union(sourceNodes, targetNodes)
      const nodesFromEdges = _.union(firstLvlInNodes, secondLvlInNodes, thirdLvlInNodes, firstLvlOutNodes, secondLvlOutNodes, thirdLvlOutNodes)
      let nodeList = _.filter(nodes, n => {
        return _.includes(nodesFromEdges, n.data.id)
      })

      // add node when no edge
      const selectedClassNode = _.find(nodes, ['data.id', selectedClass])
      nodeList.push(selectedClassNode)
      nodeList = _.uniq(nodeList)
      
      // get list of parent nodes
      let parentIdList = []
      _.forEach(nodesFromEdges, n => {
        while(getParentPackage(n) !== '') {
          parentIdList.push(getParentPackage(n))
          n = getParentPackage(n)
        }
      })
      parentIdList = _.uniq(parentIdList)
      const parentList = _.filter(nodes, n => {
        return _.includes(parentIdList, n.data.id)
      })

      const elementObj = { version: v, nodes: nodeList, edges: edgeList, parents: parentList }
      relevantElements.push(elementObj)
    }
  })
  return relevantElements
}

module.exports = router
