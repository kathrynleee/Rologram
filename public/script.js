let cy
let selectedClass, selectedPackage, selectedVersion, versionToCompare
let versionElements = []
let level = 'system'
let dependencyLevel = 1
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
    createTimeline()
})

const test = async () => {
    // cy.zoom({
    //     level: 1.5,
    //     position: cy.getElementById('wallet.WalletApplication').position()
    // })
    // const eles = await getAllElements()
}

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

const clearInfo = () => {
    document.getElementById('selected').innerHTML = ''
    document.getElementById('roles').innerHTML = ''
}

const createTimeline = async (id) => {
    clearInfo()
    const versions = await getVersions()
    if(level === 'class') {
        const roleList = await getClassRoleList(id)
        let element, span, role
        document.getElementById('selected').innerHTML = id
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
    } else if(level === 'package') {
        document.getElementById('selected').innerHTML = id
        const roleList = await getPackageRoleList(id)
        let element, span
        _.forEach(versions.data, v => {
            const list = _.find(roleList.data, ['version', v])
            element = document.createElement('div')
            span = document.createElement('span')
            if(list.role.length === 0) {
                element.style['background-color'] = '#a9b6c2'
            } else if(list.role.length === 1) {
                element.style['background-color'] = roleMap.get(list.role[0])
                span.addEventListener('click', () => {
                    showPackageChanges(v)
                })
            } else if(list.role.length === 2) {
                let color1 = roleMap.get(list.role[0])
                let color2 = roleMap.get(list.role[1])
                element.style['background-image'] = `linear-gradient(to right, ${color1} 50%, ${color2} 50%)`
                span.addEventListener('click', () => {
                    showPackageChanges(v)
                })
            } else {
                let style = 'linear-gradient(to right'
                _.forEach(list.role, (r, i) => {
                    let color = roleMap.get(r)
                    let size = _.round(100 / list.role.length, 2)
                    style += `, ${color} ${size * i}%,  ${color} ${size * (i+1)}%`
                })
                style += ')'
                element.style['background-image'] = style
                span.addEventListener('click', () => {
                    showPackageChanges(v)
                })
            }
            element.className = 'role'
            span.className = 'tooltip'
            span.setAttribute('data-text', v.slice(0, 10))
            element.appendChild(span)
            document.getElementById('roles').appendChild(element)
        })
    } else {
        document.getElementById('selected').innerHTML = selectedVersion
        const roleList = await getSystemRoleList()
        let element, span
        _.forEach(versions.data, v => {
            const list = _.find(roleList.data, ['version', v])
            element = document.createElement('div')
            if(list.role.length === 1) {
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
            span = document.createElement('span')
            span.addEventListener('click', () => {
                showSystemChanges(v)
            })
            element.className = 'role'
            span.className = 'tooltip'
            span.setAttribute('data-text', v.slice(0, 10))
            element.appendChild(span)
            document.getElementById('roles').appendChild(element)
        })
    }
}

const updateVersion = async () => {
    selectedVersion = document.getElementById('versionList').value
    clearInfo()
    createTimeline()
    const elements = await getElements(selectedVersion)
    versionElements = elements.data
    cy.remove(cy.elements())
    cy.add(elements.data)
    cy.layout(options).run()
}

const showPackageChanges = async (v) => {
    versionToCompare = v
    const versions = await getVersions()
    if(v !== selectedVersion) {
        const changes = await getPackageChangesList(v)
        const currentIndex = _.indexOf(versions.data, selectedVersion)
        const targetIndex = _.indexOf(versions.data, v)
        if(currentIndex < targetIndex) {
            _.forEach(changes.data.nodes.inCompared, d => d.data['status'] = 'added')
            _.forEach(changes.data.edges.inCompared, d => d.data['status'] = 'added')
        } else {
            _.forEach(changes.data.nodes.inCompared, d => d.data['status'] = 'removed')
            _.forEach(changes.data.edges.inCompared, d => d.data['status'] = 'removed')
        }
        cy.startBatch()
        cy.remove(cy.elements())
        cy.add(versionElements)
        cy.add(changes.data.nodes.inCompared)
        cy.add(changes.data.edges.inCompared)
        if(currentIndex < targetIndex){
            cy.elements('[status="added"]').addClass('added')
            _.forEach(changes.data.nodes.inCurrent, d => 
                cy.$id(d.data.id).addClass('removed')
            )
            _.forEach(changes.data.edges.inCurrent, d => 
                cy.elements('edge[source="' + d.data.source + '"][target="' + d.data.target + '"]').addClass('removed')
            )
        } else {
            cy.elements('[status="removed"]').addClass('removed')
            _.forEach(changes.data.nodes.inCurrent, d => 
                cy.$id(d.data.id).addClass('added')
            )
            _.forEach(changes.data.edges.inCurrent, d => 
                cy.elements('edge[source="' + d.data.source + '"][target="' + d.data.target + '"]').addClass('added')
            )
        }
        cy.endBatch()
        updatePackageGraph()
        updateChangesList('removed')
    } else {
        document.getElementById('classList').innerHTML = ''
        cy.remove(cy.elements())
        cy.add(versionElements)
        updatePackageGraph()
    }
}

const showSystemChanges = async (v) => {
    document.getElementById('labelVisibility').value = 'hideLabel'
    versionToCompare = v
    const versions = await getVersions()
    if(v !== selectedVersion) {
        const changes = await getSystemChangesList(v)
        const currentIndex = _.indexOf(versions.data, selectedVersion)
        const targetIndex = _.indexOf(versions.data, v)
        if(currentIndex < targetIndex) {
            _.forEach(changes.data.nodes.inCompared, d => d.data['status'] = 'added')
            _.forEach(changes.data.edges.inCompared, d => d.data['status'] = 'added')
        } else {
            _.forEach(changes.data.nodes.inCompared, d => d.data['status'] = 'removed')
            _.forEach(changes.data.edges.inCompared, d => d.data['status'] = 'removed')
        }
        cy.startBatch()
        cy.remove(cy.elements())
        cy.add(versionElements)
        cy.add(changes.data.nodes.inCompared)
        cy.add(changes.data.edges.inCompared)
        if(currentIndex < targetIndex){
            cy.elements('[status="added"]').addClass('added')
            _.forEach(changes.data.nodes.inCurrent, d => 
                cy.$id(d.data.id).addClass('removed')
            )
            _.forEach(changes.data.edges.inCurrent, d => 
                cy.elements('edge[source="' + d.data.source + '"][target="' + d.data.target + '"]').addClass('removed')
            )
        } else {
            cy.elements('[status="removed"]').addClass('removed')
            _.forEach(changes.data.nodes.inCurrent, d => 
                cy.$id(d.data.id).addClass('added')
            )
            _.forEach(changes.data.edges.inCurrent, d => 
                cy.elements('edge[source="' + d.data.source + '"][target="' + d.data.target + '"]').addClass('added')
            )
        }
        cy.endBatch()
        cy.layout(options).run()
        updateChangesList('removed')
    } else {
        document.getElementById('classList').innerHTML = ''
        cy.remove(cy.elements())
        cy.add(versionElements)
        cy.layout(options).run()
    }
}

const showClassChanges = async (v) => {
    versionToCompare = v
    const versions = await getVersions()
    if(v !== selectedVersion) {
        const changes = await getClassChangesList(v)
        const currentIndex = _.indexOf(versions.data, selectedVersion)
        const targetIndex = _.indexOf(versions.data, v)
        cy.startBatch()
        cy.remove(cy.elements())
        cy.add(versionElements)
        cy.add(changes.data.nodes.inCompared)
        cy.add(changes.data.edges.inCompared)
        if(currentIndex < targetIndex) {
            _.forEach(changes.data.nodes.inCompared, d => d.data['status'] = 'added')
            _.forEach(changes.data.edges.inCompared, d => d.data['status'] = 'added')
        } else {
            _.forEach(changes.data.nodes.inCompared, d => d.data['status'] = 'removed')
            _.forEach(changes.data.edges.inCompared, d => d.data['status'] = 'removed')
        }
        if(currentIndex < targetIndex){
            cy.elements('[status="added"]').addClass('added')
            _.forEach(changes.data.nodes.inCurrent, d => 
                cy.$id(d.data.id).addClass('removed')
            )
            _.forEach(changes.data.edges.inCurrent, d => 
                cy.elements('edge[source="' + d.data.source + '"][target="' + d.data.target + '"]').addClass('removed')
            )
        } else {
            cy.elements('[status="removed"]').addClass('removed')
            _.forEach(changes.data.nodes.inCurrent, d => 
                cy.$id(d.data.id).addClass('added')
            )
            _.forEach(changes.data.edges.inCurrent, d => 
                cy.elements('edge[source="' + d.data.source + '"][target="' + d.data.target + '"]').addClass('added')
            )
        }
        cy.endBatch()
        updateClassGraph()
        updateChangesList('removed')
    } else {
        document.getElementById('classList').innerHTML = ''
        cy.remove(cy.elements())
        cy.add(versionElements)
        updateClassGraph()
    }
}

const createGraph = async () => {
    const versions = await getVersions()
    const versionIndex = versions.data.length - 1
    selectedVersion = versions.data[versionIndex]
    document.getElementById('versionList').selectedIndex = versionIndex
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
                document.getElementById('classList').innerHTML = ''
                const target = e.target
                if (target === cy) {
                    clearInfo()
                    createTimeline()
                    level = 'system'
                    selectedClass = ''
                    selectedPackage = ''
                    cy.remove(cy.elements())
                    cy.add(versionElements)
                    cy.layout(options).run()
                    document.getElementById('labelVisibility').value = 'hideLabel'
                }
            })
            this.on('tap', 'node', async (e) => {
                const target = e.target
                // const version = target._private.data.version
                // let target = e.target
                // const selected = target._private.data.id
                // const version = target._private.data.version
                // if(version !== selectedVersion) {
                //     document.getElementById('versionList').value = version
                //     selectedVersion = version
                //     const elements = await getElements(version)
                //     versionElements = elements.data
                //     cy.remove(cy.elements())
                //     cy.add(versionElements)
                //     target = cy.$id(selected)
                // }
                const isExisted = target.hasClass('removed') || target.hasClass('added')
                if(!isExisted) {
                    cy.elements().removeClass(['hide', 'selected', 'showLabel', 'hideLabel', 'hover', 'faded'])
                    if(target.isParent()) {
                        level = 'package'
                        selectedPackage = target._private.data.id
                        createTimeline(target._private.data.id)
                        updatePackageGraph()
                        document.getElementById('labelVisibility').value = 'showLabel'
                    } else {
                        level = 'class'
                        selectedClass = target._private.data.id
                        createTimeline(target._private.data.id)
                        updateClassGraph()
                        document.getElementById('labelVisibility').value = 'showLabel'
                    }
                }
            })
            this.on('mouseover', 'node', (e) => {
                const target = e.target
                if(level === 'system') {
                    target.addClass('showLabel')
                }
            })
            this.on('mouseout', 'node', (e) => {
                const target = e.target
                const choice = document.getElementById('labelVisibility').value
                if(level === 'system' && choice !== 'showLabel') {
                    target.removeClass('showLabel')
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
    const versionIndex = versions.data.length - 1
    selectedVersion = versions.data[versionIndex]
}

const getVersions = async () => {
    try {
        return await axios.get( '/api/data/versions')
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

const getElements = async (version) => {
    try {
        return await axios.get(`/api/data/elements/${version}`)
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

const getSystemRoleList = async () => {
    try {
        return await axios.get('/api/data/roles/versions')
    } catch (e) {
        console.error(e)
    }
}

const getPackageRoleList = async (id) => {
    try {
        return await axios.get(`/api/data/roles/package/${id}`)
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

const getSystemChangesList = async (v) => {
    try {
        return await axios.get(`/api/data/changes/system/${selectedVersion}/${v}`)
    } catch (e) {
        console.error(e)
    }
}

const getPackageChangesList = async (v) => {
    try {
        return await axios.get(`/api/data/changes/package/${selectedVersion}/${v}/${selectedPackage}`)
    } catch (e) {
        console.error(e)
    }
}

const getClassChangesList = async (v) => {
    try {
        return await axios.get(`/api/data/changes/class/${selectedVersion}/${v}/${selectedClass}`)
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
        spacing: 15, // spacing between nodes
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

const resetLayout = () => {
    cy.layout(options).run()
}

const resizeNodes = () => {
    // cy.elements('node[role="Information Holder"]').addClass('showLabel')
    // cy.layout(options).run()
    // let png64 = cy.png()
    // document.querySelector('#image').setAttribute('src', png64)
    // cy.elements('node').addClass('resized')
    cy.nodes().style({
        'height' : (node) => {
            let loc = _.toInteger(node.data('loc'))
            let size = 5 * _.round(Math.sqrt(loc))
            return size
        },
        'width' : (node) => {
            let loc = _.toInteger(node.data('loc'))
            let size = 5 *  _.round(Math.sqrt(loc))
            return size
        }
    })
    cy.layout(options).run()
}

const setRole = () => {
    cy.elements().removeClass('hide')
    let fromRole = document.getElementById('fromRole').value
    let toRole = document.getElementById('toRole').value
    let fromNodes = [], toNodes = []
    fromNodes = (fromRole === '') ? cy.nodes() : cy.elements(`node[role="${fromRole}"]`)
    toNodes = (toRole === '') ? cy.nodes() : cy.elements(`node[role="${toRole}"]`)
    cy.startBatch()
    const edges = fromNodes.edgesTo(toNodes)
    const nodes = edges.connectedNodes()
    const parents = nodes.ancestors()
    nodes.addClass('showLabel')
    cy.elements().not(edges).not(nodes).not(parents).addClass('hide')
    cy.layout(options).run()
    cy.endBatch()
}

const toggleLabelVisibility = () => {
    let labelVisibility = document.getElementById('labelVisibility').value
    cy.startBatch()
    cy.nodes().removeClass(['showLabel', 'hideLabel'])
    cy.nodes().addClass(`${labelVisibility}`)
    cy.endBatch()
    cy.layout(options).run()
}

const updateDependencyLevel = (lvl) => {
    dependencyLevel = lvl
    if(level === 'class') {
        updateClassGraph()
    }
}

const updateClassGraph = () => {
    const target = cy.$id(selectedClass).addClass('selected')
    cy.startBatch()
    cy.elements().removeClass('hide')
    // first level edges and nodes
    const edges = target.connectedEdges()
    const nodes = edges.connectedNodes().union(target)
    edges.style({
        'width' : '3'
    })
    let nodeList = nodes , edgeList = edges, parents = nodes.ancestors()
    let secondLvlEdges = [], secondLvlNodes = [], thirdLvlEdges = [], thirdLvlNodes = []
    if(dependencyLevel > 1) {
        edges.style({
            'width' : '13'
        })
        // second level edges
        secondLvlEdges = nodes.connectedEdges().not(edges)
        secondLvlNodes = secondLvlEdges.connectedNodes()
        secondLvlEdges.style({
            'width' : '7',
            'opacity' : '0.8'
        })
        parents = nodes.ancestors().union(secondLvlNodes.ancestors())
        nodeList = nodes.union(secondLvlNodes)
        edgeList = edges.union(secondLvlEdges)
    }
    if(dependencyLevel === 3) {
        // third level edges
        thirdLvlEdges = secondLvlNodes.connectedEdges().not(edges).not(secondLvlEdges)
        thirdLvlNodes = thirdLvlEdges.connectedNodes()
        thirdLvlEdges.style({
            'width' : '3',
            'opacity' : '0.6'
        })
        parents = nodes.ancestors().union(secondLvlNodes.ancestors()).union(thirdLvlNodes.ancestors())
        nodeList = nodes.union(secondLvlNodes).union(thirdLvlNodes)
        edgeList = edges.union(secondLvlEdges).union(thirdLvlEdges)
    }
    nodeList.addClass('showLabel')
    cy.elements().not(nodeList).not(edgeList).not(parents).addClass('hide')
    cy.endBatch()
    cy.layout(options).run()
}

const updatePackageGraph = () => {
    cy.startBatch()
    const target = cy.$id(selectedPackage)
    const nodes = target.union(target.descendants())
    const parents = target.ancestors()
    const edges = nodes.connectedEdges()
    nodes.addClass('showLabel')
    cy.elements().not(nodes).not(parents).not(edges).addClass('hide')
    cy.endBatch()
    cy.layout(options).run()
}

const updateChangesList = async (type) => {
    document.getElementById('classList').innerHTML = ''
    const versions = await getVersions()
    let changes = {}
    switch(level) {
        case 'system':
            changes = await getSystemChangesList(versionToCompare)
            break
        case 'package':
            changes = await getPackageChangesList(versionToCompare)
            break
        case 'class':
            changes = await getClassChangesList(versionToCompare)
            break
    }
    const currentIndex = _.indexOf(versions.data, selectedVersion)
    const targetIndex = _.indexOf(versions.data, versionToCompare)
    let addedText = '', removedText = ''
    if(currentIndex < targetIndex){
        removedText = changes.data.nodes.inCurrent.map(n => n.data.id).join('<br>')
        addedText = changes.data.nodes.inCompared.map(n => n.data.id).join('<br>')
    } else {
        removedText = changes.data.nodes.inCompared.map(n => n.data.id).join('<br>')
        addedText = changes.data.nodes.inCurrent.map(n => n.data.id).join('<br>')
    }

    switch(type) {
        case 'removed':
            cy.startBatch()
            cy.elements('.removed').removeClass('hide')
            cy.elements().removeClass('faded')
            cy.elements('.changedRole').removeClass(['Controller', 'Coordinator', 'Interfacer', 'InformationHolder', 'ServiceProvider', 'Structurer'])
            cy.elements().removeClass('changedRole')
            cy.endBatch()
            document.getElementById('classList').innerHTML = 'Compare with<br>' + versionToCompare + '<br><br>' + 'Removed classes:<br>' + removedText
            break
        case 'added':
            cy.startBatch()
            cy.elements().removeClass('faded')
            cy.elements('.removed').addClass('hide')
            cy.elements().not('.added').not('.removed').addClass('faded')
            cy.elements('.changedRole').removeClass(['Controller', 'Coordinator', 'Interfacer', 'InformationHolder', 'ServiceProvider', 'Structurer'])
            cy.elements().removeClass('changedRole')
            cy.endBatch()
            document.getElementById('classList').innerHTML = 'Compare with<br>' + versionToCompare + '<br><br>' + 'Added classes:<br>' + addedText
            break
        case 'changed':
            cy.startBatch()
            cy.elements().removeClass(['changedRole', 'faded'])
            cy.elements('.removed').addClass('hide')
            changes.data.changedRoles.forEach(n => {
                let fromRole = n[versionToCompare]
                fromRole = fromRole.replace(/\s+/g, '')
                cy.$id(n.id).addClass(['changedRole', fromRole])
            })
            cy.endBatch()
            let text = changes.data.changedRoles.map(n => n.id).join('<br>')
            document.getElementById('classList').innerHTML = 'Compare with<br>' + versionToCompare + '<br><br>' + 'Role-changed classes:<br>' + text
            break
    }
}
