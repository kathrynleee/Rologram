'use strict'

const moveGraph = () => {
  // cy.pan({ x: 20, y: 40 })
  cy.fit()
  // shift graph to left
  cy.panBy({ x: -200, y: 0 })
}

const closeSourceCode = () => {
  setVisible('#sourceCode', false, false)
}

// let codeViewingOption = 'single'
const showSourceCode = async (codeViewingOption) => {
  moveGraph()
  setVisible('.close-code', true, false)
  setVisible('#sourceCode', true, false)
  setVisible('#sourceCode .code', false, false)
  if(level !== 'class') {
    setVisible('#sourceCode .not-found', true, false)
    document.querySelector('#sourceCode .not-found').textContent = 'Source code only available for classes.'
  } else {
    setVisible('#sourceCode .not-found', false, false)
    const code = await displaySourceCode(selectedVersion)
    if(code !== undefined) {
      if(codeViewingOption == 'compare') {
        document.querySelector('#sourceCode').classList.add('view')
        setVisible('#sourceCode #view', true, false)
        setVisible('#sourceCode .code', false, false)
      } else {
        document.querySelector('#sourceCode').classList.remove('view')
        showSingleCode(code.data)
      }
    } else {
      setVisible('#sourceCode .not-found', true, false)
      document.querySelector('#sourceCode .not-found').textContent = 'Not found.'
    }
  }
}

const showSingleCode = async (code) => {
  setVisible('#sourceCode #view', false, false)
  setVisible('#sourceCode .code', true, false)
  if(codeEditor !== undefined) {
    codeEditor.getWrapperElement().remove()
    codeEditor = undefined
  }
  codeEditor = CodeMirror.fromTextArea(document.getElementById('editor'), {
    mode: 'text/x-java',
    theme: 'eclipse',
    lineNumbers: true,
    lineWrapping: true,
    readOnly: true
    // readOnly: 'nocursor'
  })
  codeEditor.setValue(code)
}

const updateCodeView = async (currentVersion, versionToCompare, isComparingToLaterVersion) => {
  document.getElementById('view').innerHTML = ''
  let currentCode = await displaySourceCode(currentVersion)
  let comparedCode = await displaySourceCode(versionToCompare)
  let left, right
  if(isComparingToLaterVersion) {
    // left : current, right: later
    left = currentCode.data
    right = comparedCode.data
  } else {
    right = currentCode.data
    left = comparedCode.data
  }
  let mergeView = CodeMirror.MergeView(document.getElementById('view'), {
    mode: 'text/x-java',
    theme: 'eclipse',
    value: right,
    origLeft: left,
    lineNumbers: true,
    lineWrapping: true,
    showDifferences: true,
    autoRefresh: true,
    readOnly: true
  })
}

const displaySourceCode = async (version) => {
  const index = version.lastIndexOf('-')
  const systemName = version.slice(11, index)
  const commitId = version.slice(index + 1)
  let className = selectedClass
  // handle inner class
  if(selectedClass.indexOf('$') !== -1) {
    className = className.slice(0, selectedClass.indexOf('$'))
  }
  const filePath = className.split('.').join('/') + '.java'
  const path = await getPath(version, selectedClass)
  let packagePath = path.data.path
  let username = path.data.username
  let url = `https://raw.githubusercontent.com/${username}/${systemName}/${commitId}/${packagePath}/${filePath}`
  let code = await getSourceCode(url)
  return code
}

const showTools = () => {
  setVisible('#tools', true, false)
  setVisible('.close', true, false)
  moveGraph()
}

const closeOpenedDialog = () => {
  setVisible('.dialog', false, true)
  setVisible('.close', false, false)
  setVisible('.close-code', false, false)
  cy.fit()
}

const exportHistory = async () => {
  // let text = JSON.stringify(historyList)
  let text = ''
  historyList.forEach(record => {
    text += Object.keys(record).map(key => `${record[key]}`).join(',')
    text += '\r\n'
  })
  let data = new Blob([text], {type: 'text/plain', endings: 'native'})
  let textFile = window.URL.createObjectURL(data)
  let link = document.createElement('a')
  document.body.appendChild(link)
  link.setAttribute("type", 'hidden')
  link.href = `${textFile}`
  link.download = 'history.txt'
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(textFile)
}

