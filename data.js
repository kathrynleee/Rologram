const express = require('express')
const _ = require('lodash')
const fs = require('fs')
const router = express.Router()

const dataFile = __dirname + '/data/data.json'
const versionFile = __dirname + '/data/version.txt'
const sourceCodePathFile = __dirname + '/data/path.txt'
const styleFile = __dirname + '/data/style.cycss'

// read text file
const versions = readTextFile(versionFile)
const paths = readTextFile(sourceCodePathFile)

// read data json file
const elements = JSON.parse(fs.readFileSync(dataFile))

// return elements of all versions
router.get('/elements', async function (req, res) {
  res.json(elements)
})

// return list of versions
router.get('/versions', function (req, res) {
  res.json(versions)
})

// return list of paths
router.get('/paths', function (req, res) {
  res.json(paths)
})

// return styles for cytoscape
router.get('/styles', (req, res) => {
  const styles = JSON.parse(fs.readFileSync(styleFile))
  res.json(styles)
})

// return data of specific version
router.get('/elements/:version', async function (req, res) {
  const version = req.params.version
  res.json(getDataByVersion(version))
})

// return list of dominant role in each version
router.get('/roles/versions', async function (req, res) {
  res.json(getVersionDominantRoleList())
})

// return list of dominant role changes in specific package
router.get('/roles/package/:id', async function (req, res) {
  const id = req.params.id
  res.json(getPackageDominantRoleList(id))
})

// return role list of specific class
router.get('/roles/:id', async function (req, res) {
  const id = req.params.id
  const nodeList = _.filter(elements.nodes, ['data.id', id])
  res.json(nodeList)
})

// return list of system level changes compared to given version
router.get('/changes/system/:version/:comparedVersion', async function (req, res) {
  const version = req.params.version
  const comparedVersion = req.params.comparedVersion
  res.json(getSystemLevelChanges(version, comparedVersion))
})

// return list of package level changes compared to given version
router.get('/changes/package/:version/:comparedVersion/:package', async function (req, res) {
  const version = req.params.version
  const comparedVersion = req.params.comparedVersion
  const package = req.params.package
  res.json(getPackageLevelChanges(version, comparedVersion, package))
})

// return list of class level changes compared to given version
router.get('/changes/class/:version/:comparedVersion/:selectedClass', async function (req, res) {
  const version = req.params.version
  const comparedVersion = req.params.comparedVersion
  const selectedClass = req.params.selectedClass
  res.json(getClassLevelChanges(version, comparedVersion, selectedClass))
})

