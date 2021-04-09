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
    _.remove(patternOptions[patternLevel - 1], r => r === role)
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
  if(patternLevel === 1) {
    setVisible('.pattern-buttons .remove', false, false)
  } else {
    setVisible('.pattern-buttons .remove', true, false)
  }
  if(patternLevel === 3) {
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

const applyPattern = async() => {
  axios.post('/api/data/pattern', { level: patternLevel, options: patternOptions })
    .then((res) => {
      createChart(res.data)
    })
  applyPatternToGraph(patternLevel)
}

const removePattern = () => {
  cy.startBatch()
  cy.elements().removeClass('hide')
  cy.endBatch()
  cy.layout(currentLayoutOptions).run()
}

const applyPatternToGraph = (patternLevel) => {
  cy.startBatch()
  cy.elements().removeClass('hide')
  if(patternLevel === 1) {
    var pattern = _.map(patternOptions[0], n => `[role = "${n}"]`)
    var nodes = cy.nodes().filter(`${pattern}`)
    var edges = nodes.connectedEdges()
  } else if(patternLevel === 2) {
    var edges = cy.edges().filter(edge => _.includes(patternOptions[0], edge.data('fromRole')) && _.includes(patternOptions[1], edge.data('toRole')))
    var nodes = edges.connectedNodes()
  } else if(patternLevel === 3) {
    var edges = cy.edges().filter(edge => _.includes(patternOptions[0], edge.data('fromRole')) && _.includes(patternOptions[1], edge.data('toRole')))
    _.forEach(edges, edge => {
      var secondEdges = cy.edges().filter(ele => (ele.data('source') === edge.data('target')) && _.includes(patternOptions[2], ele.data('toRole')))
      if(secondEdges.length === 0) {
        edges = edges.filter(ele => ele !== edge)
      } else {
        edges = secondEdges.union(edges)
      }
    })
    nodes = edges.connectedNodes()
  }
  var parents = (nodes !== undefined) ? nodes.ancestors() : []
  cy.elements().not(nodes).not(edges).not(parents).addClass('hide')
  cy.endBatch()
  cy.layout(currentLayoutOptions).run()
}

const createChart = async (results) => {
  document.querySelector('.chart-div').innerHTML = ''
  let data = {
    labels: _.map(results, 'version'),
    series: [
      _.map(results, 'count')
    ]
  }
  let options = {
    fullWidth: true,
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
        labelInterpolationFnc: (value) => (typeof value === "undefined") ? "0" : value
      })
    ]
  }
  new Chartist.Line('.chart-div', data, options)
}