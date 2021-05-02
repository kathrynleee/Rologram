const express = require('express')
const _ = require('lodash')
const fs = require('fs')
const router = express.Router()
router.use(express.json())
router.use(express.urlencoded({
  extended: true
}))
const csv = require('csvtojson')

let packageCsvFile = __dirname + '/data/packages.csv'
let classCsvFile = __dirname + '/data/classes.csv'
let dependencyCsvFile = __dirname + '/data/dependencies.csv'
let pathCsvFile = __dirname + '/data/path.csv'

const versionFile = __dirname + '/data/version.txt'
const styleFile = __dirname + '/data/style.cycss'

// read version text file
const versions = readTextFile(versionFile)

// input data from csv
let paths = []
let elements = { nodes: [], edges: [] }
extractDataFromCsv()

function extractDataFromCsv(){
  csv()
  .fromFile(packageCsvFile)
  .then((jsonObj) => {
    _.forEach(jsonObj, (o) => {
      elements.nodes.push({ data: o })
    })
  })
  csv()
    .fromFile(classCsvFile)
    .then((jsonObj) => {
      _.forEach(jsonObj, (o) => {
        elements.nodes.push({ data: o })
      })
    })
  csv()
    .fromFile(dependencyCsvFile)
    .then((jsonObj) => {
      _.forEach(jsonObj, (o) => {
        elements.edges.push({ data: o })
      })
    })
    // .then(() => {
    //   savePatternCount()
    // })
  csv()
    .fromFile(pathCsvFile)
    .then((jsonObj) => {
      paths = jsonObj
    })
}

// return elements of all versions
router.get('/elements', (req, res) => {
  res.json(elements)
})

// return list of versions
router.get('/versions', (req, res) => {
  res.json(versions)
})

// return username
router.get('/username', (req, res) => {
  res.json(paths[0].username)
})

// return path for given class
router.get('/path/:version/:id', (req, res) => {
  var id = req.params.id
  var version = req.params.version
  var path = findPath(id, version)
  res.json(path)
})

// return styles for cytoscape
router.get('/styles', (req, res) => {
  var styles = JSON.parse(fs.readFileSync(styleFile))
  res.json(styles)
})

// return data of specific version
router.get('/elements/:version', (req, res) => {
  var version = req.params.version
  res.json(getDataByVersion(version))
})

// return commit message of specific version
// router.get('/message/:version', (req, res) => {
//   var version = req.params.version
//   res.json(getCommitMessage(version))
// })

// return list of role changed classes for specific version
router.get('/roleChanged/:version', (req, res) => {
  var version = req.params.version
  res.json(getRoleChangedClasses(version))
})

// return data of specific pattern
router.post('/pattern', (req, res) => {
  var level = req.body.level
  var options = req.body.options
  res.json(getPattern(level, options))
})

// return ranking list of specific level of pattern
router.get('/pattern/:level/:version', (req, res) => {
  var level = req.params.level
  var version = req.params.version
  res.json(getPatternRanking(level, version))
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

// get data for given version
const getDataByVersion = (version) => {
  const data = { nodes: [], edges: [] }
  _.forEach(elements.nodes, (d) => {
    if (d.data.version == version) {
      data.nodes.push(d)
    }
  })
  _.forEach(elements.edges, (d) => {
    if (d.data.version == version) {
      data.edges.push(d)
    }
  })
  return data
}

// read text file
function readTextFile(file) {
  const array = fs.readFileSync(file, 'utf8').toString().split('\n')
  return array
}

function findPath(id, version) {
  var index = id.lastIndexOf('.')
  var package = id.slice(0, index)
  var found = paths.find(p => p.version == version && p.package == package)
  if(found == undefined) {
    found = paths.find(p => p.version == '' && p.package == package)
  }
  return found
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
      if(max == count[attr]) {
        maxArray.push(attr)
      }
    })
    maxArray.sort()
    const obj = { version: v, role: maxArray }
    roleList.push(obj)
  })
  return roleList
}

