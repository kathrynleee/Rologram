'use strict'

let cy, codeEditor
let level = 'system'
let selectedVersion, selectedPackage, selectedClass
let versionElements = [], historyList = []
let roleMap = new Map([
    ['Controller', '#755194'], ['Coordinator', '#539967'], 
    ['Information Holder', '#bf3f6a'], ['Interfacer', '#E9AB45'],
    ['Service Provider', '#4d82b0'], ['Structurer', '#e6a1b2']
])
const options = {
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
        direction: 'DOWN',
        edgeRouting: 'POLYLINE',
        edgeSpacingFactor: 0.3,
        layoutHierarchy: false
    },
    start: () => setVisible('#loader', true),
    stop: () => setVisible('#loader', false)
}
let currentLayoutOptions = options

document.addEventListener('DOMContentLoaded', async () => {
    axios.baseURL = 'localhost:3000'
    const versions = await getVersions()
    // axios.baseURL = 'https://visdemo.herokuapp.com'
    const versionIndex = versions.data.length - 1
    selectedVersion = versions.data[versionIndex]
    createTimeline(selectedVersion)
    createGraph()
    createLegend()
    createInfo()
    // const dragger = new Dragdealer('slider', {
    //     steps: versions.data.length,
    //     callback: () => {
    //         alert(dragger.getStep())
    //     }
    // })
})

const createInfo = async () => {
    const paths = await getPaths()
    let ownerName = paths.data[0]
    let index = selectedVersion.lastIndexOf('-')
    let systemName = selectedVersion.slice(11, index)
    let fullCommitId = selectedVersion.slice(index + 1)
    let commitId = selectedVersion.slice(index + 1, index + 8)
    let commitDate = selectedVersion.slice(0, 10)
    document.querySelector('#info .system').textContent = systemName
    document.querySelector('#info .commit-date').textContent = 'on ' + commitDate
    let link = document.createElement('a')
    link.href = `https://github.com/${ownerName}/${systemName}/tree/${fullCommitId}`
    link.textContent = commitId
    link.target = '_blank'
    document.querySelector('#info .commit-id').appendChild(link)
    setVisible('#info', true)
}

const createTimeline = async (selected) => {
    document.getElementById('roles').innerHTML = ''
    const versions = await getVersions()
    let roleList = []
    if(level === 'system') {
        roleList = await getSystemRoleList(selected)
    } else if(level === 'package') {
        roleList = await getPackageRoleList(selected)
    } else if(level === 'class') {
        roleList = await getClassRoleList(selected)
    }
    let element, span, text
    _.forEach(versions.data, v => {
        element = document.createElement('div')
        element.className = 'role'
        span = document.createElement('span')
        span.className = 'tooltip'
        if(level === 'class') {
            const node = _.find(roleList.data, ['data.version', v])
            if(node === undefined) {
                element.style['background-color'] = '#a9b6c2'
                element.className = 'role hover-no-effect'
            } else {
                let role = node.data.role
                element.style['background-color'] = roleMap.get(role)
                span.addEventListener('click', () => {
                    // showChanges(v)
                    createIndicators(v)
                })
            }
        } else {
            const list = _.find(roleList.data, ['version', v])
            if(list.role.length === 0) {
                element.style['background-color'] = '#a9b6c2'
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
            if(list.role.length > 0) {
                span.addEventListener('click', () => {
                    // showChanges(v)
                    createIndicators(v)
                })
            }
        }
        span.setAttribute('data-text', v.slice(0, 10))
        element.appendChild(span)
        text = document.createElement('span')
        text.setAttribute('data-date', v.slice(0, 10))
        text.className = 'date'
        span.appendChild(text)
        document.getElementById('roles').appendChild(element)
    })
    // current version indicator
    let currentEles = document.querySelectorAll(`[data-text='${selectedVersion.slice(0, 10)}']`)[0]
    currentEles.className = 'tooltip selected'
    currentEles.textContent = 'CURRENT'
    currentEles.parentNode.classList.add('selected-version')
}

const createIndicators = (version) => {
    let selectedElements = document.getElementsByClassName('selected-version')
    while(selectedElements.length > 0){
        selectedElements[0].classList.remove('selected-version')
    }
    selectedElements = document.getElementsByClassName('selected')
    while(selectedElements.length > 0){
        selectedElements[0].textContent = ''
        let text = document.createElement('span')
        let date = selectedElements[0].getAttribute('data-text').slice(0, 10)
        text.setAttribute('data-date', date)
        text.className = 'date'
        selectedElements[0].appendChild(text)
        selectedElements[0].classList.remove('selected')
    }
    const indicators = document.getElementsByClassName('indicator')
    while(indicators.length > 0){
        indicators[0].parentNode.removeChild(indicators[0])
    }
    if(version !== selectedVersion) {
        // comparing version indicator
        let date = version.slice(0, 10)
        let eles = document.querySelectorAll(`[data-text='${date}']`)[0]
        eles.className = 'tooltip selected'
        eles.textContent = 'COMPARE'
        eles.parentNode.classList.add('selected-version')
        // current version indicator
        let currentEles = document.querySelectorAll(`[data-text='${selectedVersion.slice(0, 10)}']`)[0]
        currentEles.className = 'tooltip selected'
        currentEles.textContent = 'CURRENT'
        currentEles.parentNode.classList.add('selected-version')
    }
}

const createGraph = async () => {
    const elements = await getElements(selectedVersion)
    const styles = await getStyles()
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
            this.on('click', async (e)  => {
                resetTools()
                const target = e.target
                if (target === cy) {
                    selectedPackage = ''
                    selectedClass = ''
                    initGraph(selectedVersion, selectedPackage, selectedClass)
                }
            })
            this.on('tap', 'node', async (e) => {
                let target = e.target
                const id = target._private.data.id
                const version = target._private.data.version
                selectedVersion = version
                // target = cy.$id(selected)
                if(target.isParent()) {
                    selectedPackage = id
                    selectedClass = ''
                    initGraph(selectedVersion, selectedPackage, selectedClass)
                } else {
                    selectedPackage = ''
                    selectedClass = id
                    initGraph(selectedVersion, selectedPackage, selectedClass)
                }
            })
            this.on('mouseover', 'node', (e) => {
                const target = e.target
                const labelVisibility = document.querySelector('.label-visibility .selected-option').getAttribute('data-option')
                if(!cy.nodes().hasClass('showLabel') || labelVisibility === 'hideLabels') {
                    target.addClass('showLabel')
                }
            })
            this.on('mouseout', 'node', (e) => {
                const target = e.target
                const labelVisibility = document.querySelector('.label-visibility .selected-option').getAttribute('data-option')
                if(labelVisibility === 'hideLabels') {
                    target.removeClass('showLabel')
                }
            })
        }
    })
}

