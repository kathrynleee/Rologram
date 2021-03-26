'use strict'

const showSourceCode = async () => {
  setVisible('#sourceCode', true, true)
  setVisible('#sourceCode .code', false)
  setVisible('#sourceCode .not-found', false)
  if(level !== 'class') {
    setVisible('#sourceCode .not-found', true)
    document.querySelector('#sourceCode .not-found').textContent = 'Source code only available for classes'
  } else {
    const code = await displaySourceCode()
    if(code !== undefined) {
      setVisible('#sourceCode .code', true)
      if(codeEditor !== undefined) {
        codeEditor.getWrapperElement().remove()
        codeEditor = undefined
      }
      codeEditor = CodeMirror.fromTextArea(document.getElementById('editor'), {
        mode: 'text/x-java',
        theme: 'eclipse',
        lineNumbers: true,
        lineWrapping: true,
        readOnly: 'nocursor'
      })
      codeEditor.setValue(code.data)
    } else {
      setVisible('#sourceCode .not-found', true)
      document.querySelector('#sourceCode .not-found').textContent = 'Not found'
    }
  }
}

const displaySourceCode = async () => {
  const index = selectedVersion.lastIndexOf('-')
  const systemName = selectedVersion.slice(11, index)
  const commitId = selectedVersion.slice(index + 1)
  let className = selectedClass
  // handle inner class
  if(selectedClass.indexOf('$') !== -1) {
    className = className.slice(0, selectedClass.indexOf('$'))
  }
  const filePath = className.split('.').join('/') + '.java'
  const paths = await getPaths()
  // try main path
  const ownerName = paths.data[0]
  let i = 0, path, url, code
  do {
    i = i + 1
    path = paths.data[i]
    url = `https://raw.githubusercontent.com/${ownerName}/${systemName}/${commitId}/${path}/${filePath}`
    code = await getSourceCode(url)
  } while (code === undefined && i < paths.data.length)
  return code
}

const showTools = () => {
  setVisible('#tools', true)
}

const closeDialog = (id) => {
  setVisible(`#${id}.dialog`, false)
}

const closeOpenedDialog = () => {
  let eles = document.getElementsByClassName('dialog')
  for (var i = 0; i < eles.length; i++) {
    eles[i].style.display = 'none'
  }
}

const download = () => {
  let png64 = cy.png()
  let link = document.createElement('a')
  document.body.appendChild(link)
  link.setAttribute("type", 'hidden')
  link.href = `${png64}`
  link.download = 'graph.png'
  link.click()
  document.body.removeChild(link)
}

const setVisible = (selector, visible, flex) => {
  if(visible && flex) {
    document.querySelector(selector).style.display = 'flex'
  } else {
    document.querySelector(selector).style.display = visible ? 'block' : 'none'
  }
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
}

const createHistoryRowElement = (data) => {
  let element = document.createElement('div')
  element.className = 'history-row'
  // commit icon
  let commitIconDiv = document.createElement('div')
  commitIconDiv.innerHTML = '<img alt="Octicons-git-commit" src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Octicons-git-commit.svg/512px-Octicons-git-commit.svg.png">'
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
      initGraph(data.version, data.package, `${data.package}.${data.class}`)
    } else {
      initGraph(data.version, data.package, '')
    }
  })
  return element
}

const showHistory = () => {
  document.getElementById('history-list').innerHTML = ''
  _.each(_.clone(historyList).reverse(), (data) => {
    let element = createHistoryRowElement(data)
    document.getElementById('history-list').appendChild(element)
  })
  setVisible('#history', true)
}

const changeLayout = (option) => {
  document.querySelector(`[data-option="${option}"]`).classList.add('selected-option')
  if(option === 'klay') {
    document.querySelector('[data-option="hierarchy"]').className = ''
    currentLayoutOptions = options
  } else {
    document.querySelector('[data-option="klay"]').className = ''
    const hierarchyOptions = _.cloneDeep(options)
    hierarchyOptions.klay.layoutHierarchy = true
    currentLayoutOptions = hierarchyOptions
  }
  cy.layout(currentLayoutOptions).run()
}

