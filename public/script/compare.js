'use strict'

const showCompareDialog = () => {
  setVisible('#compare', true, false)
  setVisible('.close', true, false)
  moveGraph()
}

const switchChangeListView = (type) => {
  document.querySelector('.list-view-options .selected-view').classList.remove('selected-view')
  setVisible('.change-lists .change-list-group', false, true)
  setVisible('.change-lists .change-list', false, true)
  cy.startBatch()
  cy.elements().removeClass('hide')
  cy.endBatch()
  cy.startBatch()
  switch(type) {
    case 'all':
      document.querySelector('.list-view-options .all').classList.add('selected-view')
      setVisible('.change-lists .change-list-group', true, true)
      cy.nodes('.changedRole').addClass('faded')
      break
    case 'removed':
      document.querySelector('.list-view-options .removed').classList.add('selected-view')
      setVisible('.change-list.removed-list', true, false)
      cy.elements('[status="added"], [status="same"]').addClass('hide')
      var parents = cy.elements('[status="removed"]').ancestors()
      cy.nodes(':parent').not(parents).addClass('hide')
      break
    case 'added':
      document.querySelector('.list-view-options .added').classList.add('selected-view')
      setVisible('.change-list.added-list', true, false)
      cy.elements('[status="removed"], [status="same"]').addClass('hide')
      var parents = cy.elements('[status="added"]').ancestors()
      cy.nodes(':parent').not(parents).addClass('hide')
      break
    case 'role-changed':
      document.querySelector('.list-view-options .role-changed').classList.add('selected-view')
      setVisible('.change-list.role-changed-list', true, false)
      cy.elements('[status="removed"], [status="added"]').addClass('hide')
      cy.elements('[status="same"]').not('.changedRole').addClass('hide')
      var parents = cy.elements('.changedRole').ancestors()
      cy.nodes(':parent').not(parents).addClass('hide')
      cy.nodes('.changedRole').removeClass('faded')
      break
  }
  cy.endBatch()
  cy.layout(currentLayoutOptions).run()
}

const toggleChangeList = (name) => {
  let element = document.querySelector(`.change-list.${name}-list`)
  element.classList.toggle('hide')
  if(element.classList.contains('hide')) {
    document.querySelector(`.change-list-div.${name}-div .change-list-icon`).textContent = 'keyboard_arrow_down'
  } else {
    document.querySelector(`.change-list-div.${name}-div .change-list-icon`).textContent = 'keyboard_arrow_up'
  }
}

const clickChangeListItem = (id) => {
  if(level == 'system') {
    cy.nodes('.showLabel').removeClass('showLabel')
    cy.$id(id).addClass('showLabel')
  }
  if(level == 'class' && cy.$id(id).hasClass('hide')) {
    cy.startBatch()
    cy.elements().removeClass('hide')
    cy.nodes('.changedRole').addClass('faded')
    cy.endBatch()
    let layout = cy.layout(currentLayoutOptions).run()
    layout.promiseOn('layoutstop').then(e => {
      cy.zoom(1.3)
      cy.center(cy.$id(id))
    })
    layout.run()
  } else {
    cy.fit()
    cy.zoom(1.3)
    cy.center(cy.$id(id))
  }
}

const createListItem = (data) => {
  let element, div, sub, packageText, classText
    element = document.createElement('div')
    element.className = 'change-list-row'
    element.addEventListener('click', () => {
      clickChangeListItem(data.id)
    })
    div = document.createElement('div')
    div.className = 'list-item-text'
    sub = document.createElement('div')
    packageText = document.createElement('div')
    packageText.className = 'list-item-package-text'
    classText = document.createElement('div')
    classText.className = 'list-item-class-text'
    if(data.role === undefined) {
        sub.className = 'list-item-package'
        packageText.innerHTML = data.id
    } else {
        sub.className = 'list-item-circle'
        sub.style['background-color'] = roleMap.get(data.role)
        let index = data.id.lastIndexOf('.')
        packageText.innerHTML = data.id.slice(0, index)
        classText.innerHTML = data.id.slice(index + 1)
    }
    element.appendChild(sub)
    div.appendChild(packageText)
    div.appendChild(classText)
    element.appendChild(div)
    return element
}