const getPackageDominantRoleList = (package) => {
  let roleList = []
  _.forEach(versions, v => {
    // find all subpackage names
    let packages = elements.nodes.filter(n => n.data.version == v && n.data.parent == package && n.data.role == undefined)
    packages = _.map(packages, 'data.id')
    let packageList = []
    packageList.push(package)
    packageList = _.union(packageList, packages)
    // search subpackages of subpackages
    while(packages.length != 0) {
      let subPackages = elements.nodes.filter(n => n.data.version == v && _.includes(packages, n.data.parent) && n.data.role == undefined)
      packageList = _.union(packageList, _.map(subPackages, 'data.id'))
      packages = _.map(subPackages, 'data.id')
    }
    // search for nodes in the package and subpackages
    const nodes = _.filter(elements.nodes, n => n.data.version == v && _.includes(packageList, n.data.parent) && n.data.role != undefined)
    let count = _.countBy(nodes, 'data.role')
    let max = 0, maxArray = []
    Object.keys(count).forEach(attr => {
      max = (max <= count[attr]) ? count[attr] : max
    })
    Object.keys(count).forEach(attr => {
      if(max == count[attr]) {
        maxArray.push(attr)
      }
    })
    maxArray.sort()
    if(maxArray.length > 0) {
      const obj = { version: v, role: maxArray }
      roleList.push(obj)
    }
  })
  return roleList
}

