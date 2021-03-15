var express = require('express')
var _ = require('lodash')
var fs = require('fs')
const { version } = require('os')
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

// return list of dominant role in each version
router.get('/roles/versions', async function (req, res) {
  res.json(getVersionDominantRoleList())
})

// return list of dominant role changes in specific package
router.get('/roles/package/:id', async function (req, res) {
  var id = req.params.id
  res.json(getPackageDominantRoleList(id))
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

// return list of system level changes compared to given version
router.get('/changes/system/:version/:comparedVersion', async function (req, res) {
  var version = req.params.version
  var comparedVersion = req.params.comparedVersion
  res.json(getSystemLevelChanges(version, comparedVersion))
})

router.get('/changes/class/:version/:class', async function (req, res) {
  var selectedVersion = req.params.version
  var selectedClass = req.params.class
  res.json(getClassChanges(selectedVersion, selectedClass))
})

router.get('/changes/elements/:class', async function (req, res) {
  var selectedClass = req.params.class
  res.json(getRelatedElements(selectedClass))
})

// router.get('/class/exist/:version/:class', async function (req, res) {
//   var selectedVersion = req.params.version
//   var selectedClass = req.params.class
//   const node = checkExistence(selectedVersion, selectedClass)
//   if(node !== undefined) {
//     res.json({ 'message': 'Exist.' })
//   } else {
//     res.json({ 'message': 'Selected element does not exist in current version.' })
//     // res.status(204).json({'message': 'Selected element does not exist in current version.'})
//   }
// })

// // check if element exists in given version
// function checkExistence(selectedVersion, selected) {
//   const node = _.find(elements.nodes, n => { 
//     return n.data.id === selected && n.data.version === selectedVersion
//   })
//   return node
// }

// find lists of difference between the given version and each version of given class
function getClassChanges(selectedVersion, selectedClass) {
  let c = []
  const relatedElements = getRelatedElements(selectedClass)
  let from = _.find(relatedElements, ['version', selectedVersion])
  if(from !== undefined) {
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
  }
  return c
}

// get list of all elements related to given class for versions which contains the class
function getRelatedElements(selectedClass) {
  let relatedElements = []
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

      const elementObj = { version: v, nodes: nodeList, edges: edgeList, parents: parentList, firstLvlInNodes:firstLvlInNodes, secondLvlInNodes:secondLvlInNodes, thirdLvlInNodes:thirdLvlInNodes, firstLvlOutNodes:firstLvlOutNodes, secondLvlOutNodes:secondLvlOutNodes, thirdLvlOutNodes:thirdLvlOutNodes }
      relatedElements.push(elementObj)
    }
  })
  return relatedElements
}

function getVersionDominantRoleList() {
  let roleList = []
  _.forEach(versions, v => {
    const nodes = _.filter(elements.nodes, ['data.version', v])
    let count = _.countBy(nodes, 'data.role')
    delete count[undefined]
    let max = 0, maxArray = []
    Object.keys(count).forEach(attr => {
      max = (max <= count[attr]) ? count[attr] : max
    })
    Object.keys(count).forEach(attr => {
      if(max === count[attr]) {
        maxArray.push(attr)
      }
    })
    maxArray.sort()
    const obj = { version: v, role: maxArray }
    roleList.push(obj)
  })
  return roleList
}

function getPackageDominantRoleList(id) {
  let roleList = []
  _.forEach(versions, v => {
    const nodes = _.filter(elements.nodes, n => n.data.parent.search(id) === 0 && n.data.version === v && n.data.role !== undefined)
    let count = _.countBy(nodes, 'data.role')
    let max = 0, maxArray = []
    Object.keys(count).forEach(attr => {
      max = (max <= count[attr]) ? count[attr] : max
    })
    Object.keys(count).forEach(attr => {
      if(max === count[attr]) {
        maxArray.push(attr)
      }
    })
    maxArray.sort()
    const obj = { version: v, role: maxArray }
    roleList.push(obj)
  })
  return roleList
}

const getSystemLevelChanges = (currentVersion, versionToBeCompared) => {
  const currentNodes = _.filter(elements.nodes, ['data.version', currentVersion])
  const currentEdges = _.filter(elements.edges, ['data.version', currentVersion])

  const comparedNodes = _.filter(elements.nodes, ['data.version', versionToBeCompared])
  const comparedEdges = _.filter(elements.edges, ['data.version', versionToBeCompared])

  // nodes
  // in both sets of nodes, included nodes for packages
  // const sameNodes = currentNodes.filter(n1 => comparedNodes.some(n2 => n1.data.id === n2.data.id))
  // only in current set
  const nodesInFirstSetOnly = currentNodes.filter(n1 => !comparedNodes.some(n2 => n1.data.id === n2.data.id))
  // only in set to be compared
  const nodesInSecondSetOnly = comparedNodes.filter(n1 => !currentNodes.some(n2 => n1.data.id === n2.data.id))

  // edges 
  // in both sets of edges
  // const sameEdges = currentEdges.filter(e1 => comparedEdges.some(e2 => e1.data.source === e2.data.source && e1.data.target === e2.data.target))
  // only in current set
  const edgesInFirstSetOnly = currentEdges.filter(e1 => !comparedEdges.some(e2 => e1.data.source === e2.data.source && e1.data.target === e2.data.target))
  // only in set to be compared
  const edgesInSecondSetOnly = comparedEdges.filter(e1 => !currentEdges.some(e2 => e1.data.source === e2.data.source && e1.data.target === e2.data.target))
  
  // role-changed classes
  const roleChangedNodes = currentNodes.filter(n1 => comparedNodes.some(n2 => n1.data.id === n2.data.id && n1.data.role !== n2.data.role))

  // list of nodes with data of two roles
  let roleChangedNodeList = []
  roleChangedNodes.forEach( node => {
    const found = comparedNodes.find( n => n.data.id === node.data.id)
    let roleChangedNode = {}
    roleChangedNode.id = node.data.id
    roleChangedNode[node.data.version] =  node.data.role
    roleChangedNode[found.data.version] =  found.data.role
    roleChangedNodeList.push(roleChangedNode)
  })
  
  const changeObj = {
    from: currentVersion,
    to: versionToBeCompared,
    nodes: { inCurrent: nodesInFirstSetOnly, inCompared: nodesInSecondSetOnly },
    edges: { inCurrent: edgesInFirstSetOnly, inCompared: edgesInSecondSetOnly },
    changedRoles: roleChangedNodeList
  }
  
  return changeObj
}
module.exports = router