const createRoleChangedListItem = (data, versionToCompare, isComparingToLaterVersion) => {
  let element, div, fromRole, toRole, packageText, classText, arrow
    element = document.createElement('div')
    element.className = 'change-list-row'
    element.addEventListener('click', () => {
      clickChangeListItem(data.id)
    })
    div = document.createElement('div')
    div.className = 'list-item-text'
    packageText = document.createElement('div')
    packageText.className = 'list-item-package-text'
    classText = document.createElement('div')
    classText.className = 'list-item-class-text'
    arrow = document.createElement('div')
    arrow.className = 'material-icons'
    arrow.textContent = 'arrow_right_alt'
    fromRole = document.createElement('div')
    fromRole.className = 'list-item-circle'
    toRole = document.createElement('div')
    toRole.className = 'list-item-circle'
    if(isComparingToLaterVersion) {
      fromRole.style['background-color'] = roleMap.get(data[`${selectedVersion}`])
      toRole.style['background-color'] = roleMap.get(data[`${versionToCompare}`])
    } else {
      fromRole.style['background-color'] = roleMap.get(data[`${versionToCompare}`])
      toRole.style['background-color'] = roleMap.get(data[`${selectedVersion}`])
    }
    let index = data.id.lastIndexOf('.')
    packageText.innerHTML = data.id.slice(0, index)
    classText.innerHTML = data.id.slice(index + 1)
    element.appendChild(fromRole)
    element.appendChild(arrow)
    element.appendChild(toRole)
    div.appendChild(packageText)
    div.appendChild(classText)
    element.appendChild(div)
    return element
}

const createChangeList = (data, versionToCompare, isComparingToLaterVersion) => {
  // update list count
  let status, addedCount = 0, removedCount = 0, changedCount = 0
  changedCount = data.changedRoles.length
  if(data.nodes.inCurrent.length > 0) {
    status = data.nodes.inCurrent[0].data.status
    addedCount = (status === 'added') ? data.nodes.inCurrent.length : data.nodes.inCompared.length
    removedCount = (status === 'removed') ? data.nodes.inCurrent.length : data.nodes.inCompared.length
  } else if(data.nodes.inCompared.length > 0) {
    status = data.nodes.inCompared[0].data.status
    addedCount = (status === 'added') ? data.nodes.inCompared.length : data.nodes.inCurrent.length
    removedCount = (status === 'removed') ? data.nodes.inCompared.length : data.nodes.inCurrent.length
  }
  document.querySelector('.list-view.all .count').textContent = addedCount + removedCount + changedCount
  document.querySelector('.list-view.removed .count').textContent = removedCount
  document.querySelector('.list-view.added .count').textContent = addedCount
  document.querySelector('.list-view.role-changed .count').textContent = changedCount

  setVisible('#compare .added-div', false, false)
  setVisible('#compare .removed-div', false, false)
  // create list
  if(data.nodes.inCurrent.length > 0) {
    status = data.nodes.inCurrent[0].data.status
    data.nodes.inCurrent.forEach(n => {
      document.querySelector(`#compare .${status}-list`).appendChild(createListItem(n.data))
    })
    setVisible(`.${status}-div`, true, false)
  }
  if(data.nodes.inCompared.length > 0) {
    status = data.nodes.inCompared[0].data.status
    data.nodes.inCompared.forEach(n => {
      document.querySelector(`#compare .${status}-list`).appendChild(createListItem(n.data))
    })
    setVisible(`.${status}-div`, true, false)
  }
  if(data.changedRoles.length > 0) {
    data.changedRoles.forEach(n => {
      document.querySelector(`#compare .role-changed-list`).appendChild(createRoleChangedListItem(n, versionToCompare, isComparingToLaterVersion))
    })
    setVisible('.role-changed-div', true, false)
  } else {
    setVisible('.role-changed-div', false, false)
  }
  setVisible('.list-view-options', true, false)
}

const createSelect = async () => {
  const element = document.querySelector('.version-options-list')
  if(!element.classList.contains('created')) {
    element.classList.add('created')
    let versionList = []
    if(level === 'system') {
      const versions = await getVersions()
      versionList = versions.data
    } else if(level === 'package') {
      const roleList = await getPackageRoleList(selectedPackage)
      versionList = _.map(roleList.data, 'version')
    } else if(level === 'class') {
      const roleList = await getClassRoleList(selectedClass)
      versionList = _.map(roleList.data, 'version')
    }
    versionList = _.remove(versionList, v => v !== selectedVersion)
    versionList.forEach(version => {
      let option = document.createElement('div')
      option.className = 'version-option'
      // commit icon
      let commitIconDiv = document.createElement('div')
      commitIconDiv.innerHTML = '<img src="../image/git-commit.png">'
      // commit id
      let commitIdDiv = document.createElement('div')
      commitIdDiv.className = 'commit-id'
      let index = version.lastIndexOf('-')
      commitIdDiv.textContent = version.slice(index + 1, index + 8)
      // commit date
      let commitDateDiv = document.createElement('div')
      commitDateDiv.className = 'commit-date'
      commitDateDiv.textContent = 'on ' + version.slice(0, 10)
      // append to DOM
      let optionDiv = document.createElement('div')
      optionDiv.appendChild(commitIconDiv)
      optionDiv.appendChild(commitIdDiv)
      optionDiv.appendChild(commitDateDiv)
      optionDiv.className = 'version-option-div'
      option.appendChild(optionDiv)
      option.addEventListener('click', () => {
        document.querySelector('#compare .version-selected').innerHTML = ''
        let div = optionDiv.cloneNode(true)
        document.querySelector('#compare .version-selected').appendChild(div)
        element.classList.add('closed')
        document.querySelector('#compare .version-select-icon').textContent = 'keyboard_arrow_down'
        document.querySelector('.list-view-options .selected-view').classList.remove('selected-view')
        setVisible('#compare .version-select-text', false, false)
        setVisible('#compare .version-options-list', false, false)
        showChanges(selectedVersion, version)
        document.querySelector('.list-view-options .all').classList.add('selected-view')
        setVisible('#compare .list-view-options', true, false)
        clearChangeLists()
        resetListIcon()
      })
      element.appendChild(option)
    })
    document.querySelector('.version-select-icon').textContent = 'keyboard_arrow_up'
    setVisible('.version-options-list', true, false)
  } else if(element.classList.contains('closed') && element.classList.contains('created')) {
    document.querySelector('.version-select-icon').textContent = 'keyboard_arrow_up'
    setVisible('.version-options-list', true, false)
    element.classList.toggle('closed')
  } else {
    document.querySelector('.version-select-icon').textContent = 'keyboard_arrow_down'
    setVisible('.version-options-list', false, false)
    element.classList.toggle('closed')
  }
}

