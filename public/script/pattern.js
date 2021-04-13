'use strict'

let patternLevel = 1
let patternOptions = [ [...roleMap.keys()] ]

const showPatternDialog = async () => {
  setVisible('#pattern', true, false)
  setVisible('.close', true, false)
  checkButton()
  moveGraph()
}

const changePatternLevel = (num) => {
  if(num < 0 && patternLevel > 1) {
    removeOneLevel()
  } else if(num > 0) {
    addOneLevel()
  }
  checkButton()
}

const togglePatternRole = (patternLevel, role) => {
  if(_.includes(patternOptions[patternLevel - 1], role)) {
    _.remove(patternOptions[patternLevel - 1], r => r == role)
  } else {
    patternOptions[patternLevel - 1].push(role)
  }
  let element = document.querySelector(`.pattern-role[data-pattern-level="${patternLevel}"] [data-role="${role}"]`)
  if(element.classList.contains('removed')) {
    element.classList.remove('removed')
  } else {
    element.classList.add('removed')
  }
}

const removeOneLevel = () => {
  let patternCountDiv = document.querySelector('.pattern-count')
  patternCountDiv.removeChild(patternCountDiv.lastElementChild)
  let patternSelectDiv = document.querySelector('.pattern-select')
  patternSelectDiv.removeChild(patternSelectDiv.lastElementChild)
  patternOptions.splice(-1)
  patternLevel--
}

const checkButton = () => {
  if(patternLevel == 1) {
    setVisible('.pattern-buttons .remove', false, false)
  } else {
    setVisible('.pattern-buttons .remove', true, false)
  }
  if(patternLevel == 3) {
    setVisible('.pattern-buttons .add', false, false)
  } else {
    setVisible('.pattern-buttons .add', true, false)
  }
}

const addOneLevel = () => {
  if(patternLevel < 3) {
    patternOptions[++patternLevel - 1] = [...roleMap.keys()]
    let patternCountDiv = document.querySelector('.pattern-count')
    let group = document.createElement('div')
    group.className = 'pointer-group'
    let divider = document.createElement('div')
    divider.className = 'divider'
    let arrow = document.createElement('div')
    arrow.className = 'arrow'
    let pointer = document.createElement('div')
    pointer.className = 'pointer'
    pointer.textContent = patternLevel
    group.appendChild(divider)
    group.appendChild(arrow)
    group.appendChild(pointer)
    patternCountDiv.appendChild(group)

    let patternSelectDiv = document.querySelector('.pattern-select')
    let patternRoleDiv = document.createElement('div')
    patternRoleDiv.className = 'pattern-role'
    patternRoleDiv.setAttribute('data-pattern-level', patternLevel)

    for (let role of roleMap.keys()) {
      let roleDiv = document.createElement('div')
      roleDiv.className = 'pattern-role-option'
      roleDiv.setAttribute('data-role', role)
      roleDiv.addEventListener('click', () => {
        togglePatternRole(patternRoleDiv.getAttribute('data-pattern-level'), role)
      })
      patternRoleDiv.appendChild(roleDiv)
    }
    patternSelectDiv.appendChild(patternRoleDiv)
  }
}

const applyPattern = async(level, options) => {
  if(level == undefined && options == undefined) {
    level = patternLevel
    options = patternOptions
  }
  cy.remove(cy.elements())
  setVisible('.loader', true, false)
  await initGraph(selectedVersion, '', '')
  axios.post('/api/data/pattern', { level: level, options: options })
    .then((res) => {
      createChart(res.data)
    })
  applyPatternToGraph(level, options)
}

const removePattern = () => {
  cy.startBatch()
  cy.elements().removeClass('hide')
  cy.endBatch()
  cy.layout(currentLayoutOptions).run()
}

const applyPatternToGraph = (level, options) => {
  cy.startBatch()
  // cy.remove(cy.elements())
  // cy.add(versionElements)
  if(level == 1) {
    var pattern = _.map(options[0], n => `[role = "${n}"]`)
    var nodes = cy.nodes().filter(`${pattern}`)
    var edges = nodes.connectedEdges()
  } else if(level == 2) {
    var edges = cy.edges().filter(edge => _.includes(options[0], edge.data('fromRole')) && _.includes(options[1], edge.data('toRole')))
    var nodes = edges.connectedNodes()
  } else if(level == 3) {
    var edges = cy.edges().filter(edge => _.includes(options[0], edge.data('fromRole')) && _.includes(options[1], edge.data('toRole')))
    _.forEach(edges, edge => {
      var secondEdges = cy.edges().filter(ele => (ele.data('source') == edge.data('target')) && _.includes(options[2], ele.data('toRole')))
      if(secondEdges.length == 0) {
        edges = edges.filter(ele => ele != edge)
      } else {
        edges = secondEdges.union(edges)
      }
    })
    nodes = edges.connectedNodes()
  }
  var parents = (nodes != undefined) ? nodes.ancestors() : []
  cy.elements().not(nodes).not(edges).not(parents).addClass('hide')
  cy.endBatch()
  cy.layout(currentLayoutOptions).run()
}

const createChart = async (results) => {
  document.querySelector('.chart-div').innerHTML = ''
  let data = {
    labels: _.map(results, 'label'),
    series: [
      _.map(results, 'count')
    ]
  }
  let options = {
    // fullWidth: true,
    height: '250px',
    axisX: { showGrid: false, showLabel: false },
    axisY: { showGrid: true, showLabel: true },
    chartPadding: {
      top: 30,
      left: 0,
      right: 30
    },
    plugins: [ 
      Chartist.plugins.ctPointLabels({ 
        textAnchor: 'middle',
        labelInterpolationFnc: (value) => (typeof value == "undefined") ? "0" : value
      })
    ]
  }
  new Chartist.Line('.chart-div', data, options)
}

