'use strict'
import _ from 'lodash'
import cytoscape from 'cytoscape'
import klay from 'cytoscape-klay'
import 'klayjs/klay.js'
cytoscape.use(klay)
import api from './api.js'
import dom from './update.js'
import tools from './tools.js'
import slider from './slider.js'

let Graph = {
  klay: {
    name: 'klay',
    nodeDimensionsIncludeLabels: true, 
    fit: true,
    animate: 'end',
    animationDuration: 500,
    animationEasing: 'spring(500, 50)',
    klay: {
        borderSpacing: 20, // spacing between compound nodes
        spacing: 20, // spacing between nodes
        compactComponents: true,
        nodePlacement: 'SIMPLE',
        direction: 'DOWN',
        edgeRouting: 'POLYLINE',
        edgeSpacingFactor: 0.3,
        layoutHierarchy: false
    },
    start: () => dom.showLoader(),
    stop: () => dom.hideLoader()
  },

  hierarchy: {
    name: 'klay',
    nodeDimensionsIncludeLabels: true, 
    fit: true,
    animate: 'end',
    animationDuration: 500,
    animationEasing: 'spring(500, 50)',
    klay: {
      borderSpacing: 20, // spacing between compound nodes
      spacing: 15, // spacing between nodes
      compactComponents: true,
      nodePlacement: 'SIMPLE',
      direction: 'DOWN', // UP, DOWN, LEFT, RIGHT
      edgeRouting: 'POLYLINE',
      edgeSpacingFactor: 0.1,
      layoutHierarchy: true
    },
    start: () => dom.showLoader(),
    stop: () => dom.hideLoader()
  },

  runLayout(cy, layout) {
    dom.showLoader()
    if(layout == 'klay') {
      cy.layout(this.klay).run()
    } else {
      cy.layout(this.hierarchy).run()
    }
  },

  async createGraph(data) {
    // get styles for graph
    let styles = await api.getStyles()
    data.cy = cytoscape({
      container: document.getElementById('cy'),
      // layout: this.klay,
      minZoom: 0.1,
      hideEdgesOnViewport: true,
      motionBlur: true,
      boxSelectionEnabled: true,
      wheelSensitivity: 0.3,
      style: styles.data.style,
      elements: []
    })
    let cy = data.cy
    cy.on('tap', async (e) => {
      let target = e.target
      if (target === cy) {
        data.selectedPackage = ''
        data.selectedClass = ''
        data = dom.reset(data)
        this.init(data)
      }
    })
    cy.on('tap', 'node', async (e) => {
      let target = e.target
      let id = target._private.data.id
      data.selectedVersion = target._private.data.version
      if(target.isParent()) {
        data.selectedPackage = id
        data.selectedClass = ''
      } else {
        data.selectedPackage = ''
        data.selectedClass = id
      }
      data = dom.reset(data)
      this.init(data)
    })
    cy.on('mouseover', 'node', (e) => {
      let target = e.target
      if(data.options.labelVisibility == 'hideLabels') {
        target.addClass('showLabel')
      }
      // hover on class
      if(!target.isParent()) {
        let nodes = target.union(target.successors()).union(target.predecessors())
        let parents = nodes.ancestors()
        cy.elements().not(nodes).not(parents).addClass('hover')
        if(data.options.edgeVisibility == 'hideEdges') {
          cy.edges().removeClass('hideEdge')
        }
      } else {
        // hover on package
        let nodes = target.descendants().neighborhood().union(target.descendants())
        let parents = nodes.ancestors()
        cy.elements().not(nodes).not(parents).addClass('hover')
      }
    })
    cy.on('mouseout', 'node', (e) => {
      let target = e.target
      if(data.options.labelVisibility == 'hideLabels') {
        target.removeClass('showLabel')
      }
      if(data.options.edgeVisibility == 'hideEdges') {
        cy.edges().addClass('hideEdge')
      }
      cy.elements().removeClass('hover')
    })
  },

  async init(data) {
    dom.showLoader()
    let cy = data.cy
    cy.remove(cy.elements())
    // get elements and add to cy
    let elements = await api.getElements(data.selectedVersion)
    cy.add(elements.data)
    // create header
    dom.createInfo(data.system.username, data.selectedVersion)
    dom.clearInfo()
    // update level, history list and package/class info
    if(data.selectedPackage === '' && data.selectedClass === '') {
      data.level = 'system'
      let record = { version: data.selectedVersion, package: '', class: '' }
      data.historyList.push(record)
      dom.updateHistoryList(data, record)
      dom.showDependencyOptions(false)
    } else if(data.selectedClass === '') {
      data.level = 'package'
      dom.updateInfo(data.selectedPackage, '')
      let record = { version: data.selectedVersion, package: data.selectedPackage, class: '' }
      data.historyList.push(record)
      dom.updateHistoryList(data, record)
      dom.showDependencyOptions(false)
    } else {
      data.level = 'class'
      let target = cy.$id(data.selectedClass)
      let packageName = target._private.data.parent
      let index = data.selectedClass.lastIndexOf('.')
      let className = data.selectedClass.slice(index + 1)
      dom.updateInfo(packageName, className)
      let record = { version: data.selectedVersion, package: packageName, class: className }
      data.historyList.push(record)
      dom.updateHistoryList(data, record)
      dom.showDependencyOptions(true)
    }
    // get role list for creation of timeline
    let roleList = []
    if(data.level === 'system') {
      roleList = await api.getSystemRoleList(data.selectedVersion)
    } else if(data.level === 'package') {
      roleList = await api.getPackageRoleList(data.selectedPackage)
    } else if(data.level === 'class') {
      roleList = await api.getClassRoleList(data.selectedClass)
    }
    dom.createTimeline(data, roleList.data)
    slider(data, roleList.data)
    // update source code
    data.options.codeViewing = 'single'
    tools.updateCode(data.selectedVersion, data.selectedClass, data.options.codeViewing)
    // update graph
    this.updateGraph(data)
  },

  updateGraph(data) {
    switch(data.level) {
      case 'system':
        // default hide node labels for system level
        data.options.labelVisibility = 'hideLabels'
        dom.updateLabelVisibility('hideLabels') // update label visibility options in settings
        // default hide edges for system level
        data.options.edgeVisibility = 'hideEdges'
        dom.updateEdgeVisibility('hideEdges')
        this.updateSystemGraph(data)
        break
      case 'package':
        // default show node labels for package level
        data.options.labelVisibility = 'showLabels'
        dom.updateLabelVisibility('showLabels') // update label visibility options in settings
        // default show edges for package level
        data.options.edgeVisibility = 'showEdges'
        dom.updateEdgeVisibility('showEdges')
        this.updatePackageGraph(data)
        break
      case 'class':
        // default show node labels and all edges, and dependency level is set to 1 for class level
        data.options.labelVisibility = 'showLabels'
        dom.updateLabelVisibility('showLabels') // update label visibility options in settings
        data.options.edgeVisibility = 'showEdges'
        dom.updateEdgeVisibility('showEdges')
        data.options.dependencyLevel = 1
        data.options.edgeType = 'all'
        this.updateClassGraph(data, false)
        break
    }
    this.resizeNodes(data.cy, data.options.metric, data.options.layout)
  },

  updateSystemGraph(data) {
    let cy = data.cy
    this.updateNodeLabelVisibility(cy, data.options.labelVisibility, data.options.layout)
    this.updateEdgeVisibility(cy, data.options.edgeVisibility, data.options.layout)
  },

  updatePackageGraph(data) {
    let cy = data.cy
    cy.startBatch()
    let target = cy.$id(data.selectedPackage).addClass('selected')
    let nodes = target.descendants().neighborhood().union(target.descendants())
    let parents = nodes.ancestors()
    let edges = nodes.connectedEdges()
    cy.remove(cy.elements().not(nodes).not(parents).not(edges))
    cy.endBatch()
    this.updateNodeLabelVisibility(cy, data.options.labelVisibility, data.options.layout)
    this.updateEdgeVisibility(cy, data.options.edgeVisibility, data.options.layout)
  },

  updateClassGraph(data, created) {
    let cy = data.cy
    let dependencyLevel = data.options.dependencyLevel
    let edgeType = data.options.edgeType
    dom.updateDependencyLevel(dependencyLevel)
    let target = cy.$id(data.selectedClass).addClass('selected')
    cy.startBatch()
    cy.elements().removeClass(['hide', 'showLabel'])
    cy.edges().removeClass(['first', 'second', 'third'])
    // first level edges and nodes
    let firstLvlEdges = target.connectedEdges()
    let firstLvlNodes = firstLvlEdges.connectedNodes().union(target)
    // second level edges
    let secondLvlEdges = firstLvlNodes.connectedEdges().not(firstLvlEdges)
    let secondLvlNodes = secondLvlEdges.connectedNodes()
    secondLvlEdges.addClass('second')
    // third level edges
    let thirdLvlEdges = secondLvlNodes.connectedEdges().not(firstLvlEdges).not(secondLvlEdges)
    let thirdLvlNodes = thirdLvlEdges.connectedNodes()
    thirdLvlEdges.addClass('third')
    // parent nodes
    let nodeList = firstLvlNodes.union(secondLvlNodes).union(thirdLvlNodes)
    let edgeList = firstLvlEdges.union(secondLvlEdges).union(thirdLvlEdges)
    let parents = nodeList.ancestors()
    if(!created) {
      cy.remove(cy.elements().not(nodeList).not(edgeList).not(parents))
    }
    // display elements according to dependency level
    cy.elements().not(firstLvlEdges).not(firstLvlNodes).not(firstLvlNodes.ancestors()).addClass('hide')
    if(dependencyLevel > 1) {
      firstLvlEdges.addClass('first')
      firstLvlEdges.lock()
      secondLvlNodes.ancestors().removeClass('hide')
      secondLvlNodes.removeClass('hide')
      secondLvlEdges.removeClass('hide')
    }
    if(dependencyLevel === 3) {
      firstLvlEdges.lock()
      secondLvlNodes.lock()
      thirdLvlNodes.ancestors().removeClass('hide')
      thirdLvlNodes.removeClass('hide')
      thirdLvlEdges.removeClass('hide')
    }
    // display elements according to edge type
    if(edgeType === 'in') {
      let nodes = target.union(target.predecessors())
      let parents = nodes.ancestors()
      cy.elements().not(nodes).not(parents).addClass('hide')
    } else if(edgeType === 'out') {
      let nodes = target.union(target.successors())
      let parents = nodes.ancestors()
      cy.elements().not(nodes).not(parents).addClass('hide')
    }
    cy.endBatch()
    this.updateNodeLabelVisibility(cy, data.options.labelVisibility, data.options.layout)
    this.updateEdgeVisibility(cy, data.options.edgeVisibility, data.options.layout)
    cy.nodes().unlock()
  },

  updateNodeLabelVisibility(cy, labelVisibility, layout) {
    cy.startBatch()
    if(labelVisibility === 'showLabels') {
      cy.nodes().addClass('showLabel')
    } else {
      cy.nodes().removeClass('showLabel')
    }
    cy.endBatch()
    this.runLayout(cy, layout)
  },

  updateEdgeVisibility(cy, edgeVisibility, layout) {
    cy.startBatch()
    if(edgeVisibility === 'hideEdges') {
      cy.edges().addClass('hideEdge')
    } else {
      cy.edges().removeClass('hideEdge')
    }
    cy.endBatch()
    this.runLayout(cy, layout)
  },

  moveGraph() {
    cy.fit()
    // shift graph to left
    cy.panBy({ x: -200, y: 0 })
  },

  removeHoverLegend(cy) {
    cy.elements().removeClass(['hover', 'hover-selected'])
  },
  
  hoverLegend(cy, role) {
    let nodes = cy.elements(`node[role="${role}"]`)
    let parents = nodes.ancestors()
    nodes.addClass('hover-selected')
    cy.elements().not(nodes).not(parents).addClass('hover')
  },

  resizeNodes(cy, option, layout) {
    dom.showLoader()
    cy.startBatch()
    if(option === 'rolesOnly') {
      cy.nodes().not(':parent').style({
        'height' : 30,
        'width' : 30
      })
    } else {
      cy.nodes().not(':parent').style({
        'height' : (node) => {
          let loc = _.toInteger(node.data('loc'))
          let size = 2 * _.round(Math.sqrt(loc))
          return size
        },
        'width' : (node) => {
          let loc = _.toInteger(node.data('loc'))
          let size = 2 * _.round(Math.sqrt(loc))
          return size
        }
      })
    }
    cy.endBatch()
    this.runLayout(cy, layout)
  },

  filterRole(cy, filterRoleList, layout) {
    cy.startBatch()
    cy.elements().removeClass('filter')
    if(filterRoleList.length != 6) {
      let nodeSelector = ''
      filterRoleList.forEach(ele => {
        if(nodeSelector == '') {
          nodeSelector += `[role="${ele}"]`
        } else {
          nodeSelector += `,[role="${ele}"]`
        }
      })
      let filteredNodes = cy.nodes().not(nodeSelector).not(':parent')
      filteredNodes.addClass('filter')
      filteredNodes.connectedEdges().addClass('filter')
    }
    cy.endBatch()
    this.runLayout(cy, layout)
  },

  async showChangedClass(cy, version, option) {
    cy.startBatch()
    if(option ==='highlightOn') {
      let roleChangedClassList = await api.getRoleChangedClass(version)
      roleChangedClassList.data.forEach(ele => {
        cy.$id(ele).addClass('highlight')
      })
      // flash the border three times and stop
      _.times(3, () => {
        cy.nodes('.highlight')
          .animate({
            style: { 'border-opacity': '0' }
          })
          .delay(500)
          .animate({
            style: { 'border-opacity': '1' }
          })
      })
      setTimeout(function(){
        dom.updateClassHighlight('highlightOff')
        cy.nodes().removeClass('highlight')
      }, 5000)
    } else {
      cy.nodes().removeClass('highlight')
    }
    cy.endBatch()
  },

  removePattern(cy, layout) {
    cy.startBatch()
    cy.elements().removeClass('hide')
    cy.endBatch()
    this.runLayout(cy, layout)
  },

  applyPatternToGraph(cy, level, options, layout) {
    cy.startBatch()
    if(level == 1) {
      let pattern = _.map(options[0], n => `[role = "${n}"]`)
      let nodes = cy.nodes().filter(`${pattern}`)
      let edges = nodes.connectedEdges()
      let parents = (nodes != undefined) ? nodes.ancestors() : []
      cy.elements().not(nodes).not(edges).not(parents).addClass('hide')
    } else if(level == 2) {
      let edges = cy.edges().filter(edge => _.includes(options[0], edge.data('fromRole')) && _.includes(options[1], edge.data('toRole')))
      let nodes = edges.connectedNodes()
      let parents = (nodes != undefined) ? nodes.ancestors() : []
      cy.elements().not(nodes).not(edges).not(parents).addClass('hide')
    } else if(level == 3) {
      let edges = cy.edges().filter(edge => _.includes(options[0], edge.data('fromRole')) && _.includes(options[1], edge.data('toRole')))
      _.forEach(edges, edge => {
        let secondEdges = cy.edges().filter(ele => (ele.data('source') == edge.data('target')) && _.includes(options[2], ele.data('toRole')))
        if(secondEdges.length == 0) {
          edges = edges.filter(ele => ele != edge)
        } else {
          edges = secondEdges.union(edges)
        }
      })
      let nodes = edges.connectedNodes()
      let parents = (nodes != undefined) ? nodes.ancestors() : []
      cy.elements().not(nodes).not(edges).not(parents).addClass('hide')
    }
    cy.endBatch()
    this.runLayout(cy, layout)
  },

  updateChangeListView(cy, type, layout) {
    dom.showLoader()
    cy.startBatch()
    cy.elements().removeClass('hide')
    switch(type) {
      case 'all':
        cy.nodes('.changedRole').addClass('faded')
        break
      case 'removed':
        cy.elements('[status="added"], [status="same"]').addClass('hide')
        cy.nodes(':parent').not(cy.elements('[status="removed"]').ancestors()).addClass('hide')
        break
      case 'added':
        cy.elements('[status="removed"], [status="same"]').addClass('hide')
        cy.nodes(':parent').not(cy.elements('[status="added"]').ancestors()).addClass('hide')
        break
      case 'role-changed':
        cy.elements('[status="removed"], [status="added"]').addClass('hide')
        cy.elements('[status="same"]').not('.changedRole').addClass('hide')
        cy.nodes(':parent').not(cy.elements('.changedRole').ancestors()).addClass('hide')
        cy.nodes('.changedRole').removeClass('faded')
        break
    }
    cy.endBatch()
    this.runLayout(cy, layout)
  },

  clickChangeListItem(cy, level, id, layout) {
    if(level == 'system') {
      cy.nodes('.showLabel').removeClass('showLabel')
      cy.$id(id).addClass('showLabel')
    }
    if(level == 'class' && cy.$id(id).hasClass('hide')) {
      cy.startBatch()
      cy.elements().removeClass('hide')
      cy.nodes('.changedRole').addClass('faded')
      cy.endBatch()
      let cyLayout
      if(layout == 'klay') {
        cyLayout = cy.layout(this.klay).run()
      } else {
        cyLayout = cy.layout(this.hierarchy).run()
      }
      cyLayout.promiseOn('layoutstop').then(e => {
        cy.zoom(1.3)
        cy.center(cy.$id(id))
      })
      cyLayout.run()
    } else {
      cy.fit()
      cy.zoom(1.3)
      cy.center(cy.$id(id))
    }
  }
}

export default Graph