const download = () => {
  let png64 = cy.png()
  let link = document.createElement('a')
  document.body.appendChild(link)
  link.setAttribute("type", 'hidden')
  link.href = `${png64}`
  switch(level) {
    case 'system':
      link.download = `${selectedVersion}.png`
      break
    case 'package':
      link.download = `${selectedVersion}-${selectedPackage}.png`
      break
    case 'class':
      link.download = `${selectedVersion}-${selectedClass}.png`
      break
  }
  link.click()
  document.body.removeChild(link)
}

const setVisible = (selector, visible, selectAll) => {
  if(selectAll) {
    let elements = document.querySelectorAll(selector)
    for(var i=0; i < elements.length; i++) {
      if(visible) {
        elements[i].classList.remove('hide')
      } else {
        elements[i].classList.add('hide')
      }
    }
  } else {
    if(visible) {
      document.querySelector(selector).classList.remove('hide')
    } else {
      document.querySelector(selector).classList.add('hide')
    }
  }
}

const createLegend = () => {
  let element, sub, text
  for (let role of roleMap.keys()) {
    element = document.createElement('div')
    element.className = 'legend-role'
    sub = document.createElement('div')
    sub.className = 'legend-circle'
    sub.addEventListener('mouseover', () => {
      hoverLegend(role)
    })
    sub.addEventListener('mouseout', () => {
      removeHoverLegend()
    })
    sub.style['background-color'] = roleMap.get(role)
    element.appendChild(sub)
    text = document.createElement('div')
    text.className = 'legend-text'
    text.innerHTML = role
    element.appendChild(text)
    document.getElementById('legend').appendChild(element)
  }
}

const removeHoverLegend = () => {
  cy.elements().removeClass(['hover', 'hover-selected'])
}

const hoverLegend = (role) => {
  const nodes = cy.elements(`node[role="${role}"]`)
  const parents = nodes.ancestors()
  nodes.addClass('hover-selected')
  cy.elements().not(nodes).not(parents).addClass('hover')
}

const addToHistory = (data) => {
  historyList.push(data)
  if(document.querySelector('#history').style.display != 'none') {
    let element = createHistoryRowElement(data)
    let list = document.getElementById('history-list')
    list.insertBefore(element, list.firstChild)
  }
  // if(historyList.length > 1) {
  //   document.querySelector('.undo').classList.remove('hide')
  // }
}

const createHistoryRowElement = (data) => {
  let element = document.createElement('div')
  element.className = 'history-row'
  // commit icon
  let commitIconDiv = document.createElement('div')
  commitIconDiv.innerHTML = '<img src="../image/git-commit.png">'
  // commit id
  let commitIdDiv = document.createElement('div')
  commitIdDiv.className = 'commit-id'
  let index = data.version.lastIndexOf('-')
  let commitId = data.version.slice(index + 1, index + 8)
  commitIdDiv.textContent = commitId
  // commit date
  let commitDateDiv = document.createElement('div')
  commitDateDiv.className = 'commit-date'
  let commitDate = data.version.slice(0, 10)
  commitDateDiv.textContent = 'on ' + commitDate
  // append
  let commitDiv = document.createElement('div')
  commitDiv.className = 'history-commit'
  commitDiv.appendChild(commitIconDiv)
  commitDiv.appendChild(commitIdDiv)
  commitDiv.appendChild(commitDateDiv)
  element.appendChild(commitDiv)
  // package name
  if(data.package !== '') {
    let packageDiv = document.createElement('div')
    packageDiv.className = 'package'
    packageDiv.textContent = data.package
    element.appendChild(packageDiv)
  }
  // package class
  if(data.class !== '') {
    let classDiv = document.createElement('div')
    classDiv.className = 'class'
    classDiv.textContent = data.class
    element.appendChild(classDiv)
  }
  element.setAttribute('data-version', data.version)
  element.setAttribute('data-package', data.package)
  element.setAttribute('data-class', data.class)
  element.addEventListener('click', () => {
    if(data.class !== '') {
      // class level
      initGraph(data.version, data.package, `${data.package}.${data.class}`, 'showLabels')
    } else if(data.package !== '') {
      //package level
      initGraph(data.version, data.package, '', 'showLabels')
    } else {
      // system level
      initGraph(data.version, '', '', 'hideLabels')
    }
  })
  return element
}