const switchPatternTab = (option) => {
  // empty chart, common patterns and ranking lists
  empty(['.chart-div', '.common-pattern-div'])
  let levelOneListElement = document.querySelector('.level-one .ranking-list')
  if(levelOneListElement != null) {
    levelOneListElement.parentNode.removeChild(levelOneListElement)
  }
  let levelTwoListElement = document.querySelector('.level-two .ranking-list')
  if(levelTwoListElement != null) {
    levelTwoListElement.parentNode.removeChild(levelTwoListElement)
  }
  // update arrow
  document.querySelector('.level-one .ranking-level-icon').textContent = 'keyboard_arrow_down'
  document.querySelector('.level-two .ranking-level-icon').textContent = 'keyboard_arrow_down'
  // add class to selected tab
  document.querySelector('.pattern-tabs .selected-pattern-tab').classList.remove('selected-pattern-tab')
  document.querySelector(`.pattern-tabs .${option}`).classList.add('selected-pattern-tab')
  // open corresponding view
  setVisible('.pattern-content-div', false, true)
  setVisible(`.pattern-content-div.${option}-pattern-div`, true, false)
  // get ranking list or common patterns
  if(option === 'ranking') {
    updateRankingList()
  } else if(option === 'common') {
    createCommonPatterns()
  }
}

const updateRankingList = () => {
  axios.get(`/api/data/pattern/2/${selectedVersion}`)
    .then((res) => {
      createRankingList('.level-one', res.data)
    })
  axios.get(`/api/data/pattern/3/${selectedVersion}`)
    .then((res) => {
      createRankingList('.level-two', res.data)
    })
}

const createRankingList = (element, data) => {
  let parentDiv = document.querySelector(element)
  let listDiv = document.createElement('div')
  listDiv.className = 'ranking-list hide'
  _.remove(data, ele => ele.count == 0)
  data.forEach(ele => {
    let rowDiv = document.createElement('div')
    rowDiv.className = 'ranking-pattern-row'
    let rolePatternDiv = document.createElement('div')
    rolePatternDiv.className = 'ranking-pattern'
    let roleCountDiv = document.createElement('div')
    roleCountDiv.className = 'ranking-count'
    roleCountDiv.textContent = ele.count
    for (let [index, value] of ele.pattern.entries()) {
      let roleDiv = document.createElement('div')
      roleDiv.className = 'pattern-role-option'
      roleDiv.setAttribute('data-role', value)
      rolePatternDiv.appendChild(roleDiv)
      if(index != ele.pattern.length -1) {
        let arrow = document.createElement('div')
        let arrowLine = document.createElement('div')
        arrow.className = 'arrow-right'
        arrowLine.className = 'arrow-line'
        rolePatternDiv.appendChild(arrowLine)
        rolePatternDiv.appendChild(arrow)
      }
    }
    rowDiv.appendChild(rolePatternDiv)
    rowDiv.appendChild(roleCountDiv)
    rowDiv.addEventListener('click', () => {
      let selected = document.querySelector('.selected-pattern')
      if(selected != null) {
        selected.classList.remove('selected-pattern')
      }
      applyPattern(ele.pattern.length, ele.pattern)
      rowDiv.classList.add('selected-pattern')
      document.querySelector('.pattern-tabs').scrollIntoView()
    })
    listDiv.appendChild(rowDiv)
  })
  parentDiv.appendChild(listDiv)
}

const createCommonPatterns = () => {
  let commonPatternList = 
  [[['Interfacer'], ['Controller'], ['Information Holder']],
  [['Interfacer'], ['Controller'], ['Service Provider']],
  [['Controller'], ['Coordinator'], ['Service Provider']],
  [['Controller'], ['Coordinator'], ['Information Holder']]]
  let parentDiv = document.querySelector('.common-pattern-div')
  commonPatternList.forEach(ele => {
    let rowDiv = document.createElement('div')
    rowDiv.className = 'common-pattern-row'
    for (let [index, value] of ele.entries()) {
      let roleDiv = document.createElement('div')
      roleDiv.className = 'pattern-role-option'
      roleDiv.setAttribute('data-role', value)
      roleDiv.setAttribute('data-index', index + 1)
      rowDiv.appendChild(roleDiv)
      if(index != ele.length -1) {
        let arrow = document.createElement('div')
        let arrowLine = document.createElement('div')
        arrow.className = 'arrow-right'
        arrowLine.className = 'arrow-line'
        rowDiv.appendChild(arrowLine)
        rowDiv.appendChild(arrow)
      }
    }
    rowDiv.addEventListener('click', () => {
      let selected = document.querySelector('.selected-pattern')
      if(selected != null) {
        selected.classList.remove('selected-pattern')
      }
      applyPattern(ele.length, ele)
      rowDiv.classList.add('selected-pattern')
    })
    parentDiv.appendChild(rowDiv)
  })
}

const togglePatternRanking = (element) => {
  if(document.querySelector(`.${element} .ranking-list`).classList.contains('hide')) {
    setVisible(`.${element} .ranking-list`, true, false)
    document.querySelector(`.${element} .ranking-level-icon`).textContent = 'keyboard_arrow_up'
  } else {
    setVisible(`.${element} .ranking-list`, false, false)
    document.querySelector(`.${element} .ranking-level-icon`).textContent = 'keyboard_arrow_down'
  }
}