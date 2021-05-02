'use strict'

let cy, codeEditor
let level = 'system'
let selectedVersion, selectedPackage = '', selectedClass = ''
let versionElements = [], historyList = []
let roleMap = new Map([
    ['Controller', '#755194'], ['Coordinator', '#539967'], 
    ['Information Holder', '#BF3F6A'], ['Interfacer', '#E9AB45'],
    ['Service Provider', '#4D82B0'], ['Structurer', '#E6A1b2']
])

let currentLayoutName = 'klay'
let currentLabelVisibility = 'hideLabels'
let currentMetric = 'rolesOnly'

const elk = {
     name: 'elk',
     nodeDimensionsIncludeLabels: true,
     fit: true,
    //  ranker: 'longest-path',
     elk: {
         'algorithm': 'mrtree', // layered,  mrtree
         'spacing.nodeNode': 50,
        //  'layered.mergeEdges': 'false',
        //  'layered.mergeHierarchyEdges': 'false',
         // 'crossingMinimization.semiInteractive': true,
         'nodePlacement.strategy': 'NETWORK_SIMPLEX',
         // 'layered.wrapping.additionalEdgeSpacing': 50,
        //  'spacing.nodeNode': 20,
        //  'spacing.nodeNodeBetweenLayers': 25,
        //  'spacing.edgeNode': 25,
        //  'spacing.edgeNodeBetweenLayers': 20,
        //  'spacing.edgeEdge': 20,
        //  'spacing.edgeEdgeBetweenLayers': 15,
         // All options are available at http://www.eclipse.org/elk/reference.html
         // 'org.eclipse.elk.' can be dropped from the Identifier
         // Or look at demo-demo.js for an example.
         // Enums use the name of the enum e.g.
        //  'searchOrder': 'DFS'
         //
         // The main field to set is `algorithm`, which controls which particular
         // layout algorithm is used.
     },
 }

const klay = {
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
    start: () => setVisible('.loader', true, false),
    stop: () => setVisible('.loader', false, false)
}

const hierarchy = {
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
    start: () => setVisible('.loader', true, false),
    stop: () => setVisible('.loader', false, false)
}
let currentLayoutOptions = klay

document.addEventListener('DOMContentLoaded', async () => {
    axios.baseURL = 'localhost:3000'
    // axios.baseURL = 'https://visdemo.herokuapp.com'
    const versions = await getVersions()
    const versionIndex = versions.data.length - 1
    selectedVersion = versions.data[versionIndex]
    createTimeline()
    createGraph()
    createLegend()
    createInfo()
})

const createInfo = async () => {
    const userName = await getUsername()
    let username = userName.data
    let index = selectedVersion.lastIndexOf('-')
    let systemName = selectedVersion.slice(11, index)
    let fullCommitId = selectedVersion.slice(index + 1)
    let commitId = selectedVersion.slice(index + 1, index + 8)
    let commitDate = selectedVersion.slice(0, 10)
    document.querySelector('#info .system').textContent = systemName
    document.querySelector('#info .commit-date').textContent = 'on ' + commitDate
    let link = document.createElement('a')
    link.href = `https://github.com/${username}/${systemName}/tree/${fullCommitId}`
    link.textContent = commitId
    link.target = '_blank'
    document.querySelector('#info .commit-id').innerHTML = ''
    document.querySelector('#info .commit-id').appendChild(link)
    setVisible('#info', true, false)
}

