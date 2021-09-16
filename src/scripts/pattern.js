'use strict'

import Chartist from 'chartist'
import 'chartist-plugin-pointlabels'
import 'chartist/dist/scss/chartist.scss'
import dom from './update.js'
import { map, remove } from 'lodash'
import api from './api.js'
import graph from './graph.js'

class Pattern {
  changePatternLevel(num, patterns, roleMap) {
    if(num < 0 && patterns.level > 1) {
      patterns = this.removeOneLevel(patterns)
    } else if(num > 0) {
      patterns = this.addOneLevel(patterns, roleMap)
    }
    dom.checkButton(patterns.level)
    return patterns
  }

  removeOneLevel(patterns) {
    if(patterns.level > 1) {
      dom.updatePatternCount('remove')
      patterns.options.splice(-1)
      patterns.level--
    }
    return patterns
  }

  addOneLevel(patterns, roleMap) {
    patterns.level++
    let patternLevel = patterns.level
    let patternOptions = patterns.options
    if(patterns.level <= 3) {
      patternOptions[patternLevel - 1] = [...roleMap.keys()]
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
          patterns = this.togglePatternRole(patterns, patternLevel, role)
        })
        patternRoleDiv.appendChild(roleDiv)
      }
      patternSelectDiv.appendChild(patternRoleDiv)
    }
    return patterns
  }

  togglePatternRole(patterns, level, role) {
    if(_.includes(patterns.options[level - 1], role)) {
      remove(patterns.options[level - 1], r => r == role)
    } else {
      patterns.options[level - 1].push(role)
    }
    dom.updatePatternRole(level, role)
    return patterns
  }

  async updateRankingList(data) {
    // clear ranking lists
    dom.resetRankingLists()
    // get ranking data
    let levelOneList = await api.getRankingList(2, data.selectedVersion)
    let levelTwoList = await api.getRankingList(3, data.selectedVersion)
    // create ranking lists
    dom.createRankingList(data, '.level-one', levelOneList.data)
    dom.createRankingList(data, '.level-two', levelTwoList.data)
  }

  commonPatternList() {
    let list = [
      [['Interfacer'], ['Controller'], ['Information Holder']],
      [['Coordinator'], ['Interfacer'], ['Service Provider']],
      [['Interfacer'], ['Service Provider'], ['Information Holder']]
    ]
    return list
  }

  async applyPattern(data, level, options) {
    let res = await api.getPatternData(level, options)
    this.createChart(res.data)
    data.level = 'system'
    data.selectedPackage = ''
    data.selectedClass = ''
    await graph.init(data)
    graph.applyPatternToGraph(data.cy, level, options, data.options.layout)
    // always show edges for pattern
    data.options.edgeVisibility = 'showEdges'
    graph.updateEdgeVisibility(data.cy, 'showEdges', data.options.layout)
    dom.updateEdgeVisibility('showEdges')
  }

  createChart(results) {
    dom.empty(['.chart-div'])
    let data = {
      labels: map(results, 'label'),
      series: [
        map(results, 'count')
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
}

export default new Pattern()