const resetListCount = () => {
  document.querySelector('.list-view.all .count').textContent = 0
  document.querySelector('.list-view.removed .count').textContent = 0
  document.querySelector('.list-view.added .count').textContent = 0
  document.querySelector('.list-view.role-changed .count').textContent = 0
}

const resetListIcon = () => {
  document.querySelector('.version-select-icon').textContent = 'keyboard_arrow_down'
  let elements = document.querySelectorAll('.change-list-div .change-list-icon')
  for(var i=0; i < elements.length; i++) {
    elements[i].textContent = 'keyboard_arrow_down'
  }
}

const showChanges = async (currentVersion, versionToCompare) => {
  resetListCount()
  cy.remove(cy.elements())
  cy.layout(currentLayoutOptions).run()
  setVisible('.loader', true, false)
  const versions = await getVersions()
  let changes
  switch(level) {
    case 'system':
      changes = await getSystemChangesList(currentVersion, versionToCompare)
      break
    case 'package':
      changes = await getPackageChangesList(currentVersion, versionToCompare)
      break
    case 'class':
      changes = await getClassChangesList(currentVersion, versionToCompare)
      break
  }
  const currentIndex = _.indexOf(versions.data, currentVersion)
  const targetIndex = _.indexOf(versions.data, versionToCompare)
  let isComparingToLaterVersion = false
  if(currentIndex < targetIndex) {
    document.querySelector('.change-lists .removed-message').textContent = 'Removed from selected version'
    document.querySelector('.change-lists .added-message').textContent = 'Added in selected version'
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
    document.querySelector('.change-lists .removed-message').textContent = 'Removed from current version'
    document.querySelector('.change-lists .added-message').textContent = 'Added in current version'
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
    // codeViewingOption = 'compare'
    updateCodeView(currentVersion, versionToCompare, isComparingToLaterVersion)
    setVisible('.code-compare', true, false)
  }
  cy.endBatch()
  if(level == 'system') {
    updateGraph('hideLabels')
  } else if(level == 'package') {
    updateGraph('showLabels')
  } else {
    updateClassGraph(1, 'all', false, 'showLabels')
  }
  moveGraph()
  // if(!isStarted) { // not updating change list when calling this function for animation
  clearChangeLists()
  createIndicators(versionToCompare, 'COMPARE')
  createChangeList(changes.data, versionToCompare, isComparingToLaterVersion)
  setVisible('.change-lists', true, false)
  setVisible('.change-lists .change-list-group', true, true)
  setVisible('.change-lists .change-list', false, true)
  // } else {
  //   createIndicators(versionToCompare, 'SHOWING')
  // }
}

const removeIndicator = () => {
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
  // add current 
  let currentEles = document.querySelectorAll(`[data-text='${selectedVersion.slice(0, 10)}']`)[0]
  currentEles.className = 'tooltip selected'
  currentEles.textContent = 'CURRENT'
  currentEles.parentNode.classList.add('selected-version')
}

const createIndicators = (version, text) => {
  removeIndicator()
  // comparing version indicator
  let date = version.slice(0, 10)
  let eles = document.querySelectorAll(`[data-text='${date}']`)[0]
  eles.className = 'tooltip selected'
  eles.textContent = text
  eles.parentNode.classList.add('selected-version')
}

const clearChangeLists = () => {
  let elements = document.getElementsByClassName('change-list')
  for(var i; i < elements.length; i++) {
    elements[0].classList.add('hide')
  }
  document.querySelector('.change-lists .removed-list').innerHTML = ''
  document.querySelector('.change-lists .added-list').innerHTML = ''
  document.querySelector('.change-lists .role-changed-list').innerHTML = ''
}