const createTimeline = async () => {
    // remove existing timeline
    let timeline = document.querySelector('.roles')
    if(timeline != null) {
        timeline.parentNode.removeChild(timeline)
    }
    const versions = await getVersions()
    let roleList = []
    if(level === 'system') {
        roleList = await getSystemRoleList(selectedVersion)
    } else if(level === 'package') {
        roleList = await getPackageRoleList(selectedPackage)
    } else if(level === 'class') {
        roleList = await getClassRoleList(selectedClass)
    }
    let element, span, text
    let lastDiv = document.createElement('div')
    lastDiv.className = 'roles'
    _.forEach(versions.data, v => {
        element = document.createElement('div')
        element.className = 'role'
        span = document.createElement('span')
        span.className = 'tooltip'
        if(level === 'class') {
            const node = _.find(roleList.data, ['version', v])
            if(node === undefined) {
                element.style['background-color'] = '#dadad8'
                element.className = 'role hover-no-effect'
            } else {
                element.style['background-color'] = roleMap.get(node.role)
                span.addEventListener('click', () => {
                    if(timelineOption == 'switchVersion') {
                        initGraph(v, selectedPackage, selectedClass, currentLabelVisibility)
                    } else {
                        if(selectedVersion !== v) {
                            showChanges(selectedVersion, v)
                        }
                    }
                })
            }
        } else {
            const list = _.find(roleList.data, ['version', v])
            if(list === undefined) {
                element.style['background-color'] = '#dadad8'
                element.className = 'role hover-no-effect'
            } else if(list.role.length === 1) {
                element.style['background-color'] = roleMap.get(list.role[0])
            } else if(list.role.length === 2) {
                let color1 = roleMap.get(list.role[0])
                let color2 = roleMap.get(list.role[1])
                element.style['background-image'] = `linear-gradient(to right, ${color1} 50%, ${color2} 50%)`
            } else {
                let style = 'linear-gradient(to right'
                _.forEach(list.role, (r, i) => {
                    let color = roleMap.get(r)
                    let size = _.round(100 / list.role.length, 2)
                    style += `, ${color} ${size * i}%,  ${color} ${size * (i+1)}%`
                })
                style += ')'
                element.style['background-image'] = style
            }
            if(list !== undefined) {
                span.addEventListener('click', () => {
                    if(timelineOption == 'switchVersion') {
                        initGraph(v, selectedPackage, selectedClass, currentLabelVisibility)
                    } else {
                        if(selectedVersion !== v) {
                            showChanges(selectedVersion, v)
                        }
                    }
                })
            }
            if(level === 'package') {
                element.classList.add('role-package')
            } else if(level === 'system') {
                element.classList.add('role-version')
            }
        }
        span.setAttribute('data-text', v.slice(0, 10))
        element.appendChild(span)
        text = document.createElement('span')
        text.setAttribute('data-date', v.slice(0, 10))
        text.className = 'date'
        span.appendChild(text)
        lastDiv.appendChild(element)
    })
    document.querySelector('.timeline').appendChild(lastDiv)
    // current version indicator
    let currentEles = document.querySelectorAll(`[data-text='${selectedVersion.slice(0, 10)}']`)[0]
    currentEles.className = 'tooltip selected'
    currentEles.textContent = 'CURRENT'
    currentEles.parentNode.classList.add('selected-version')
}

const createGraph = async () => {
    const elements = await getElements(selectedVersion)
    const styles = await getStyles()
    versionElements = elements.data
    cy = cytoscape({
        container: document.getElementById('cy'),
        layout: currentLayoutOptions,
        minZoom: 0.1,
        hideEdgesOnViewport: true,
        motionBlur: true,
        boxSelectionEnabled: true,
        wheelSensitivity: 0.3,
        style: styles.data.style,
        elements: elements.data,
        ready: function() {
            addToHistory({ version: selectedVersion, package: '', class: '' })
            this.on('tap', async (e)  => {
                const target = e.target
                if (target === cy) {
                    initGraph(selectedVersion, '', '', 'hideLabels')
                }
            })
            this.on('tap', 'node', async (e) => {
                let target = e.target
                const id = target._private.data.id
                const version = target._private.data.version
                selectedVersion = version
                if(target.isParent()) {
                    initGraph(selectedVersion, id, '', 'showLabels')
                } else {
                    initGraph(selectedVersion, '', id, 'showLabels')
                }
            })
            this.on('tapdragover', 'node', (e) => {
                const target = e.target
                if(currentLabelVisibility == 'hideLabels') {
                    target.addClass('showLabel')
                }
                // hover on class
                if(!target.isParent()) {
                    let nodes = target.union(target.successors()).union(target.predecessors())
                    let parents = nodes.ancestors()
                    cy.elements().not(nodes).not(parents).addClass('hover')
                } else {
                    // hover on package
                    let nodes = target.descendants().neighborhood().union(target.descendants())
                    let parents = nodes.ancestors()
                    cy.elements().not(nodes).not(parents).addClass('hover')
                }
            })
            this.on('tapdragout', 'node', (e) => {
                const target = e.target
                if(currentLabelVisibility == 'hideLabels') {
                    target.removeClass('showLabel')
                }
                cy.elements().removeClass('hover')
            })
        }
    })
}

const initGraph = async (version, pkg, cls, labelVisibility) => {
    const elements = await getElements(version)
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
        // createTimeline(selectedVersion)
    } else if(cls === '') {
        level = 'package'
        document.querySelector('#info .package').textContent = selectedPackage
        document.querySelector('#info .class').textContent = ''
        document.querySelector('#info .class-id').classList.add('show')
        addToHistory({ version: selectedVersion, package: selectedPackage, class: '' })
        // createTimeline(selectedPackage)
    } else {
        level = 'class'
        let target = cy.$id(selectedClass)
        let index = selectedClass.lastIndexOf('.')
        let className = selectedClass.slice(index + 1)
        document.querySelector('#info .package').textContent = target._private.data.parent
        document.querySelector('#info .class').textContent = className
        document.querySelector('#info .class-id').classList.add('show')
        addToHistory({ version: selectedVersion, package: target._private.data.parent, class: className })
        // createTimeline(selectedClass)
    }
    createTimeline()
    if(!document.querySelector('#sourceCode').classList.contains('hide')) {
        showSourceCode('single')
    }
    createInfo()
    resetTools()
    updateGraph(labelVisibility)
}