// get data for given version
const getDataByVersion = (version) => {
  const data = { nodes: [], edges: [] }
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

// get list of versions in order
function readTextFile(file) {
  const array = fs.readFileSync(file, 'utf8').toString().split('\n')
  return array
}

const getVersionDominantRoleList = () => {
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

const getPackageDominantRoleList = (id) => {
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
  const nodesInFirstSetOnly = _.sortBy(currentNodes.filter(n1 => !comparedNodes.some(n2 => n1.data.id === n2.data.id)), ['data.id'])
  // only in set to be compared
  const nodesInSecondSetOnly = _.sortBy(comparedNodes.filter(n1 => !currentNodes.some(n2 => n1.data.id === n2.data.id)), ['data.id'])

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

const getPackageLevelChanges = (currentVersion, versionToBeCompared, package) => {
  let packages = elements.nodes.filter(n => n.data.parent === package && n.data.role === undefined && n.data.version === currentVersion)
  packages = _.map(packages, 'data.id')
  let packageList = []
  packageList.push(package)
  packageList = _.union(packageList, packages)
  while(packages.length !== 0) {
      packages = elements.nodes.filter(n => _.includes(packages, n.data.parent) && n.data.role === undefined && n.data.version === currentVersion)
      packageList = _.union(packageList, _.map(packages, 'data.id'))
  }

  const currentNodes = elements.nodes.filter(n => _.includes(packageList, n.data.parent) && n.data.role !== undefined && n.data.version === currentVersion)
  const currentEdges = elements.edges.filter(n => (n.data.source.search(package) == 0 && n.data.target.search(package) == 0) && n.data.version === currentVersion)

  const comparedNodes = elements.nodes.filter(n => _.includes(packageList, n.data.parent) && n.data.role !== undefined && n.data.version === versionToBeCompared)
  const comparedEdges = elements.edges.filter(n => (n.data.source.search(package) == 0 && n.data.target.search(package) == 0) && n.data.version === versionToBeCompared)

  // nodes
  // in both sets of nodes, included nodes for packages
  // const sameNodes = currentNodes.filter(n1 => comparedNodes.some(n2 => n1.data.id === n2.data.id))
  // only in current set
  const nodesInFirstSetOnly = _.sortBy(currentNodes.filter(n1 => !comparedNodes.some(n2 => n1.data.id === n2.data.id)), ['data.id'])
  // only in set to be compared
  const nodesInSecondSetOnly = _.sortBy(comparedNodes.filter(n1 => !currentNodes.some(n2 => n1.data.id === n2.data.id)), ['data.id'])

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

const getClassLevelChanges = (currentVersion, versionToBeCompared, selectedClass) => {
  let currentNodeList = [], currentEdgeList = []
  // find first level edges
  let edges = elements.edges.filter(e => (e.data.version === currentVersion) && (e.data.source === selectedClass || e.data.target === selectedClass))
  // get first level nodes
  let nodes = _.union(_.uniq(edges.map(e => e.data.source)), _.uniq(edges.map(e => e.data.target)))
  currentEdgeList = edges
  currentNodeList = nodes
  // get second and third levels edges and nodes
  _.times(2, () => {
      edges = elements.edges.filter(e => (e.data.version === currentVersion) && (_.includes(nodes, e.data.source) || _.includes(nodes, e.data.target)))
      nodes = _.union(_.uniq(edges.map(e => e.data.source)), _.uniq(edges.map(e => e.data.target)))
      currentEdgeList = _.union(currentEdgeList, edges)
      currentNodeList = _.union(currentNodeList, nodes)
  })
  let currentNodes = [], currentEdges = currentEdgeList
  if(currentNodeList.length === 0) { // if no edges connected to the class at all
    const currentClassNode = elements.nodes.find( n => n.data.id === selectedClass && n.data.version === currentVersion)
    currentNodes.push(currentClassNode)
  } else {
    currentNodeList.forEach(nodeId => {
      const found = elements.nodes.find( n => n.data.id === nodeId && n.data.version === currentVersion)
      currentNodes.push(found)
    })
  }

  let comparedNodeList = [], comparedEdgeList = []
  // find first level edges
  edges = elements.edges.filter(e => (e.data.version === versionToBeCompared) && (e.data.source === selectedClass || e.data.target === selectedClass))
  // get first level nodes
  nodes = _.union(_.uniq(edges.map(e => e.data.source)), _.uniq(edges.map(e => e.data.target)))
  comparedEdgeList = edges
  comparedNodeList = nodes
  // get second and third levels edges and nodes
  _.times(2, () => {
      edges = elements.edges.filter(e => (e.data.version === versionToBeCompared) && (_.includes(nodes, e.data.source) || _.includes(nodes, e.data.target)))
      nodes = _.union(_.uniq(edges.map(e => e.data.source)), _.uniq(edges.map(e => e.data.target)))
      comparedEdgeList = _.union(comparedEdgeList, edges)
      comparedNodeList = _.union(comparedNodeList, nodes)
  })
  let comparedNodes = [], comparedEdges = comparedEdgeList
  if(comparedNodeList.length === 0) { // if no edges connected to the class at all
    const comparedClassNode = elements.nodes.find(n => n.data.id === selectedClass && n.data.version === versionToBeCompared)
    comparedNodes.push(comparedClassNode)
  } else {
    comparedNodeList.forEach(nodeId => {
      const found = elements.nodes.find(n => n.data.id === nodeId && n.data.version === versionToBeCompared)
      comparedNodes.push(found)
    })
  }

  // nodes
  // in both sets of nodes, included nodes for packages
  // const sameNodes = currentNodes.filter(n1 => comparedNodes.some(n2 => n1.data.id === n2.data.id))
  // only in current set
  const nodesInFirstSetOnly = _.sortBy(currentNodes.filter(n1 => !comparedNodes.some(n2 => n1.data.id === n2.data.id)), ['data.id'])
  // only in set to be compared
  const nodesInSecondSetOnly = _.sortBy(comparedNodes.filter(n1 => !currentNodes.some(n2 => n1.data.id === n2.data.id)), ['data.id'])

  // parents
  let parents = []
  nodesInFirstSetOnly.forEach(n => {
    let id = n.data.id
    while(getParentPackageName(id) !== '' && !parents.includes(getParentPackageName(id))) {
      parents.push(getParentPackageName(id))
      id = getParentPackageName(id)
    }
  })
  nodesInSecondSetOnly.forEach(n => {
    let id = n.data.id
    while(getParentPackageName(id) !== '' && !parents.includes(getParentPackageName(id))) {
      parents.push(getParentPackageName(id))
      id = getParentPackageName(id)
    }
  })
  parents = _.uniq(parents)
  let parentList = []
  parents.forEach(id => {
    const found = elements.nodes.find(n => n.data.id === id && (n.data.version === currentVersion || n.data.version === versionToBeCompared))
    parentList.push(found)
  })
  parentList = _.uniq(parentList)

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
    parents: parentList,
    changedRoles: roleChangedNodeList
  }
  
  return changeObj
}

const getParentPackageName = (id) => {
  const index = id.lastIndexOf('.')
  return (index != -1) ? id.substring(0, index) : ''
}

module.exports = router
