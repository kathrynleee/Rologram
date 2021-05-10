'use strict'

import './assets/styles/main.scss'
import graph from './scripts/graph'
import api from './scripts/api'
import dom from './scripts/update'
import tools from './scripts/tools'
import { remove } from 'lodash'
import pattern from './scripts/pattern'
import compare from './scripts/compare'

let data = {
  cy: null,
  level: 'system', // system, package, class
  selectedVersion: '',
  selectedPackage: '',
  selectedClass: '',
  historyList: [],
  filterRoleList: [],
  system: {
    username: '',
    versionList: []
  },
  patterns: {
    level: 1,
    options: []
  },
  roleMap: new Map([
    ['Controller', '#755194'], ['Coordinator', '#539967'], 
    ['Information Holder', '#BF3F6A'], ['Interfacer', '#E9AB45'],
    ['Service Provider', '#4D82B0'], ['Structurer', '#E6A1b2']
  ]),
  options: {
    layout: 'klay', // klay, hierarchy
    labelVisibility: 'hideLabels', // showLabels, hideLabels
    metric: 'rolesOnly', // rolesOnly, linesOfCode
    highlight: 'highlightOff',
    dependencyLevel: 1, // 1, 2, 3
    edgeType: 'all', // all, in, out
    timeline: 'switchVersion', // switchVersion, compareVersion
    codeViewing: 'single' // single, compare
  }
}
data.filterRoleList = [ ...data.roleMap.keys() ]
data.patterns.options = [ [...data.roleMap.keys()] ]

document.addEventListener('DOMContentLoaded', async () => {
  // get github username for the system
  let userName = await api.getUsername()
  data.system.username = userName.data
  // get version list
  let versions = await api.getVersions()
  data.system.versionList = versions.data
  // set the last version as the current version
  data.selectedVersion = data.system.versionList[data.system.versionList.length - 1]
  // initialise cytoscape
  await graph.createGraph(data)
  // update graph
  await graph.init(data)
  // create legend
  dom.createLegend(data.cy, data.roleMap)
  // add event listener
  addEventListeners()
})

