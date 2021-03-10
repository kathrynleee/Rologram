let cy
let selectedClass, selectedPackage, selectedVersion
let classChanges = []
let versionElements = []
let level = 'system'
let roleMap = new Map([
    ['Controller', '#755194'], ['Coordinator', '#539967'],
    ['Interfacer', '#E9AB45'], ['Information Holder', '#bf3f6a'],
    ['Service Provider', '#4d82b0'], ['Structurer', '#e6a1b2']
])

document.addEventListener('DOMContentLoaded', () => {
    axios.baseURL = 'localhost:3000'
    // axios.baseURL = 'https://visdemo.herokuapp.com'
    createVersionList()
    createGraph()
    createLegend()
})

const createLegend = () => {
    let element, sub, text
    for (let role of roleMap.keys()) {
        element = document.createElement('div')
        element.className = 'legendRole'
        sub = document.createElement('div')
        sub.className = 'legendCircle'
        sub.addEventListener('mouseover', () => {
            hoverLegend(role)
        })
        sub.addEventListener('mouseout', () => {
            removeHoverLegend()
        })
        sub.style['background-color'] = roleMap.get(role)
        element.appendChild(sub)
        text = document.createElement('div')
        text.className = 'legendText'
        text.innerHTML = role
        element.appendChild(text)
        document.getElementById('legend').appendChild(element)
    }
}

const removeHoverLegend = () => {
    cy.elements().removeClass('hover')
}

const hoverLegend = (role) => {
    const nodes = cy.elements(`node[role="${role}"]`)
    const parents = nodes.ancestors()
    cy.elements().not(nodes).not(parents).addClass('hover')
}

const clearClassInfo = () => {
    document.getElementById('selectedClass').innerHTML = ''
    document.getElementById('roles').innerHTML = ''
}

const createClassRoleTimeline = async (id) => {
    const roleList = await getClassRoleList(id)
    const versions = await getVersions()
    let element, span, role
    document.getElementById('roles').innerHTML = ''
    document.getElementById('selectedClass').innerHTML = id
    _.forEach(versions.data, v => {
        element = document.createElement('div')
        span = document.createElement('span')
        const node = _.find(roleList.data, ['data.version', v])
        if(node == undefined) {
            element.style['background-color'] = '#a9b6c2'
        } else {
            role = node.data.role
            element.style['background-color'] = roleMap.get(role)
            span.addEventListener('click', () => {
                showClassChanges(v)
            })
        }
        element.className = 'role'
        span.className = 'tooltip'
        span.setAttribute('data-text', v.slice(0, 10))
        element.appendChild(span)
        document.getElementById('roles').appendChild(element)
    })
}

const updateVersion = async () => {
    clearClassInfo()
    selectedVersion = document.getElementById('versionList').value
    const elements = await getElements(selectedVersion)
    versionElements = elements.data
    cy.remove(cy.elements())
    cy.add(elements.data)
    cy.layout(options).run()
}

// const showSlider = async () => {
//     document.getElementsByClassName("slider")[0].style['display'] = 'block'
// }

