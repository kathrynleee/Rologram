'use strict'

class Graph {
  cy
  currentLayoutOptions = klay

  klay = {
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
      nodePlacement:'SIMPLE',
      direction: 'DOWN', // UP, DOWN, LEFT, RIGHT
      edgeRouting: 'POLYLINE',
      edgeSpacingFactor: 0.3,
      layoutHierarchy: false
    },
    start: () => setVisible('.loader', true, false),
    stop: () => setVisible('.loader', false, false)
  }

  hierarchy = {
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
      nodePlacement:'SIMPLE',
      direction: 'DOWN', // UP, DOWN, LEFT, RIGHT
      edgeRouting: 'POLYLINE',
      edgeSpacingFactor: 0.1,
      layoutHierarchy: true
    },
    start: () => setVisible('.loader', true, false),
    stop: () => setVisible('.loader', false, false)
  }

  setLayoutOptions(option) {
    this.currentLayoutOptions = option
  }

  createGraph() {
  let elements = await getElements(selectedVersion)
  let styles = await getStyles()
  versionElements = elements.data
  cy = cytoscape({
    container: document.getElementById('cy'),
    layout: options,
    minZoom: 0.1,
    hideEdgesOnViewport: true,
    motionBlur: true,
    boxSelectionEnabled: true,
    style: styles.data.style,
    elements: elements.data,
    ready: function() {
        addToHistory({ version: selectedVersion, package: '', class: '' })
        this.on('tap', async (e)  => {
          const target = e.target
          if (target === cy) {
            initGraph(selectedVersion, '', '')
          }
        })
        this.on('tap', 'node', async (e) => {
          let target = e.target
          const id = target._private.data.id
          const version = target._private.data.version
          selectedVersion = version
          if(target.isParent()) {
            initGraph(selectedVersion, id, '')
          } else {
            initGraph(selectedVersion, '', id)
          }
        })
        this.on('tapdragover', 'node', (e) => {
          const target = e.target
          const labelVisibility = document.querySelector('.label-visibility .selected-option').getAttribute('data-option')
          if(!cy.nodes().hasClass('showLabel') || labelVisibility === 'hideLabels') {
            target.addClass('showLabel')
          }
          if(!target.isParent()) {
            let nodes = target.union(target.successors()).union(target.predecessors())
            let parents = nodes.ancestors()
            cy.elements().not(nodes).not(parents).addClass('hover')
          }
        })
        this.on('tapdragout', 'node', (e) => {
          const target = e.target
          const labelVisibility = document.querySelector('.label-visibility .selected-option').getAttribute('data-option')
          if(labelVisibility === 'hideLabels') {
            target.removeClass('showLabel')
          }
          cy.elements().removeClass('hover')
        })
      }
    })
  }

  initGraph(version, pkg, cls) {
    let elements = await getElements(version)
    versionElements = elements.data
    cy.remove(cy.elements())
    cy.add(versionElements)
    selectedVersion = version
    selectedPackage = pkg
    selectedClass = cls
    if(pkg === '' && cls === '') {
      level = 'system'
      document.querySelector('#info .class-id').classList.remove('show')
      document.querySelector('#info .package').textContent = ''
      document.querySelector('#info .class').textContent = ''
      addToHistory({ version: selectedVersion, package: '', class: '' })
      createTimeline(selectedVersion)
    } else if(cls === '') {
      level = 'package'
      document.querySelector('#info .package').textContent = selectedPackage
      document.querySelector('#info .class').textContent = ''
      document.querySelector('#info .class-id').classList.add('show')
      addToHistory({ version: selectedVersion, package: selectedPackage, class: '' })
      createTimeline(selectedPackage)
    } else {
      level = 'class'
      let target = cy.$id(selectedClass)
      let index = selectedClass.lastIndexOf('.')
      let className = selectedClass.slice(index + 1)
      document.querySelector('#info .package').textContent = target._private.data.parent
      document.querySelector('#info .class').textContent = className
      document.querySelector('#info .class-id').classList.add('show')
      addToHistory({ version: selectedVersion, package: target._private.data.parent, class: className })
      createTimeline(selectedClass)
    }
    if(!document.querySelector('#sourceCode').classList.contains('hide')) {
      showSourceCode()
    }
    createInfo()
    resetTools()
    updateGraph()
  }

  updateGraph() {
    switch(level) {
      case 'system':
        cy.layout(currentLayoutOptions).run()
        break
      case 'package':
        updatePackageGraph()
        break
      case 'class':
        updateClassGraph(1, 'all', false, currentLabelVisibility)
        break
    }
  }

  updateGraph() {
    switch(level) {
      case 'system':
        cy.layout(currentLayoutOptions).run()
        resizeNodes(currentMetric)
        break
      case 'package':
        updatePackageGraph()
        resizeNodes(currentMetric)
        break
      case 'class':
        updateClassGraph(1, 'all', false, currentLabelVisibility)
        resizeNodes(currentMetric)
        break
    }
  }

  updateClassGraph(dependencyLevel, edgeType, created, labelVisibility) {
    document.querySelector('.dep-level .selected-option').classList.remove('selected-option')
    document.querySelector(`[data-option="${dependencyLevel}"]`).classList.add('selected-option')
    document.querySelector('[data-option="hideLabels"]').className = ''
    document.querySelector('[data-option="showLabels"]').className = ''
    document.querySelector(`[data-option="${labelVisibility}"]`).classList.add('selected-option')
    let target = cy.$id(selectedClass).addClass('selected')
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
      secondLvlNodes.ancestors().removeClass('hide')
      secondLvlNodes.removeClass('hide')
      secondLvlEdges.removeClass('hide')
    }
    if(dependencyLevel === 3) {
      thirdLvlNodes.ancestors().removeClass('hide')
      thirdLvlNodes.removeClass('hide')
      thirdLvlEdges.removeClass('hide')
    }
    // decide nodes label visibility
    if(labelVisibility === 'showLabels') {
      cy.nodes().addClass('showLabel')
    } else {
      cy.nodes().removeClass('showLabel')
    }
    // display elements according to edge type
    if(edgeType === 'in') {
      cy.elements().not(target.predecessors()).not(target.predecessors().ancestors()).addClass('hide')
    } else if(edgeType === 'out') {
      cy.elements().not(target.successors()).not(target.successors().ancestors()).addClass('hide')
    }
    cy.endBatch()
    cy.layout(currentLayoutOptions).run()
  }

  updatePackageGraph() {
    cy.startBatch()
    let target = cy.$id(selectedPackage)
    let nodes = target.union(target.descendants())
    let parents = target.ancestors()
    let edges = nodes.connectedEdges()
    cy.remove(cy.elements().not(nodes).not(parents).not(edges))
    cy.endBatch()
    cy.layout(currentLayoutOptions).run()
  }
}