function addEventListeners () {
  /*****  menu *****/
  document.querySelector('.menu [data-text="Pattern"]').addEventListener('click', () => {
    dom.showPatternDialog(data.patterns.level)
  })
  document.querySelector('.menu [data-text="Guide"]').addEventListener('click', () => {
    dom.showGuide()
  })
  document.querySelector('.menu [data-text="Code"]').addEventListener('click', () => {
    dom.openSourceCodeDialog()
  })
  document.querySelector('.menu [data-text="Tools"]').addEventListener('click', () => {
    dom.showTools()
  })
  document.querySelector('.menu [data-text="Compare"]').addEventListener('click', () => {
    dom.showCompareDialog()
  })
  document.querySelector('.menu [data-text="Download"]').addEventListener('click', () => {
    tools.download(data.cy, data.level, data.selectedVersion, data.selectedPackage, data.selectedClass)
  })
  document.querySelector('.menu [data-text="History"]').addEventListener('click', () => {
    dom.showHistory()
  })
  /*****  history dialog *****/
  document.querySelector('.history-clear').addEventListener('click', () => {
    data.historyList = []
    dom.clearHistoryList()
  })
  document.querySelector('.history-export').addEventListener('click', () => {
    tools.exportHistory(data.historyList)
  })
  /*****  tools dialog *****/
  // layout
  document.querySelector('[data-option="hierarchy"]').addEventListener('click', () => {
    data.options.layout = 'hierarchy'
    graph.runLayout(data.cy, 'hierarchy')
    dom.updateLayout('hierarchy')
  })
  document.querySelector('[data-option="klay"]').addEventListener('click', () => {
    data.options.layout = 'klay'
    graph.runLayout(data.cy, 'klay')
    dom.updateLayout('klay')
  })
  // label visibility
  document.querySelector('[data-option="showLabels"]').addEventListener('click', () => {
    data.options.labelVisibility = 'showLabels'
    graph.updateNodeLabelVisibility(data.cy, 'showLabels', data.options.layout)
    dom.updateLabelVisibility('showLabels')
  })
  document.querySelector('[data-option="hideLabels"]').addEventListener('click', () => {
    data.options.labelVisibility = 'hideLabels'
    graph.updateNodeLabelVisibility(data.cy, 'hideLabels', data.options.layout)
    dom.updateLabelVisibility('hideLabels')
  })
  // metrics
  document.querySelector('[data-option="rolesOnly"]').addEventListener('click', () => {
    data.options.metric = 'rolesOnly'
    dom.updateMetric('rolesOnly')
    graph.resizeNodes(data.cy, 'rolesOnly', data.options.layout)
  })
  document.querySelector('[data-option="linesOfCode"]').addEventListener('click', () => {
    data.options.metric = 'linesOfCode'
    dom.updateMetric('linesOfCode')
    graph.resizeNodes(data.cy, 'linesOfCode', data.options.layout)
  })
  // filter roles 
  document.querySelector('[data-role="Controller"]').addEventListener('click', () => {
    filterRole('Controller')
  })
  document.querySelector('[data-role="Coordinator"]').addEventListener('click', () => {
    filterRole('Coordinator')
  })
  document.querySelector('[data-role="Information Holder"]').addEventListener('click', () => {
    filterRole('Information Holder')
  })
  document.querySelector('[data-role="Interfacer"]').addEventListener('click', () => {
    filterRole('Interfacer')
  })
  document.querySelector('[data-role="Service Provider"]').addEventListener('click', () => {
    filterRole('Service Provider')
  })
  document.querySelector('[data-role="Structurer"]').addEventListener('click', () => {
    filterRole('Structurer')
  })
  // highlight role changed classes
  document.querySelector('[data-option="highlightOn"]').addEventListener('click', () => {
    data.options.highlight = 'highlightOn'
    dom.updateClassHighlight('highlightOn')
    graph.showChangedClass(data.cy, data.selectedVersion, 'highlightOn')
  })
  document.querySelector('[data-option="highlightOff"]').addEventListener('click', () => {
    data.options.highlight = 'highlightOff'
    dom.updateClassHighlight('highlightOff')
    graph.showChangedClass(data.cy, data.selectedVersion, 'highlightOff')
  })
  // dependency type
  document.querySelector('[data-option="all"]').addEventListener('click', () => {
    if(data.level == 'class') {
      data.options.edgeType = 'all'
      dom.updateDependencyType('all')
      graph.updateClassGraph(data, true)
    }
  })
  document.querySelector('[data-option="in"]').addEventListener('click', () => {
    if(data.level == 'class') {
      data.options.edgeType = 'in'
      dom.updateDependencyType('in')
      graph.updateClassGraph(data, true)
    }
  })
  document.querySelector('[data-option="out"]').addEventListener('click', () => {
    if(data.level == 'class') {
      data.options.edgeType = 'out'
      dom.updateDependencyType('out')
      graph.updateClassGraph(data, true)
    }
  })
  // dependency level
  document.querySelector('[data-option="1"]').addEventListener('click', () => {
    if(data.level == 'class') {
      data.options.dependencyLevel = 1
      dom.updateDependencyLevel(1)
      graph.updateClassGraph(data, true)
    }
  })
  document.querySelector('[data-option="2"]').addEventListener('click', () => {
    if(data.level == 'class') {
      data.options.dependencyLevel = 2
      dom.updateDependencyLevel(2)
      graph.updateClassGraph(data, true)
    }
  })
  document.querySelector('[data-option="3"]').addEventListener('click', () => {
    if(data.level == 'class') {
      data.options.dependencyLevel = 3
      dom.updateDependencyLevel(3)
      graph.updateClassGraph(data, true)
    }
  })
  /*****  code dialog *****/
  document.querySelector('.close-code').addEventListener('click', () => {
    dom.closeSourceCodeDialog()
  })
  /*****  compare dialog *****/
  document.querySelector('.code-compare').addEventListener('click', () => {
    dom.openSourceCodeDialog()
    dom.showCodeView(data.level, 'compare')
    data.options.codeViewing = 'compare'
  })
  document.querySelector('.version-select-div').addEventListener('click', () => {
    compare.createSelect(data, data.level, data.selectedVersion)
  })
  // tabs
  document.querySelector('.list-view-options .all').addEventListener('click', () => {
    graph.updateChangeListView(data.cy, 'all', data.options.layout)
    dom.updateChangeListView('all')
  })
  document.querySelector('.list-view-options .added').addEventListener('click', () => {
    graph.updateChangeListView(data.cy, 'added', data.options.layout)
    dom.updateChangeListView('added')
  })
  document.querySelector('.list-view-options .removed').addEventListener('click', () => {
    graph.updateChangeListView(data.cy, 'removed', data.options.layout)
    dom.updateChangeListView('removed')
  })
  document.querySelector('.list-view-options .role-changed').addEventListener('click', () => {
    graph.updateChangeListView(data.cy, 'role-changed', data.options.layout)
    dom.updateChangeListView('role-changed')
  })
  // change list 
  document.querySelector('.removed-div .change-list-group').addEventListener('click', () => {
    dom.toggleChangeList('removed')
  })
  document.querySelector('.added-div .change-list-group').addEventListener('click', () => {
    dom.toggleChangeList('added')
  })
  document.querySelector('.role-changed-div .change-list-group').addEventListener('click', () => {
    dom.toggleChangeList('role-changed')
  })
  /*****  pattern dialog *****/
  document.querySelector('.pattern-tab.define').addEventListener('click', () => {
    dom.switchPatternTab(data, 'define')
  })
  document.querySelector('.pattern-tab.ranking').addEventListener('click', () => {
    dom.switchPatternTab(data, 'ranking')
  })
  document.querySelector('.pattern-tab.common').addEventListener('click', () => {
    dom.switchPatternTab(data, 'common')
  })
  // define pattern
  document.querySelector('[data-pattern-level="1"] [data-role="Controller"]').addEventListener('click', () => {
    data.patterns = pattern.togglePatternRole(data.patterns, 1, 'Controller')
  })
  document.querySelector('[data-pattern-level="1"] [data-role="Coordinator"]').addEventListener('click', () => {
    data.patterns = pattern.togglePatternRole(data.patterns, 1, 'Coordinator')
  })
  document.querySelector('[data-pattern-level="1"] [data-role="Information Holder"]').addEventListener('click', () => {
    data.patterns = pattern.togglePatternRole(data.patterns, 1, 'Information Holder')
  })
  document.querySelector('[data-pattern-level="1"] [data-role="Interfacer"]').addEventListener('click', () => {
    data.patterns = pattern.togglePatternRole(data.patterns, 1, 'Interfacer')
  })
  document.querySelector('[data-pattern-level="1"] [data-role="Service Provider"]').addEventListener('click', () => {
    data.patterns = pattern.togglePatternRole(data.patterns, 1, 'Service Provider')
  })
  document.querySelector('[data-pattern-level="1"] [data-role="Structurer"]').addEventListener('click', () => {
    data.patterns = pattern.togglePatternRole(data.patterns, 1, 'Structurer')
  })
  document.querySelector('.add-remove .add').addEventListener('click', () => {
    data.patterns = pattern.changePatternLevel(1, data.patterns, data.roleMap)
  })
  document.querySelector('.add-remove .remove').addEventListener('click', () => {
    data.patterns = pattern.changePatternLevel(-1, data.patterns, data.roleMap)
  })
  document.querySelector('.apply-cancel .apply').addEventListener('click', () => {
    pattern.applyPattern(data, data.patterns.level, data.patterns.options)
  })
  document.querySelector('.apply-cancel .cancel').addEventListener('click', () => {
    graph.removePattern(data.cy, data.options.layout)
  })
  document.querySelector('.ranking-level.level-one .ranking-level-toggle').addEventListener('click', () => {
    dom.togglePatternRanking('level-one')
  })
  document.querySelector('.ranking-level.level-two .ranking-level-toggle').addEventListener('click', () => {
    dom.togglePatternRanking('level-two')
  })
  /*****  button *****/
  // close button
  document.querySelector('.close').addEventListener('click', () => {
    dom.closeOpenedDialog()
  })
  document.querySelector('.close-code').addEventListener('click', () => {
    dom.closeSourceCodeDialog()
  })
  // timeline toggle button
  document.querySelector('.toggle-timeline input').addEventListener('click', () => {
    data.options.timeline = tools.toggleTimeline()
  })
  /*****  animation *****/
  // document.querySelector('.animation-div').addEventListener('mouseover', () => {
  //   dom.setVisible('#animation', true, false)
  // })
  // document.querySelector('.animation-div').addEventListener('mouseout', () => {
  //   dom.setVisible('#animation', false, false)
  // })
  // document.querySelector('.play-button').addEventListener('click', () => {
  //   startAnimation()
  // })
  // document.querySelector('.stop-button').addEventListener('click', () => {
  //   // graph.init(data)
  //   // dom.createCurrentIndicator(data.selectedVersion)
  // })
  // document.querySelector('.previous').addEventListener('click', () => {

  // })
  // document.querySelector('.next').addEventListener('click', () => {

  // })
}

function filterRole(role) {
  if(!data.filterRoleList.includes(role)) {
    data.filterRoleList.push(role)
  } else {
    remove(data.filterRoleList, ele => ele == role)
  }
  graph.filterRole(data.cy, data.filterRoleList, data.options.layout)
  dom.updateFilterRole(role)
}