const getClassRoleList = (id) => {
  let roleList = []
  _.forEach(versions, v => {
    const node = elements.nodes.find(n => n.data.id == id && n.data.version == v)
    if(node != undefined) {
      const obj = { version: v, role: node.data.role }
      roleList.push(obj)
    }
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
  const sameNodes = currentNodes.filter(n1 => comparedNodes.some(n2 => n1.data.id == n2.data.id))
  // only in current set
  const nodesInFirstSetOnly = _.sortBy(currentNodes.filter(n1 => !comparedNodes.some(n2 => n1.data.id == n2.data.id)), ['data.id'])
  // only in set to be compared
  const nodesInSecondSetOnly = _.sortBy(comparedNodes.filter(n1 => !currentNodes.some(n2 => n1.data.id == n2.data.id)), ['data.id'])

  // parents
  let parents = []
  sameNodes.forEach(n => {
    let id = n.data.id
    while(getParentPackageName(id) != '' && !parents.includes(getParentPackageName(id))) {
      parents.push(getParentPackageName(id))
      id = getParentPackageName(id)
    }
  })
  nodesInFirstSetOnly.forEach(n => {
    let id = n.data.id
    while(getParentPackageName(id) != '' && !parents.includes(getParentPackageName(id))) {
      parents.push(getParentPackageName(id))
      id = getParentPackageName(id)
    }
  })
  nodesInSecondSetOnly.forEach(n => {
    let id = n.data.id
    while(getParentPackageName(id) != '' && !parents.includes(getParentPackageName(id))) {
      parents.push(getParentPackageName(id))
      id = getParentPackageName(id)
    }
  })
  parents = _.uniq(parents)
  let parentList = []
  parents.forEach(id => {
    const found = elements.nodes.find(n => n.data.id == id && (n.data.version == currentVersion || n.data.version == versionToBeCompared))
    parentList.push(found)
  })
  parentList = _.uniq(parentList)
  
  // edges 
  // in both sets of edges
  const sameEdges = currentEdges.filter(e1 => comparedEdges.some(e2 => e1.data.source == e2.data.source && e1.data.target == e2.data.target))
  // only in current set
  const edgesInFirstSetOnly = currentEdges.filter(e1 => !comparedEdges.some(e2 => e1.data.source == e2.data.source && e1.data.target == e2.data.target))
  // only in set to be compared
  const edgesInSecondSetOnly = comparedEdges.filter(e1 => !currentEdges.some(e2 => e1.data.source == e2.data.source && e1.data.target == e2.data.target))
  
  // role-changed classes
  const roleChangedNodes = currentNodes.filter(n1 => comparedNodes.some(n2 => n1.data.id == n2.data.id && n1.data.role != n2.data.role))

  // list of nodes with data of two roles
  let roleChangedNodeList = []
  roleChangedNodes.forEach( node => {
    const found = comparedNodes.find( n => n.data.id == node.data.id)
    let roleChangedNode = {}
    roleChangedNode.id = node.data.id
    roleChangedNode[node.data.version] =  node.data.role
    roleChangedNode[found.data.version] =  found.data.role
    roleChangedNodeList.push(roleChangedNode)
  })

  const changeObj = {
    from: currentVersion,
    to: versionToBeCompared,
    nodes: { same: sameNodes, inCurrent: nodesInFirstSetOnly, inCompared: nodesInSecondSetOnly },
    edges: { same: sameEdges, inCurrent: edgesInFirstSetOnly, inCompared: edgesInSecondSetOnly },
    parents: parentList,
    changedRoles: roleChangedNodeList
  }
  
  return changeObj
}

const getPackageLevelChanges = (currentVersion, versionToBeCompared, package) => {
  let packages = elements.nodes.filter(n => n.data.parent == package && n.data.role == undefined && (n.data.version == currentVersion || n.data.version == versionToBeCompared))
  packages = _.map(packages, 'data.id')
  let packageList = []
  packageList.push(package)
  packageList = _.union(packageList, packages)
  // search subpackages of subpackages
  while(packages.length != 0) {
    let subPackages = elements.nodes.filter(n => _.includes(packages, n.data.parent) && n.data.role == undefined && (n.data.version == currentVersion || n.data.version == versionToBeCompared))
    packageList = _.union(packageList, _.map(subPackages, 'data.id'))
    packages = _.map(subPackages, 'data.id')
  }

  const currentNodesInPackage = elements.nodes.filter(n => _.includes(packageList, n.data.parent) && n.data.role != undefined && n.data.version == currentVersion)
  const currentEdges = elements.edges.filter(n => (n.data.source.indexOf(package + '.') == 0 || n.data.target.indexOf(package + '.') == 0) && n.data.version == currentVersion)
  let currentNodesId = _.union(_.uniq(currentEdges.map(e => e.data.source)), _.uniq(currentEdges.map(e => e.data.target)), currentNodesInPackage.map(e => e.data.id))
  const currentNodes = elements.nodes.filter(n => _.includes(currentNodesId, n.data.id) && n.data.role != undefined && n.data.version == currentVersion)

  const comparedNodesInPackage = elements.nodes.filter(n => _.includes(packageList, n.data.parent) && n.data.role != undefined && n.data.version == versionToBeCompared)
  const comparedEdges = elements.edges.filter(n => (n.data.source.indexOf(package + '.') == 0 || n.data.target.indexOf(package + '.') == 0) && n.data.version == versionToBeCompared)
  let comparedNodesId = _.union(_.uniq(comparedEdges.map(e => e.data.source)), _.uniq(comparedEdges.map(e => e.data.target)), comparedNodesInPackage.map(e => e.data.id))
  const comparedNodes = elements.nodes.filter(n => _.includes(comparedNodesId, n.data.id) && n.data.role != undefined && n.data.version == versionToBeCompared)

  // nodes
  // in both sets of nodes, included nodes for packages
  const sameNodes = currentNodes.filter(n1 => comparedNodes.some(n2 => n1.data.id == n2.data.id))
  // only in current set
  const nodesInFirstSetOnly = _.sortBy(currentNodes.filter(n1 => !comparedNodes.some(n2 => n1.data.id == n2.data.id)), ['data.id'])
  // only in set to be compared
  const nodesInSecondSetOnly = _.sortBy(comparedNodes.filter(n1 => !currentNodes.some(n2 => n1.data.id == n2.data.id)), ['data.id'])

  // parents
  let parents = []
  sameNodes.forEach(n => {
    let id = n.data.id
    while(getParentPackageName(id) != '' && !parents.includes(getParentPackageName(id))) {
      parents.push(getParentPackageName(id))
      id = getParentPackageName(id)
    }
  })
  nodesInFirstSetOnly.forEach(n => {
    let id = n.data.id
    while(getParentPackageName(id) != '' && !parents.includes(getParentPackageName(id))) {
      parents.push(getParentPackageName(id))
      id = getParentPackageName(id)
    }
  })
  nodesInSecondSetOnly.forEach(n => {
    let id = n.data.id
    while(getParentPackageName(id) != '' && !parents.includes(getParentPackageName(id))) {
      parents.push(getParentPackageName(id))
      id = getParentPackageName(id)
    }
  })
  parents = _.uniq(parents)
  let parentList = []
  parents.forEach(id => {
    const found = elements.nodes.find(n => n.data.id == id && (n.data.version == currentVersion || n.data.version == versionToBeCompared))
    parentList.push(found)
  })
  parentList = _.uniq(parentList)

  // edges 
  // in both sets of edges
  const sameEdges = currentEdges.filter(e1 => comparedEdges.some(e2 => e1.data.source == e2.data.source && e1.data.target == e2.data.target))
  // only in current set
  const edgesInFirstSetOnly = currentEdges.filter(e1 => !comparedEdges.some(e2 => e1.data.source == e2.data.source && e1.data.target == e2.data.target))
  // only in set to be compared
  const edgesInSecondSetOnly = comparedEdges.filter(e1 => !currentEdges.some(e2 => e1.data.source == e2.data.source && e1.data.target == e2.data.target))

  // role-changed classes
  const roleChangedNodes = currentNodes.filter(n1 => comparedNodes.some(n2 => n1.data.id == n2.data.id && n1.data.role != n2.data.role))

  // list of nodes with data of two roles
  let roleChangedNodeList = []
  roleChangedNodes.forEach( node => {
    const found = comparedNodes.find( n => n.data.id == node.data.id)
    let roleChangedNode = {}
    roleChangedNode.id = node.data.id
    roleChangedNode[node.data.version] =  node.data.role
    roleChangedNode[found.data.version] =  found.data.role
    roleChangedNodeList.push(roleChangedNode)
  })
  
  const changeObj = {
    from: currentVersion,
    to: versionToBeCompared,
    nodes: { same: sameNodes, inCurrent: nodesInFirstSetOnly, inCompared: nodesInSecondSetOnly },
    edges: { same: sameEdges, inCurrent: edgesInFirstSetOnly, inCompared: edgesInSecondSetOnly },
    parents: parentList,
    changedRoles: roleChangedNodeList
  }
  
  return changeObj
}

// // only show classes in specific package but not connected classes in other packages
// const getPackageLevelChanges = (currentVersion, versionToBeCompared, package) => {
//   let packages = elements.nodes.filter(n => n.data.parent == package && n.data.role == undefined && (n.data.version == currentVersion || n.data.version == versionToBeCompared))
//   packages = _.map(packages, 'data.id')
//   let packageList = []
//   packageList.push(package)
//   packageList = _.union(packageList, packages)
//   // search subpackages of subpackages
//   while(packages.length != 0) {
//     let subPackages = elements.nodes.filter(n => _.includes(packages, n.data.parent) && n.data.role == undefined && (n.data.version == currentVersion || n.data.version == versionToBeCompared))
//     packageList = _.union(packageList, _.map(subPackages, 'data.id'))
//     packages = _.map(subPackages, 'data.id')
//   }

//   const currentNodes = elements.nodes.filter(n => _.includes(packageList, n.data.parent) && n.data.role != undefined && n.data.version == currentVersion)
//   const currentEdges = elements.edges.filter(n => (n.data.source.indexOf(package + '.') == 0 && n.data.target.indexOf(package + '.') == 0) && n.data.version == currentVersion)

//   const comparedNodes = elements.nodes.filter(n => _.includes(packageList, n.data.parent) && n.data.role != undefined && n.data.version == versionToBeCompared)
//   const comparedEdges = elements.edges.filter(n => (n.data.source.indexOf(package + '.') == 0 && n.data.target.indexOf(package + '.') == 0) && n.data.version == versionToBeCompared)

//   // nodes
//   // in both sets of nodes, included nodes for packages
//   const sameNodes = currentNodes.filter(n1 => comparedNodes.some(n2 => n1.data.id == n2.data.id))
//   // only in current set
//   const nodesInFirstSetOnly = _.sortBy(currentNodes.filter(n1 => !comparedNodes.some(n2 => n1.data.id == n2.data.id)), ['data.id'])
//   // only in set to be compared
//   const nodesInSecondSetOnly = _.sortBy(comparedNodes.filter(n1 => !currentNodes.some(n2 => n1.data.id == n2.data.id)), ['data.id'])

//   // parents
//   let parents = []
//   sameNodes.forEach(n => {
//     let id = n.data.id
//     while(getParentPackageName(id) != '' && !parents.includes(getParentPackageName(id))) {
//       parents.push(getParentPackageName(id))
//       id = getParentPackageName(id)
//     }
//   })
//   nodesInFirstSetOnly.forEach(n => {
//     let id = n.data.id
//     while(getParentPackageName(id) != '' && !parents.includes(getParentPackageName(id))) {
//       parents.push(getParentPackageName(id))
//       id = getParentPackageName(id)
//     }
//   })
//   nodesInSecondSetOnly.forEach(n => {
//     let id = n.data.id
//     while(getParentPackageName(id) != '' && !parents.includes(getParentPackageName(id))) {
//       parents.push(getParentPackageName(id))
//       id = getParentPackageName(id)
//     }
//   })
//   parents = _.uniq(parents)
//   let parentList = []
//   parents.forEach(id => {
//     const found = elements.nodes.find(n => n.data.id == id && (n.data.version == currentVersion || n.data.version == versionToBeCompared))
//     parentList.push(found)
//   })
//   parentList = _.uniq(parentList)

//   // edges 
//   // in both sets of edges
//   const sameEdges = currentEdges.filter(e1 => comparedEdges.some(e2 => e1.data.source == e2.data.source && e1.data.target == e2.data.target))
//   // only in current set
//   const edgesInFirstSetOnly = currentEdges.filter(e1 => !comparedEdges.some(e2 => e1.data.source == e2.data.source && e1.data.target == e2.data.target))
//   // only in set to be compared
//   const edgesInSecondSetOnly = comparedEdges.filter(e1 => !currentEdges.some(e2 => e1.data.source == e2.data.source && e1.data.target == e2.data.target))

//   // role-changed classes
//   const roleChangedNodes = currentNodes.filter(n1 => comparedNodes.some(n2 => n1.data.id == n2.data.id && n1.data.role != n2.data.role))

//   // list of nodes with data of two roles
//   let roleChangedNodeList = []
//   roleChangedNodes.forEach( node => {
//     const found = comparedNodes.find( n => n.data.id == node.data.id)
//     let roleChangedNode = {}
//     roleChangedNode.id = node.data.id
//     roleChangedNode[node.data.version] =  node.data.role
//     roleChangedNode[found.data.version] =  found.data.role
//     roleChangedNodeList.push(roleChangedNode)
//   })
  
//   const changeObj = {
//     from: currentVersion,
//     to: versionToBeCompared,
//     nodes: { same: sameNodes, inCurrent: nodesInFirstSetOnly, inCompared: nodesInSecondSetOnly },
//     edges: { same: sameEdges, inCurrent: edgesInFirstSetOnly, inCompared: edgesInSecondSetOnly },
//     parents: parentList,
//     changedRoles: roleChangedNodeList
//   }
  
//   return changeObj
// }

const getClassLevelChanges = (currentVersion, versionToBeCompared, selectedClass) => {
  let currentNodeList = [], currentEdgeList = []
  // find first level edges
  let edges = elements.edges.filter(e => (e.data.version == currentVersion) && (e.data.source == selectedClass || e.data.target == selectedClass))
  // get first level nodes
  let nodes = _.union(_.uniq(edges.map(e => e.data.source)), _.uniq(edges.map(e => e.data.target)))
  currentEdgeList = edges
  currentNodeList = nodes
  // get second and third levels edges and nodes
  _.times(2, () => {
    edges = elements.edges.filter(e => (e.data.version == currentVersion) && (_.includes(nodes, e.data.source) || _.includes(nodes, e.data.target)))
    nodes = _.union(_.uniq(edges.map(e => e.data.source)), _.uniq(edges.map(e => e.data.target)))
    currentEdgeList = _.union(currentEdgeList, edges)
    currentNodeList = _.union(currentNodeList, nodes)
  })
  let currentNodes = [], currentEdges = currentEdgeList
  if(currentNodeList.length == 0) { // if no edges connected to the class at all
    const currentClassNode = elements.nodes.find( n => n.data.id == selectedClass && n.data.version == currentVersion)
    currentNodes.push(currentClassNode)
  } else {
    currentNodeList.forEach(nodeId => {
      const found = elements.nodes.find( n => n.data.id == nodeId && n.data.version == currentVersion)
      currentNodes.push(found)
    })
  }

  let comparedNodeList = [], comparedEdgeList = []
  // find first level edges
  edges = elements.edges.filter(e => (e.data.version == versionToBeCompared) && (e.data.source == selectedClass || e.data.target == selectedClass))
  // get first level nodes
  nodes = _.union(_.uniq(edges.map(e => e.data.source)), _.uniq(edges.map(e => e.data.target)))
  comparedEdgeList = edges
  comparedNodeList = nodes
  // get second and third levels edges and nodes
  _.times(2, () => {
    edges = elements.edges.filter(e => (e.data.version == versionToBeCompared) && (_.includes(nodes, e.data.source) || _.includes(nodes, e.data.target)))
    nodes = _.union(_.uniq(edges.map(e => e.data.source)), _.uniq(edges.map(e => e.data.target)))
    comparedEdgeList = _.union(comparedEdgeList, edges)
    comparedNodeList = _.union(comparedNodeList, nodes)
  })
  let comparedNodes = [], comparedEdges = comparedEdgeList
  if(comparedNodeList.length == 0) { // if no edges connected to the class at all
    const comparedClassNode = elements.nodes.find(n => n.data.id == selectedClass && n.data.version == versionToBeCompared)
    comparedNodes.push(comparedClassNode)
  } else {
    comparedNodeList.forEach(nodeId => {
      const found = elements.nodes.find(n => n.data.id == nodeId && n.data.version == versionToBeCompared)
      comparedNodes.push(found)
    })
  }

  // nodes
  // in both sets of nodes, included nodes for packages
  const sameNodes = currentNodes.filter(n1 => comparedNodes.some(n2 => n1.data.id == n2.data.id))
  // only in current set
  const nodesInFirstSetOnly = _.sortBy(currentNodes.filter(n1 => !comparedNodes.some(n2 => n1.data.id == n2.data.id)), ['data.id'])
  // only in set to be compared
  const nodesInSecondSetOnly = _.sortBy(comparedNodes.filter(n1 => !currentNodes.some(n2 => n1.data.id == n2.data.id)), ['data.id'])

  // parents
  let parents = []
  sameNodes.forEach(n => {
    let id = n.data.id
    while(getParentPackageName(id) != '' && !parents.includes(getParentPackageName(id))) {
      parents.push(getParentPackageName(id))
      id = getParentPackageName(id)
    }
  })
  nodesInFirstSetOnly.forEach(n => {
    let id = n.data.id
    while(getParentPackageName(id) != '' && !parents.includes(getParentPackageName(id))) {
      parents.push(getParentPackageName(id))
      id = getParentPackageName(id)
    }
  })
  nodesInSecondSetOnly.forEach(n => {
    let id = n.data.id
    while(getParentPackageName(id) != '' && !parents.includes(getParentPackageName(id))) {
      parents.push(getParentPackageName(id))
      id = getParentPackageName(id)
    }
  })
  parents = _.uniq(parents)
  let parentList = []
  parents.forEach(id => {
    const found = elements.nodes.find(n => n.data.id == id && (n.data.version == currentVersion || n.data.version == versionToBeCompared))
    parentList.push(found)
  })
  parentList = _.uniq(parentList)

  // edges 
  // in both sets of edges
  const sameEdges = currentEdges.filter(e1 => comparedEdges.some(e2 => e1.data.source == e2.data.source && e1.data.target == e2.data.target))
  // only in current set
  const edgesInFirstSetOnly = currentEdges.filter(e1 => !comparedEdges.some(e2 => e1.data.source == e2.data.source && e1.data.target == e2.data.target))
  // only in set to be compared
  const edgesInSecondSetOnly = comparedEdges.filter(e1 => !currentEdges.some(e2 => e1.data.source == e2.data.source && e1.data.target == e2.data.target))

  // role-changed classes
  const roleChangedNodes = currentNodes.filter(n1 => comparedNodes.some(n2 => n1.data.id == n2.data.id && n1.data.role != n2.data.role))

  // list of nodes with data of two roles
  let roleChangedNodeList = []
  roleChangedNodes.forEach(node => {
    const found = comparedNodes.find( n => n.data.id == node.data.id)
    let roleChangedNode = {}
    roleChangedNode.id = node.data.id
    roleChangedNode[node.data.version] =  node.data.role
    roleChangedNode[found.data.version] =  found.data.role
    roleChangedNodeList.push(roleChangedNode)
  })

  const changeObj = {
    from: currentVersion,
    to: versionToBeCompared,
    nodes: { same: sameNodes, inCurrent: nodesInFirstSetOnly, inCompared: nodesInSecondSetOnly },
    edges: { same: sameEdges, inCurrent: edgesInFirstSetOnly, inCompared: edgesInSecondSetOnly },
    parents: parentList,
    changedRoles: roleChangedNodeList
  }
  
  return changeObj
}

const getParentPackageName = (id) => {
  const index = id.lastIndexOf('.')
  return (index != -1) ? id.substring(0, index) : ''
}

const getPattern = (level, options) => {
  let results = []
  versions.forEach(v => {
    let eles = [], count = 0
    if(level == 1) {
      eles = _.filter(elements.nodes, n => n.data.version == v && _.includes(options[0], n.data.role))
      count = eles.length
    } else if(level == 2) {
      eles = _.filter(elements.edges, edge => edge.data.version == v && _.includes(options[0], edge.data.fromRole) && _.includes(options[1], edge.data.toRole))
      count = eles.length
    } else if(level == 3) {
      let edges = _.filter(elements.edges, edge => edge.data.version == v && _.includes(options[0], edge.data.fromRole) && _.includes(options[1], edge.data.toRole))
      if(edges.length > 0) {
        _.forEach(edges, edge => {
          let secondEdges = _.filter(elements.edges, n => n.data.version == v && edge.data.target == n.data.source && _.includes(options[2], n.data.toRole))
          if(secondEdges.length == 0) {
            edges = _.filter(edges, ele => ele != edge)
          } else {
            count += secondEdges.length
            eles = _.union(eles, secondEdges)
          }
        })
        eles = _.union(eles, edges)
      }
    }
    let found = {
      version: v,
      label: v.slice(0,10),
      // edges: eles,
      count: count
    }
    results.push(found)
  })
  return results
}

const getPatternRanking = (level, version) => {
  let index = versions.indexOf(version)
  let patternCountFile = __dirname + '/data/pattern-count.json'
  const patternCounts = JSON.parse(fs.readFileSync(patternCountFile))
  let results = []
  let found = patternCounts.filter(ele => ele.pattern.length == level)
  found.forEach(ele => {
    results.push({ pattern: ele.pattern, count: ele.counts[index] })
  })
  results.sort((a,b) => b.count - a.count)
  return results
}

// find all combinations of 1, 2 and 3 levels and get each count for all versions
// function savePatternCount() {
//   let roleArray = ['Controller', 'Coordinator', 'Information Holder', 'Interfacer', 'Service Provider', 'Structurer']
//   let oneLevelArray = _.chunk(roleArray, 1)
//   let twoLevels = [roleArray, roleArray]
//   let threeLevels = [roleArray, roleArray, roleArray]
//   let twoLevelCombinations = twoLevels.reduce((a, b) => a.reduce((r, v) => r.concat(b.map(w => [].concat(v, w))), []))
//   let threeLevelCombinations = threeLevels.reduce((a, b) => a.reduce((r, v) => r.concat(b.map(w => [].concat(v, w))), []))

//   let combined = _.union(oneLevelArray, twoLevelCombinations, threeLevelCombinations)
//   let results = []
//   combined.forEach(ele => results.push({ pattern: ele, counts: [] }))
//   versions.forEach(v => {
//     oneLevelArray.forEach(r => {
//       let found = _.filter(elements.nodes, n => n.data.version == v && n.data.role == r[0])
//       let matched = _.find(results, ele => ele.pattern == r)
//       matched.counts.push(found.length)
//     })
//     twoLevelCombinations.forEach(r => {
//       let found = _.filter(elements.edges, edge => edge.data.version == v && edge.data.fromRole == r[0] && edge.data.toRole == r[1])
//       let matched = _.find(results, ele => ele.pattern == r)
//       matched.counts.push(found.length)
//     })
//     threeLevelCombinations.forEach(r => {
//       let count = 0, edges = _.filter(elements.edges, edge => edge.data.version == v && edge.data.fromRole == r[0] && edge.data.toRole == r[1])
//       if(edges.length > 0) {
//         _.forEach(edges, edge => {
//           let secondEdges = _.filter(elements.edges, n => n.data.version == v && edge.data.target == n.data.source && n.data.toRole == r[2])
//           if(secondEdges.length == 0) {
//             edges = _.filter(edges, ele => ele != edge)
//           } else {
//             count += secondEdges.length
//           }
//         })
//       }
//       let matched = _.find(results, ele => ele.pattern == r)
//       matched.counts.push(count)
//     })
//   })
//   let data = JSON.stringify(results)
//   fs.writeFile(__dirname + '/data/pattern-count.json', data, e => {
//     if(e) {
//       throw e
//     }
//     console.log('Pattern data is saved to file.')
//   })
// }

const getRoleChangedClasses = (version) => {
  let list = []
  const nodes = elements.nodes.filter(n => n.data.version == version && n.data.role != undefined)
  nodes.forEach(n => {
    let roleList = getClassRoleList(n.data.id)
    let found = roleList.filter(ele => ele.role == n.data.role)
    if(found.length != roleList.length) {
      list.push(n.data.id)
    }
  })
  return list
}

// const getCommitMessage = (version) => {
  
// }

module.exports = router