const resizeNodes = (option) => {
  document.querySelector(`[data-option="${option}"]`).classList.add('selected-option')
  if(option === 'rolesOnly') {
    document.querySelector('[data-option="linesOfCode"]').className = ''
    cy.nodes().style({
      'height' : 30,
      'width' : 30
    })
  } else {
    document.querySelector('[data-option="rolesOnly"]').className = ''
    cy.nodes().style({
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
  cy.layout(currentLayoutOptions).run()
}

const filterRole = (role) => {
  cy.startBatch()
  cy.nodes().removeClass('hide')
  if(document.querySelector(`[data-role="${role}"]`).classList.contains('filtered')) {
    document.querySelector(`[data-role="${role}"]`).classList.remove('filtered')
    cy.nodes(`[role="${role}"]`).removeClass('filter')
  } else {
    document.querySelector(`[data-role="${role}"]`).classList.add('filtered')
    cy.nodes(`[role="${role}"]`).addClass('filter')
  }
  const parents = cy.nodes().not('.filter').not('.hide').ancestors()
  cy.nodes(':compound').not(parents).addClass('hide')
  cy.endBatch()
  cy.layout(currentLayoutOptions).run()
}

const toggleLabelVisibility = (option) => {
  document.querySelector(`[data-option="${option}"]`).classList.add('selected-option')
  if(option === 'hideLabels') {
    document.querySelector('[data-option="showLabels"]').className = ''
    cy.nodes().removeClass('showLabel')
  } else {
    document.querySelector('[data-option="hideLabels"]').className = ''
    cy.nodes().addClass('showLabel')
  }
  cy.layout(currentLayoutOptions).run()
}

const resetTools = () => {
  let selectedOptions = document.getElementsByClassName('selected-option')
  while(selectedOptions.length > 0){
    selectedOptions[0].classList.remove('selected-option')
  }
  selectedOptions = document.getElementsByClassName('filtered')
  while(selectedOptions.length > 0){
    selectedOptions[0].classList.remove('filtered')
  }
  document.querySelector('[data-option="klay"]').classList.add('selected-option')
  document.querySelector('[data-option="hideLabels"]').classList.add('selected-option')
  document.querySelector('[data-option="rolesOnly"]').classList.add('selected-option')
  document.querySelector('[data-option="1"]').classList.add('selected-option')
  document.querySelector('[data-option="all"]').classList.add('selected-option')
  document.querySelector('[data-option="all"]').classList.add('selected-option')
  for (let role of roleMap.keys()) {
    document.querySelector(`[data-role="${role}"]`).classList.add('selected-option')
  }
  currentLayoutOptions = options
  createSelect()
  document.querySelector('#compare .changeList').innerHTML = ''
}

const updateDependencyLevel = (dependencyLevel) => {
  if(level === 'class') {
    const labelVisibility = document.querySelector('.label-visibility .selected-option').getAttribute('data-option')
    const type = document.querySelector('.dep-type .selected-option').getAttribute('data-option')
    updateClassGraph(dependencyLevel, type, true, labelVisibility)
    document.querySelector('.dep-level .selected-option').className = ''
    document.querySelector(`[data-option="${dependencyLevel}"]`).classList.add('selected-option')
  }
}

const updateDependencyType = (type) => {
  if(level === 'class') {
    const labelVisibility = document.querySelector('.label-visibility .selected-option').getAttribute('data-option')
    const dependencyLevel = document.querySelector('.dep-level .selected-option').getAttribute('data-option')
    updateClassGraph(dependencyLevel, type, true, labelVisibility)
    document.querySelector('.dep-type .selected-option').className = ''
    document.querySelector(`[data-option="${type}"]`).classList.add('selected-option')
  }
}