const showClassChanges = v => {
    const change = _.find(classChanges, ['version', v])
    console.log(change)
    cy.remove(cy.elements())
    cy.add(versionElements)
    cy.add(change.addedNodes)
    cy.add(change.addedEdges)
    cy.add(change.addedParents)
    cy.add(change.removedParents)

    const classNode = _.find(change.addedNodes, ['data.id', selectedClass])
    const selected = cy.elements(`node[id="${selectedClass}"]`)
    if(classNode !== undefined) {
        const color = roleMap.get(classNode.data.role)
        selected.style({ 'background-color': color, 'color': color })
    }
    let firstLvlNodes = selected.outgoers().union(selected.incomers())
    let secondLvlNodes = firstLvlNodes.outgoers().union(firstLvlNodes.incomers())
    let thirdLvlNodes = secondLvlNodes.outgoers().union(secondLvlNodes.incomers())
    const nodes = cy.elements(selected).union(firstLvlNodes).union(secondLvlNodes).union(thirdLvlNodes)
    nodes.addClass('faded')
    const parents = nodes.ancestors()
    nodes.addClass('showLabel')
    _.forEach(change.addedNodes, d => d.data['status'] = 'added')
    _.forEach(change.addedEdges, d => d.data['status'] = 'added')
    _.forEach(change.addedParents, d => d.data['status'] = 'added')
    cy.elements('[status="added"]').addClass('added')
    selected.addClass(['selected', 'showLabel'])

    _.forEach(change.removedNodes, d => 
        cy.elements('node[id="' + d.data.id + '"]').addClass('removed')
    )
    _.forEach(change.removedEdges, d => 
        cy.elements('edge[source="' + d.data.source + '"][target="' + d.data.target + '"]').addClass('removed')
    )
    cy.elements().not(selected).not(nodes).not(parents).addClass('hide')
    cy.layout(options).run()
}

const getAllClassChanges = async () => {
    const changes = await getClassChangesList()
    classChanges = changes.data
}

const createGraph = async () => {
    const versions = await getVersions()
    const versionIndex = versions.data.length - 1
    selectedVersion = versions.data[versionIndex]
    document.getElementById("versionList").selectedIndex = versionIndex
    const elements = await getElements(selectedVersion)
    versionElements = elements.data
    const styles = await getStyles()

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
            this.on('click', (e)  => {
                const target = e.target
                // To-do: change back node color for role-changed class
                // console.log(selectedClass)
                // if(selectedClass != undefined) {
                //     const selected = cy.elements(`node[id="${selectedClass}"]`)
                //     const node = _.find(versionElements.nodes, ['data.id', selectedClass])
                //     const color = roleMap.get(node.data.role)
                //     selected.style({ 'background-color': color, 'color': color })
                // }
                if (target === cy) {
                    clearClassInfo()
                    cy.remove(cy.elements('.removed, .added'))
                    level = 'system'
                    selectedClass = ''
                    selectedPackage = ''
                    cy.elements().removeClass(['hide', 'showLabel', 'selected', 'hover', 'faded'])
                    cy.layout(options).run()
                }
            })
            this.on('tap', 'node', (e) => {
                const target = e.target
                const isNotExisted = target.hasClass('removed') || target.hasClass('added')
                console.log(isNotExisted)
                if(!isNotExisted) {
                    cy.elements().removeClass(['hide', 'selected', 'showLabel', 'hover', 'faded'])
                    if(target.isParent()) {
                        clearClassInfo()
                        level = 'package'
                        selectedPackage = target._private.data.id
                        const nodes = target.union(target.descendants())
                        const parents = target.ancestors()
                        const edges = nodes.connectedEdges()
                        cy.remove(cy.elements('.removed, .added'))
                        nodes.addClass('showLabel')
                        cy.elements().not(nodes).not(parents).not(edges).addClass('hide')
                        cy.layout(options).run()
                    } else {
                        clearClassInfo()
                        level = 'class'
                        selectedClass = target._private.data.id
                        classChanges = []
                        createClassRoleTimeline(target._private.data.id)
                        getAllClassChanges()
                        // const edges = target.connectedEdges()
                        // const nodes = edges.connectedNodes().union(target)
                        let firstLvlNodes = target.outgoers().union(target.incomers())
                        let secondLvlNodes = firstLvlNodes.outgoers().union(firstLvlNodes.incomers())
                        let thirdLvlNodes = secondLvlNodes.outgoers().union(secondLvlNodes.incomers())
                        const nodes = cy.elements(target).union(firstLvlNodes).union(secondLvlNodes).union(thirdLvlNodes)
                        const parents = nodes.ancestors()
                        cy.remove(cy.elements('.removed, .added'))
                        target.addClass('selected')
                        nodes.addClass('showLabel')
                        cy.elements().not(nodes).not(parents).addClass('hide')
                        cy.layout(options).run()
                    }
                } else {
                    alert('Selected class/package does not exist in current version')
                }
            })
            this.on('mouseover', 'node', (e) => {
                const target = e.target
                if(target.isParent() === false) {
                    if(level === 'system') {
                        const nodes = target.union(target.successors()).union(target.predecessors())
                        const parents = nodes.ancestors()
                        target.addClass('showLabel')
                        cy.elements().not(nodes).not(parents).addClass('hover')
                    } else if(level === 'package') {
                        const nodes = target.union(target.successors()).union(target.predecessors())
                        const parents = nodes.ancestors()
                        cy.elements().not(nodes).not(parents).addClass('hover')
                    }
                } else {
                    if(level === 'system') {
                        cy.elements('edge').addClass('hover')
                    }
                }
            })
            this.on('mouseout', 'node', (e) => {
                const target = e.target
                if(target.isParent() === false) {
                    if(level === 'system') {
                        cy.elements().removeClass(['hover', 'showLabel'])
                    } else if(level === 'package') {
                        cy.elements().removeClass('hover')
                    }
                } else {
                    if(level === 'system') {
                        cy.elements('edge').removeClass('hover')
                    }
                }
            })
        }
    })
}