const empty = (elements) => {
  elements.forEach(ele => {
    document.querySelector(ele).innerHTML = ''
  })
}

const showHistory = () => {
  document.getElementById('history-list').innerHTML = ''
  _.each(_.clone(historyList).reverse(), (data) => {
    let element = createHistoryRowElement(data)
    document.getElementById('history-list').appendChild(element)
  })
  setVisible('#history', true, false)
  setVisible('.close', true, false)
}

const clearHistory = () => {
  historyList = []
  empty(['#history-list'])
}

let timelineOption = 'switchVersion'
const toggleTimeline = () => {
  if(document.querySelector('.toggle-timeline input').checked) {
    timelineOption = 'compareVersion'
  } else {
    timelineOption = 'switchVersion'
  }
}

const changeLayout = (option) => {
  setVisible('.loader', true, false)
  currentLayoutName = option
  if(option === 'klay') {
    document.querySelector('[data-option="hierarchy"]').className = ''
    currentLayoutOptions = klay
  } else {
    document.querySelector('[data-option="klay"]').className = ''
    currentLayoutOptions = hierarchy
  }
  document.querySelector(`[data-option="${option}"]`).classList.add('selected-option')
  cy.layout(currentLayoutOptions).run()
  moveGraph()
}

const resizeNodes = (option) => {
  setVisible('.loader', true, false)
  currentMetric = option
  cy.startBatch()
  document.querySelector(`[data-option="${option}"]`).classList.add('selected-option')
  if(option === 'rolesOnly') {
    document.querySelector('[data-option="linesOfCode"]').className = ''
    cy.nodes().not(':parent').style({
      'height' : 30,
      'width' : 30
    })
  } else {
    document.querySelector('[data-option="rolesOnly"]').className = ''
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
  cy.layout(currentLayoutOptions).run()
  moveGraph()
}

let filterRoleList = ['Controller', 'Coordinator', 'Information Holder', 'Interfacer', 'Service Provider', 'Structurer']
const filterRole = (role) => {
  if(document.querySelector(`[data-role="${role}"]`).classList.contains('filtered')) {
    filterRoleList.push(role)
    document.querySelector(`[data-role="${role}"]`).classList.remove('filtered')
  } else {
    _.remove(filterRoleList, ele => ele == role )
    document.querySelector(`[data-role="${role}"]`).classList.add('filtered')
  }
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
  cy.layout(currentLayoutOptions).run()
  moveGraph()
}

const toggleLabelVisibility = (option) => {
  setVisible('.loader', true, false)
  if(option === 'hideLabels') {
    document.querySelector('[data-option="showLabels"]').className = ''
    cy.nodes().removeClass('showLabel')
  } else {
    document.querySelector('[data-option="hideLabels"]').className = ''
    cy.nodes().addClass('showLabel')
  }
  currentLabelVisibility = option
  document.querySelector(`[data-option="${option}"]`).classList.add('selected-option')
  cy.layout(currentLayoutOptions).run()
  moveGraph()
}

const toggleChangedClassHightlight = (option) => {
  document.querySelector('[data-option="highlightOn"]').className = ''
  document.querySelector('[data-option="highlightOff"]').className = ''
  document.querySelector(`[data-option="${option}"]`).classList.add('selected-option')
  if(option ==='highlightOn') {
    axios.get(`/api/data/roleChanged/${selectedVersion}`)
    .then((res) => {
      let list = res.data
      list.forEach(ele => {
        cy.$id(ele).addClass('highlight')
      })
      // flash the border ten times and stop
      _.times(10, () => {
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
        toggleChangedClassHightlight('highlightOff')
      }, 15000)
    })
  } else {
    cy.nodes().removeClass('highlight')
  }
}

const resetTools = () => {
  // closeOpenedDialog()
  // tool dialog
  let classLevelElements = document.querySelectorAll('.class-level')
  for(var i = 0; i < classLevelElements.length; i++) {
    if(level === 'class') {
      classLevelElements[i].classList.remove('disabled')
    } else {
      classLevelElements[i].classList.add('disabled')
    }
  }
  let selectedOptions = document.getElementsByClassName('selected-option')
  while(selectedOptions.length > 0){
    selectedOptions[0].classList.remove('selected-option')
  }
  selectedOptions = document.getElementsByClassName('filtered')
  while(selectedOptions.length > 0){
    selectedOptions[0].classList.remove('filtered')
  }
  currentLabelVisibility = 'hideLabels'
  currentMetric = 'rolesOnly'
  document.querySelector(`[data-option="${currentLayoutName}"]`).classList.add('selected-option')
  document.querySelector(`[data-option="${currentLabelVisibility}"]`).classList.add('selected-option')
  document.querySelector(`[data-option="${currentMetric}"]`).classList.add('selected-option')
  document.querySelector('[data-option="highlightOff"]').classList.add('selected-option')
  document.querySelector('[data-option="1"]').classList.add('selected-option')
  document.querySelector('[data-option="all"]').classList.add('selected-option')
  for (let role of roleMap.keys()) {
    document.querySelector(`[data-role="${role}"]`).classList.add('selected-option')
  }

  filterRoleList = ['Controller', 'Coordinator', 'Information Holder', 'Interfacer', 'Service Provider', 'Structurer']

  // code dialog
  document.querySelector('#sourceCode').classList.remove('view')
  // codeViewingOption = 'single'
  document.getElementById('view').innerHTML = ''

  // compare dialog
  emptyCompareList()
  setVisible('.code-compare', false, false)

  // pattern dialog
  // empty chart and update ranking lists
  empty(['.chart-div'])
  updateRankingList()
}

const emptyCompareList = () => {
  document.querySelector('#compare .version-selected').innerHTML = ''
  document.querySelector('#compare .version-options-list').innerHTML = ''
  document.querySelector('#compare .version-options-list').className = 'version-options-list'
  document.querySelector('#compare .version-select-text').classList.remove('hide')
  setVisible('#compare .list-view-options', false, false)
  setVisible('#compare .change-lists', false, false)
  document.querySelector('.list-view-options .selected-view').classList.remove('selected-view')
  document.querySelector('.list-view-options .all').classList.add('selected-view')
  resetListCount()
  resetListIcon()
  clearChangeLists()
}

const updateDependencyLevel = (dependencyLevel) => {
  if(level === 'class') {
    let labelVisibility = document.querySelector('.label-visibility .selected-option').getAttribute('data-option')
    let type = document.querySelector('.dep-type .selected-option').getAttribute('data-option')
    updateClassGraph(dependencyLevel, type, true, labelVisibility)
    document.querySelector('.dep-level .selected-option').className = ''
    document.querySelector(`[data-option="${dependencyLevel}"]`).classList.add('selected-option')
  }
}

const updateDependencyType = (type) => {
  if(level === 'class') {
    let labelVisibility = document.querySelector('.label-visibility .selected-option').getAttribute('data-option')
    let dependencyLevel = document.querySelector('.dep-level .selected-option').getAttribute('data-option')
    updateClassGraph(dependencyLevel, type, true, labelVisibility)
    document.querySelector('.dep-type .selected-option').className = ''
    document.querySelector(`[data-option="${type}"]`).classList.add('selected-option')
  }
}

const showGuide = () => {
  setVisible('.close', true, false)
  setVisible('#guide', true, false)
  const swiper = new Swiper('.swiper-container', {
    pagination: {
      el: '.swiper-pagination',
      type: 'progressbar',
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    }
  });
}