const runlayout = () => {
    // cy.layout(elk).run()

    // var parentNodes = cy.nodes(':parent')
    // var layout = parentNodes.descendants().layout(elk)

    // layout.promiseOn('layoutstop').then(e => {
    //     var dagre_layout = parentNodes.layout({ 
    //         name: 'grid',
    //         nodeDimensionsIncludeLabels: true, 
    //         sort: function(a, b){ return a.data('id') - b.data('id') },
    //         avoidOverlap: true,
    //         fit: true
    //     })
    //     dagre_layout.run()
    // })
}

const updateGraph = (labelVisibility) => {
    document.querySelector('[data-option="hideLabels"]').className = ''
    document.querySelector('[data-option="showLabels"]').className = ''
    document.querySelector(`[data-option="${labelVisibility}"]`).classList.add('selected-option')
    switch(level) {
        case 'system':
            updateSystemGraph(labelVisibility)
            break
        case 'package':
            updatePackageGraph(labelVisibility)
            break
        case 'class':
            updateClassGraph(1, 'all', false, labelVisibility)
            break
    }
}

const updateSystemGraph = (labelVisibility) => {
    cy.startBatch()
    // decide nodes label visibility
    currentLabelVisibility = labelVisibility
    if(labelVisibility === 'showLabels') {
        cy.nodes().addClass('showLabel')
    } else {
        cy.nodes().removeClass('showLabel')
    }
    cy.endBatch()
    cy.layout(currentLayoutOptions).run()
}

const updateClassGraph = (dependencyLevel, edgeType, created, labelVisibility) => {
    document.querySelector('.dep-level .selected-option').classList.remove('selected-option')
    document.querySelector(`[data-option="${dependencyLevel}"]`).classList.add('selected-option')
    const target = cy.$id(selectedClass).addClass('selected')
    cy.startBatch()
    cy.elements().removeClass(['hide', 'showLabel'])
    cy.edges().removeClass(['first', 'second', 'third'])
    // first level edges and nodes
    const firstLvlEdges = target.connectedEdges()
    const firstLvlNodes = firstLvlEdges.connectedNodes().union(target)
    // second level edges
    const secondLvlEdges = firstLvlNodes.connectedEdges().not(firstLvlEdges)
    const secondLvlNodes = secondLvlEdges.connectedNodes()
    secondLvlEdges.addClass('second')
    // third level edges
    const thirdLvlEdges = secondLvlNodes.connectedEdges().not(firstLvlEdges).not(secondLvlEdges)
    const thirdLvlNodes = thirdLvlEdges.connectedNodes()
    thirdLvlEdges.addClass('third')
    // parent nodes
    const nodeList = firstLvlNodes.union(secondLvlNodes).union(thirdLvlNodes)
    const edgeList = firstLvlEdges.union(secondLvlEdges).union(thirdLvlEdges)
    const parents = nodeList.ancestors()
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
    // decide nodes label visibility
    currentLabelVisibility = labelVisibility
    if(labelVisibility === 'showLabels') {
        cy.nodes().addClass('showLabel')
    } else {
        cy.nodes().removeClass('showLabel')
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
    cy.layout(currentLayoutOptions).run()
    cy.nodes().unlock()
}

const updatePackageGraph = (labelVisibility) => {
    document.querySelector('[data-option="hideLabels"]').className = ''
    document.querySelector('[data-option="showLabels"]').className = ''
    document.querySelector(`[data-option="${labelVisibility}"]`).classList.add('selected-option')
    cy.startBatch()
    let target = cy.$id(selectedPackage)
    let nodes = target.descendants().neighborhood().union(target.descendants())
    let parents = nodes.ancestors()
    let edges = nodes.connectedEdges()
    cy.remove(cy.elements().not(nodes).not(parents).not(edges))
    // decide nodes label visibility
    currentLabelVisibility = labelVisibility
    if(labelVisibility === 'showLabels') {
        cy.nodes().addClass('showLabel')
    } else {
        cy.nodes().removeClass('showLabel')
    }
    cy.endBatch()
    cy.layout(currentLayoutOptions).run()
}