const createVersionList = async () => {
    const versions = await getVersions()
    const select = document.getElementById('versionList')
    versions.data.forEach(v => {
        let option = document.createElement('option')
        option.innerHTML = v.slice(0, 10)
        option.value = v
        select.append(option)
    })
}

const getVersions = async () => {
    try {
        return await axios.get( '/api/data/versions')
    } catch (e) {
        console.error(e)
    }
}

const getStyles = async () => {
    try {
        return await axios.get( '/api/data/styles')
    } catch (e) {
        console.error(e)
    }
}

const getElements = async (version) => {
    try {
        return await axios.get(`/api/data/elements/${version}`)
    } catch (e) {
        console.error(e)
    }
}

const getClassRoleList = async (id) => {
    try {
        return await axios.get(`/api/data/roles/${id}`)
    } catch (e) {
        console.error(e)
    }
}

const getClassChangesList = async () => {
    try {
        return await axios.get(`/api/data/changes/class/${selectedVersion}/${selectedClass}`)
    } catch (e) {
        console.error(e)
    }
}

const getAllElements = async () => {
    try {
        return await axios.get('/api/data/elements')
    } catch (e) {
        console.error(e)
    }
}

const options = {
    name: 'klay',
    nodeDimensionsIncludeLabels: true, 
    fit: true,
    animate: 'end',
    animationDuration: 500,
    animationEasing: 'spring(500, 50)',
    klay: {
        borderSpacing: 20, // spacing between compound nodes
        spacing: 10, // spacing between nodes
        compactComponents: true,
        nodePlacement:'SIMPLE',
        direction: 'DOWN',
        edgeRouting: 'POLYLINE',
        edgeSpacingFactor: 0.3,
        layoutHierarchy: false
    },
    // stop: () => console.log('layout completed')
}

const hierarchy = () => {
    const hierarchyOptions = _.cloneDeep(options)
    hierarchyOptions.klay.layoutHierarchy = true
    cy.layout(hierarchyOptions).run()
}

// const changeLayout = () => {
//     const dagreOptions = {
//         name: 'dagre',
//         nodeDimensionsIncludeLabels: true,
//         // nodeSep: 5,
//         // edgeSep: 10,
//         rankSep: 10,
//         rankDir: 'TB',
//         ranker: 'longest-path',
//         animate: true,
//         animate: 'end',
//         animationDuration: 500,
//         animationEasing: 'spring(500, 50)',
//         stop: () => console.log('layout completed')
//     }
//     cy.layout(dagreOptions).run()
// }

const showLabel = () => {
    cy.elements('node[role="Information Holder"]').addClass('showLabel')
    cy.layout(options).run()
}