const initGraph = async (version, pkg, cls) => {
    const elements = await getElements(version)
    versionElements = elements.data
    cy.remove(cy.elements())
    cy.add(versionElements)
    selectedVersion = version
    selectedPackage = pkg
    selectedClass = cls
    resetTools()
    if(pkg === '' && cls === '') {
        level = 'system'
        setVisible('#info .class-id', false)
        document.querySelector('#info .package').textContent = ''
        document.querySelector('#info .class').textContent = ''
        addToHistory({ version: selectedVersion, package: '', class: '' })
        createTimeline(selectedVersion)
    } else if(cls === '') {
        level = 'package'
        document.querySelector('#info .package').textContent = selectedPackage
        document.querySelector('#info .class').textContent = ''
        setVisible('#info .class-id', true, 'flex')
        addToHistory({ version: selectedVersion, package: selectedPackage, class: '' })
        createTimeline(selectedPackage)
    } else {
        level = 'class'
        let target = cy.$id(selectedClass)
        let index = selectedClass.lastIndexOf('.')
        let className = selectedClass.slice(index + 1)
        document.querySelector('#info .package').textContent = target._private.data.parent
        document.querySelector('#info .class').textContent = className
        setVisible('#info .class-id', true, 'flex')
        addToHistory({ version: selectedVersion, package: target._private.data.parent, class: className })
        createTimeline(selectedClass)
        if(document.querySelector('#sourceCode').style.display != 'none') {
            showSourceCode()
        }
    }
    updateGraph()
}

const updateGraph = () => {
    switch(level) {
        case 'system':
            cy.layout(options).run()
            break
        case 'package':
            updatePackageGraph()
            break
        case 'class':
            updateClassGraph(1, 'all', false, 'showLabels')
            break
    }
}

const updateClassGraph = (dependencyLevel, edgeType, created, labelVisibility) => {
    document.querySelector(`[data-option="${labelVisibility}"]`).classList.add('selected-option')
    if(labelVisibility === 'showLabels') {
        document.querySelector('[data-option="hideLabels"]').className = ''
    } else {
        document.querySelector('[data-option="showLabels"]').className = ''
    }
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

const updatePackageGraph = () => {
    cy.startBatch()
    const target = cy.$id(selectedPackage)
    const nodes = target.union(target.descendants())
    const parents = target.ancestors()
    const edges = nodes.connectedEdges()
    cy.remove(cy.elements().not(nodes).not(parents).not(edges))
    cy.endBatch()
    cy.layout(currentLayoutOptions).run()
}
