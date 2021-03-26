'use strict'

const showCompareDialog = async () => {
  setVisible('#compare', true)
}

const showChangeList = (type) => {
  cy.startBatch()
  cy.elements().removeClass('hide')
  switch(type) {
    case 'removed':
      cy.elements('[status="added"], [status="same"]').addClass('hide')
      break
    case 'added':
      cy.elements('[status="removed"], [status="same"]').addClass('hide')
      break
    case 'changed':
      cy.elements('[status="removed"], [status="same"], [status="added"]').not('.changedRole').addClass('hide')
      cy.nodes('.changedRole').removeClass('faded')
      break
  }
  // let parents = cy.nodes(':visible').ancestors()
  // parents.forEach(n=> {
  //   console.log(n._private.data.id)
  // })
  cy.nodes(':parent').not(parents).addClass('hide')
  cy.endBatch()
  cy.layout(currentLayoutOptions).run()
}

const createChangeList = (data, versionToCompare, isComparingToLaterVersion) => {
  const changeListElement = document.querySelector('#compare .changeList')
  data.nodes.inCurrent.forEach(n => {
    let element = document.createElement('div')
    element.className = 'change-list-row'
    element.textContent = n.data.status + ': ' + n.data.id
    element.addEventListener('click', () => {
      cy.center(cy.$id(n.data.id))
    })
    changeListElement.appendChild(element)
  })
  data.nodes.inCompared.forEach(n => {
    let element = document.createElement('div')
    element.className = 'change-list-row'
    element.textContent = n.data.status + ': ' + n.data.id
    element.addEventListener('click', () => {
      cy.center(cy.$id(n.data.id))
    })
    changeListElement.appendChild(element)
  })
  data.changedRoles.forEach(n => {
    let element = document.createElement('div')
    element.className = 'change-list-row'
    if(isComparingToLaterVersion) {
      element.textContent = n[selectedVersion] + ' -> ' + n[versionToCompare] + ': ' + n.id
    } else {
      element.textContent = n[versionToCompare] + ' -> ' + n[selectedVersion] + ': ' + n.id
    }
    element.addEventListener('click', () => {
      cy.center(cy.$id(n.id))
    })
    changeListElement.appendChild(element)
  })
}

const createSelect = async () => {
  const versions = await getVersions()
  const versionList = _.remove(versions.data, v => v !== selectedVersion)
  let selectList = document.createElement('select')
  selectList.addEventListener('change', () => {
    showChanges(selectList.value)
    createIndicators(selectList.value)
  })
  const element = document.getElementById('version-select')
  element.innerHTML = ''
  element.appendChild(selectList)
  let option = document.createElement('option')
  option.value = ''
  option.text = ''
  selectList.appendChild(option)

  versionList.forEach(version => {
    let option = document.createElement('option')
    option.value = version
    let index = version.lastIndexOf('-')
    let commitId = version.slice(index + 1, index + 8)
    option.text = `${commitId} on ${version.slice(0, 10)}`
    selectList.appendChild(option)
  })
}

const showChanges = async (versionToCompare) => {
  resetTools()
  const versions = await getVersions()
  let changes
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
  const isComparingToLaterVersion = false
  if(currentIndex < targetIndex) {
    isComparingToLaterVersion = true
    _.forEach(changes.data.nodes.inCompared, d => d.data['status'] = 'added')
    _.forEach(changes.data.edges.inCompared, d => d.data['status'] = 'added')
    _.forEach(changes.data.nodes.inCurrent, d => d.data['status'] = 'removed')
    _.forEach(changes.data.edges.inCurrent, d => d.data['status'] = 'removed')
    let mapParentId = _.map(changes.data.nodes.inCurrent, n => n.data.id)
    changes.data.parents.forEach(d => {
      if(_.includes(mapParentId, d.data.id)) {
        d.data['status'] = 'removed'
      }
    })
  } else {
    _.forEach(changes.data.nodes.inCompared, d => d.data['status'] = 'removed')
    _.forEach(changes.data.edges.inCompared, d => d.data['status'] = 'removed')
    let mapParentId = _.map(changes.data.nodes.inCompared, n => n.data.id)
    changes.data.parents.forEach(d => {
      if(_.includes(mapParentId, d.data.id)) {
        d.data['status'] = 'removed'
      }
    })
    _.forEach(changes.data.nodes.inCurrent, d => d.data['status'] = 'added')
    _.forEach(changes.data.edges.inCurrent, d => d.data['status'] = 'added')
  }
  _.forEach(changes.data.nodes.same, d => d.data['status'] = 'same')
  _.forEach(changes.data.edges.same, d => d.data['status'] = 'same')
  cy.startBatch()
  cy.remove(cy.elements())
  cy.add(changes.data.parents)
  cy.add(changes.data.nodes.same)
  cy.add(changes.data.nodes.inCurrent)
  cy.add(changes.data.nodes.inCompared)
  cy.add(changes.data.edges.same)
  cy.add(changes.data.edges.inCurrent)
  cy.add(changes.data.edges.inCompared)
  if(currentIndex < targetIndex){
    _.forEach(changes.data.edges.inCurrent, d => 
      cy.edges('edge[source="' + d.data.source + '"][target="' + d.data.target + '"]').addClass('removed')
    )
  } else {
    _.forEach(changes.data.edges.inCurrent, d => 
      cy.edges('edge[source="' + d.data.source + '"][target="' + d.data.target + '"]').addClass('added')
    )
  }
  changes.data.changedRoles.forEach(n => {
    let fromRole = n[versionToCompare]
    fromRole = fromRole.replace(/\s+/g, '')
    cy.$id(n.id).addClass(['changedRole', fromRole])
  })
  cy.elements('[status="added"]').addClass('added')
  cy.elements('[status="removed"]').addClass('removed')
  cy.elements('[status="same"]').addClass('faded')

  if(level === 'class') {
    cy.$id(selectedClass).addClass('selected')
  }
  cy.endBatch()
  document.querySelector('[data-option="hideLabels"]').classList.add('selected-option')
  document.querySelector('[data-option="showLabels"]').className = ''

  updateGraph()
  createChangeList(changes.data, versionToCompare, isComparingToLaterVersion)
}