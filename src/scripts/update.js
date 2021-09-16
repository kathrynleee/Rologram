'use strict'

import graph from './graph.js'
import compare from './compare.js'
import pattern from './pattern.js'
import Swiper from 'swiper/swiper-bundle.min.js'
import 'swiper/swiper-bundle.min.css'

let Dom = {
  updateLabelVisibility(labelVisibility) {
    document.querySelector('[data-option="hideLabels"]').className = ''
    document.querySelector('[data-option="showLabels"]').className = ''
    document.querySelector(`[data-option="${labelVisibility}"]`).classList.add('selected-option')
  },

  updateEdgeVisibility(edgeVisibility) {
    document.querySelector('[data-option="hideEdges"]').className = ''
    document.querySelector('[data-option="showEdges"]').className = ''
    document.querySelector(`[data-option="${edgeVisibility}"]`).classList.add('selected-option')
  },

  updateLayout(layout) {
    if(layout === 'klay') {
      document.querySelector('[data-option="hierarchy"]').className = ''
    } else {
      document.querySelector('[data-option="klay"]').className = ''
    }
    document.querySelector(`[data-option="${layout}"]`).classList.add('selected-option')
  },

  updateMetric(metric) {
    if(metric === 'linesOfCode') {
      document.querySelector('[data-option="rolesOnly"]').className = ''
    } else {
      document.querySelector('[data-option="linesOfCode"]').className = ''
    }
    document.querySelector(`[data-option="${metric}"]`).classList.add('selected-option')
  },

  updateFilterRole(role) {
    if(document.querySelector(`[data-role="${role}"]`).classList.contains('filtered')) {
      document.querySelector(`[data-role="${role}"]`).classList.remove('filtered')
    } else {
      document.querySelector(`[data-role="${role}"]`).classList.add('filtered')
    }
  },

  updateClassHighlight(option) {
    if(option === 'highlightOn') {
      document.querySelector('[data-option="highlightOff"]').className = ''
    } else {
      document.querySelector('[data-option="highlightOn"]').className = ''
    }
    document.querySelector(`[data-option="${option}"]`).classList.add('selected-option')
  },

  updateDependencyLevel(option) {
    document.querySelector('.dep-level .selected-option').classList.remove('selected-option')
    document.querySelector(`.dep-level [data-option="${option}"]`).classList.add('selected-option')
  },

  updateDependencyType(option) {
    document.querySelector('.dep-type .selected-option').className = ''
    document.querySelector(`.dep-type [data-option="${option}"]`).classList.add('selected-option')
  },

  showLoader() {
    this.setVisible('.loader', true, false)
  },
  hideLoader() {
    this.setVisible('.loader', false, false)
  },

  setVisible(selector, visible, selectAll) {
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
  },

  clearInfo() {
    // hide and empty package and class info
    document.querySelector('#info .class-id').classList.remove('show')
    this.empty(['#info .package', '#info .class'])
  },

  // update package and class name at header only at package/class level 
  updateInfo( packageName, className) {
    // update info
    document.querySelector('#info .package').textContent = packageName
    document.querySelector('#info .class').textContent = className
    document.querySelector('#info .class-id').classList.add('show')
  },

  // create header with system name, commit version info and link to corresponding source codes
  createInfo(userName, versionName) {
    let index = versionName.lastIndexOf('-')
    let systemName = versionName.slice(11, index)
    let fullCommitId = versionName.slice(index + 1)
    let commitId = versionName.slice(index + 1, index + 8)
    let commitDate = versionName.slice(0, 10)
    document.querySelector('#info .system').textContent = systemName
    document.querySelector('#info .commit-date').textContent = 'on ' + commitDate
    let link = document.createElement('a')
    link.href = `https://github.com/${userName}/${systemName}/tree/${fullCommitId}`
    link.textContent = commitId
    link.target = '_blank'
    document.querySelector('#info .commit-id').innerHTML = ''
    document.querySelector('#info .commit-id').appendChild(link)
    this.setVisible('#info', true, false)
  },

  showHistory() {
    // this.empty(['#history-list'])
    // _.each(_.clone(historyList).reverse(), (data) => {
    //   let element = createHistoryRowElement(data)
    //   document.getElementById('history-list').appendChild(element)
    // })
    this.setVisible('#history', true, false)
    this.setVisible('.close', true, false)
  },

  clearHistoryList() {
    this.empty(['#history-list'])
  },

  updateHistoryList(data, record) {
    // if(document.querySelector('#history').style.display != 'none') {
    let element = this.createHistoryRowElement(data, record)
    let list = document.getElementById('history-list')
    list.insertBefore(element, list.firstChild)
    // }
  },

  createHistoryRowElement (data, record) {
    let element = document.createElement('div')
    element.className = 'history-row'
    // commit icon
    let commitIconDiv = document.createElement('div')
    commitIconDiv.innerHTML = '<img src="./images/git-commit.png">'
    // commit id
    let commitIdDiv = document.createElement('div')
    commitIdDiv.className = 'commit-id'
    let index = record.version.lastIndexOf('-')
    let commitId = record.version.slice(index + 1, index + 8)
    commitIdDiv.textContent = commitId
    // commit date
    let commitDateDiv = document.createElement('div')
    commitDateDiv.className = 'commit-date'
    let commitDate = record.version.slice(0, 10)
    commitDateDiv.textContent = 'on ' + commitDate
    // append
    let commitDiv = document.createElement('div')
    commitDiv.className = 'history-commit'
    commitDiv.appendChild(commitIconDiv)
    commitDiv.appendChild(commitIdDiv)
    commitDiv.appendChild(commitDateDiv)
    element.appendChild(commitDiv)
    // package name
    if(record.package !== '') {
      let packageDiv = document.createElement('div')
      packageDiv.className = 'package'
      packageDiv.textContent = record.package
      element.appendChild(packageDiv)
    }
    // package class
    if(record.class !== '') {
      let classDiv = document.createElement('div')
      classDiv.className = 'class'
      classDiv.textContent = record.class
      element.appendChild(classDiv)
    }
    element.setAttribute('data-version', record.version)
    element.setAttribute('data-package', record.package)
    element.setAttribute('data-class', record.class)
    element.addEventListener('click', () => {
      data.selectedVersion = record.version
      data.selectedPackage = record.package
      if(record.class !== '') {
        data.selectedClass = `${record.package}.${record.class}`
      } else {
        data.selectedClass = ''
      }
      data = this.reset(data)
      graph.init(data)
    })
    return element
  },

  empty(elements) {
    elements.forEach(ele => {
      document.querySelector(ele).innerHTML = ''
    })
  },

  reset(data) {
    // tool dialog
    let selectedOptions = document.getElementsByClassName('selected-option')
    while(selectedOptions.length > 0){
      selectedOptions[0].classList.remove('selected-option')
    }
    selectedOptions = document.getElementsByClassName('filtered')
    while(selectedOptions.length > 0){
      selectedOptions[0].classList.remove('filtered')
    }
    data.options.labelVisibility = 'hideLabels'
    data.options.edgeVisibility = 'hideEdges'
    document.querySelector(`[data-option="${data.options.layout}"]`).classList.add('selected-option')
    document.querySelector(`[data-option="${data.options.labelVisibility}"]`).classList.add('selected-option')
    document.querySelector(`[data-option="${data.options.edgeVisibility}"]`).classList.add('selected-option')
    document.querySelector(`[data-option="${data.options.metric}"]`).classList.add('selected-option')
    document.querySelector('[data-option="highlightOff"]').classList.add('selected-option')
    document.querySelector('[data-option="1"]').classList.add('selected-option')
    document.querySelector('[data-option="all"]').classList.add('selected-option')
    for (let role of data.roleMap.keys()) {
      document.querySelector(`[data-role="${role}"]`).classList.add('selected-option')
    }
    data.filterRoleList = [ ...data.roleMap.keys() ]
    // code dialog
    document.querySelector('#sourceCode').classList.remove('view')
    data.options.codeViewing = 'single'
    this.empty(['#view'])
    // compare dialog
    this.emptyCompareList()
    this.setVisible('.code-compare', false, false)
    // pattern dialog
    // empty chart and update ranking lists
    this.empty(['.chart-div'])
    pattern.updateRankingList(data)
    return data
  },

  showDependencyOptions(bool) {
    let classLevelElements = document.querySelectorAll('.class-level')
    for(var i = 0; i < classLevelElements.length; i++) {
      if(bool) {
        classLevelElements[i].classList.remove('disabled')
      } else {
        classLevelElements[i].classList.add('disabled')
      }
    }
  },

  removeElement(query) {
    let element = document.querySelector(query)
    if(element != null) {
      element.parentNode.removeChild(element)
    }
  },

  createTimeline(data, roleList) {
    // remove existing timeline
    this.removeElement('.roles')
    // append
    let element, span, text
    let lastDiv = document.createElement('div')
    lastDiv.className = 'roles'
    _.forEach(data.system.versionList, v => {
      element = document.createElement('div')
      element.className = 'role'
      span = document.createElement('span')
      span.className = 'tooltip'
      if(data.level === 'class') {
        let node = _.find(roleList, ['version', v])
        if(node === undefined) {
          element.style['background-color'] = '#dadad8'
          element.className = 'role hover-no-effect'
        } else {
          element.style['background-color'] = data.roleMap.get(node.role)
          span.addEventListener('click', () => {
            if(data.options.timeline == 'switchVersion') {
              data.selectedVersion = v
              graph.init(data)
            } else {
              if(data.selectedVersion !== v) {
                compare.showChanges(data, data.selectedVersion, v)
              }
            }
          })
        }
      } else {
        let list = _.find(roleList, ['version', v])
        if(list === undefined) {
          element.style['background-color'] = '#dadad8'
          element.className = 'role hover-no-effect'
        } else if(list.role.length === 1) {
          element.style['background-color'] = data.roleMap.get(list.role[0])
        } else if(list.role.length === 2) {
          let color1 = data.roleMap.get(list.role[0])
          let color2 = data.roleMap.get(list.role[1])
          element.style['background-image'] = `linear-gradient(to right, ${color1} 50%, ${color2} 50%)`
        } else {
          let style = 'linear-gradient(to right'
          _.forEach(list.role, (r, i) => {
            let color = data.roleMap.get(r)
            let size = _.round(100 / list.role.length, 2)
            style += `, ${color} ${size * i}%,  ${color} ${size * (i+1)}%`
          })
          style += ')'
          element.style['background-image'] = style
        }
        if(list !== undefined) {
          span.addEventListener('click', () => {
            if(data.options.timeline == 'switchVersion') {
              data.selectedVersion = v
              graph.init(data)
            } else {
              if(data.selectedVersion !== v) {
                compare.showChanges(data, data.selectedVersion, v)
              }
            }
          })
        }
        if(data.level === 'package') {
          element.classList.add('role-package')
        } else if(data.level === 'system') {
          element.classList.add('role-version')
        }
      }
      span.setAttribute('data-text', v.slice(0, 10))
      element.appendChild(span)
      text = document.createElement('span')
      text.setAttribute('data-date', v.slice(0, 10))
      text.className = 'date'
      span.appendChild(text)
      lastDiv.appendChild(element)
    })
    document.querySelector('.timeline').appendChild(lastDiv)
    // add indicator to current version
    this.createCurrentIndicator(data.selectedVersion)
  },

  createCurrentIndicator(version) {
    let currentEles = document.querySelectorAll(`.role [data-text='${version.slice(0, 10)}']`)[0]
    currentEles.className = 'tooltip selected current'
    currentEles.textContent = 'CURRENT'
    currentEles.parentNode.classList.add('current-version')
  },

  createIndicator(version, text) {
    this.removeIndicator()
    let date = version.slice(0, 10)
    let eles = document.querySelectorAll(`.role [data-text='${date}']`)[0]
    eles.className = 'tooltip selected compared'
    eles.textContent = text
    eles.parentNode.classList.add('selected-version')
  },

  removeIndicator() {
    let element = document.querySelector('.selected-version')
    if(element != null) {
      element.classList.remove('selected-version')
      let selected = document.querySelector('span.compared')
      selected.textContent = ''
      let text = document.createElement('span')
      let date = selected.getAttribute('data-text').slice(0, 10)
      text.setAttribute('data-date', date)
      text.className = 'date'
      selected.appendChild(text)
      selected.classList.remove('compared')
      selected.classList.remove('selected')
    }
    // let indicators = document.getElementsByClassName('indicator')
    // while(indicators.length > 0){
    //   indicators[0].parentNode.removeChild(indicators[0])
    // }
  },

  showTools() {
    this.setVisible('#tools', true, false)
    this.setVisible('.close', true, false)
    // moveGraph()
  },

  closeOpenedDialog() {
    this.setVisible('.dialog', false, true)
    this.setVisible('.close', false, false)
    this.setVisible('.close-code', false, false)
    // cy.fit()
  },

  createLegend(cy, roleMap) {
    let element, sub, text
    for (let role of roleMap.keys()) {
      element = document.createElement('div')
      element.className = 'legend-role'
      sub = document.createElement('div')
      sub.className = 'legend-circle'
      sub.addEventListener('mouseover', () => {
        graph.hoverLegend(cy, role)
      })
      sub.addEventListener('mouseout', () => {
        graph.removeHoverLegend(cy)
      })
      sub.style['background-color'] = roleMap.get(role)
      element.appendChild(sub)
      text = document.createElement('div')
      text.className = 'legend-text'
      text.innerHTML = role
      element.appendChild(text)
      document.getElementById('legend').appendChild(element)
    }
  },

  showCodeView(level, option) {
    if(level == 'class') {
      // hide message dialog
      this.setVisible('#sourceCode .not-found', false, false)
      // display single code or compare code view
      if(option == 'single') {
        document.querySelector('#sourceCode').classList.remove('view')
        this.setVisible('#sourceCode .code', true, false)
        this.setVisible('#sourceCode #view', false, false)
      } else {
        document.querySelector('#sourceCode').classList.add('view')
        this.setVisible('#sourceCode #view', true, false)
        this.setVisible('#sourceCode .code', false, false)
      }
    }
  },

  showCodeMessage(msg) {
    this.setVisible('#sourceCode .not-found', true, false)
    this.setVisible('#sourceCode .code', false, false)
    this.setVisible('#sourceCode #view', false, false)
    document.querySelector('#sourceCode .not-found').textContent = msg
  },

  closeSourceCodeDialog() { // for closing code comparison dialog in compare dialog
    this.setVisible('#sourceCode', false, false)
  },

  openSourceCodeDialog() {
    this.setVisible('#sourceCode', true, false)
    this.setVisible('.close-code', true, false)
  },

  resetListCount() {
    document.querySelector('.list-view.all .count').textContent = 0
    document.querySelector('.list-view.removed .count').textContent = 0
    document.querySelector('.list-view.added .count').textContent = 0
    document.querySelector('.list-view.role-changed .count').textContent = 0
  },

  resetListIcon() {
    document.querySelector('.version-select-icon').textContent = 'keyboard_arrow_down'
    let elements = document.querySelectorAll('.change-list-div .change-list-icon')
    for(var i=0; i < elements.length; i++) {
      elements[i].textContent = 'keyboard_arrow_down'
    }
  },

  clearChangeLists() {
    let elements = document.getElementsByClassName('change-list')
    for(var i; i < elements.length; i++) {
      elements[0].classList.add('hide')
    }
    this.empty(['.change-lists .removed-list', '.change-lists .added-list', '.change-lists .role-changed-list'])
  },
  
  resetChangeLists() {
    this.setVisible('.change-lists', true, false)
    this.setVisible('.change-lists .change-list-group', true, true)
    this.setVisible('.change-lists .change-list', false, true)
  },

  showCompareDialog() {
    this.setVisible('#compare', true, false)
    this.setVisible('.close', true, false)
  },

  showSlider() {
    this.setVisible('.timeline-div', false, false)
    this.setVisible('.slider', true, false)
    this.setVisible('.close-slider', true, false)
  },

  closeSlider() {
    this.setVisible('.timeline-div', true, false)
    this.setVisible('.slider', false, false)
    this.setVisible('.close-slider', false, false)
  },

  emptyCompareList() {
    this.empty(['#compare .version-selected', '#compare .version-options-list'])
    document.querySelector('#compare .version-options-list').className = 'version-options-list'
    document.querySelector('#compare .version-select-text').classList.remove('hide')
    this.setVisible('#compare .list-view-options', false, false)
    this.setVisible('#compare .change-lists', false, false)
    document.querySelector('.list-view-options .selected-view').classList.remove('selected-view')
    document.querySelector('.list-view-options .all').classList.add('selected-view')
    this.resetListCount()
    this.resetListIcon()
    this.clearChangeLists()
  },

  showGuide() {
    this.setVisible('.close', true, false)
    this.setVisible('#guide', true, false)
    const swiper = new Swiper('.swiper-container', {
      pagination: {
        el: '.swiper-pagination',
        type: 'progressbar',
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      }
    })
  },

  showPatternDialog(patternLevel) {
    this.setVisible('#pattern', true, false)
    this.setVisible('.close', true, false)
    this.checkButton(patternLevel)
  },
  
  checkButton(patternLevel) {
    if(patternLevel == 1) {
      this.setVisible('.pattern-buttons .remove', false, false)
    } else {
      this.setVisible('.pattern-buttons .remove', true, false)
    }
    if(patternLevel == 3) {
      this.setVisible('.pattern-buttons .add', false, false)
    } else {
      this.setVisible('.pattern-buttons .add', true, false)
    }
  },

  togglePatternRanking(element) {
    if(document.querySelector(`.${element} .ranking-list`).classList.contains('hide')) {
      this.setVisible(`.${element} .ranking-list`, true, false)
      document.querySelector(`.${element} .ranking-level-icon`).textContent = 'keyboard_arrow_up'
    } else {
      this.setVisible(`.${element} .ranking-list`, false, false)
      document.querySelector(`.${element} .ranking-level-icon`).textContent = 'keyboard_arrow_down'
    }
  },

  createCommonPatterns(data, commonPatternList) {
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
        pattern.applyPattern(data, ele.length, ele)
        rowDiv.classList.add('selected-pattern')
      })
      parentDiv.appendChild(rowDiv)
    })
  },

  updatePatternCount(option) {
    if(option == 'remove') {
      let patternCountDiv = document.querySelector('.pattern-count')
      patternCountDiv.removeChild(patternCountDiv.lastElementChild)
      let patternSelectDiv = document.querySelector('.pattern-select')
      patternSelectDiv.removeChild(patternSelectDiv.lastElementChild)
    }
  },

  updatePatternRole(level, role) {
    let element = document.querySelector(`.pattern-role[data-pattern-level="${level}"] [data-role="${role}"]`)
    if(element.classList.contains('removed')) {
      element.classList.remove('removed')
    } else {
      element.classList.add('removed')
    }
  },

  switchPatternTab(data, option) {
    // empty chart and common patterns
    this.empty(['.chart-div', '.common-pattern-div'])
    // add class to selected tab
    document.querySelector('.pattern-tabs .selected-pattern-tab').classList.remove('selected-pattern-tab')
    document.querySelector(`.pattern-tabs .${option}`).classList.add('selected-pattern-tab')
    // open corresponding view
    this.setVisible('.pattern-content-div', false, true)
    this.setVisible(`.pattern-content-div.${option}-pattern-div`, true, false)
    // get ranking list or common patterns
    if(option === 'ranking') {
      pattern.updateRankingList(data)
    } else if(option === 'common') {
      this.createCommonPatterns(data, pattern.commonPatternList())
    }
  },

  resetRankingLists() {
    // remove ranking lists
    this.removeElement('.level-one .ranking-list')
    this.removeElement('.level-two .ranking-list')
    // update arrow
    document.querySelector('.level-one .ranking-level-icon').textContent = 'keyboard_arrow_down'
    document.querySelector('.level-two .ranking-level-icon').textContent = 'keyboard_arrow_down'
  },

  createRankingList(data, element, list) {
    let parentDiv = document.querySelector(element)
    let listDiv = document.createElement('div')
    listDiv.className = 'ranking-list hide'
    _.remove(list, ele => ele.count == 0)
    list.forEach(ele => {
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
        pattern.applyPattern(data, ele.pattern.length, ele.pattern)
        rowDiv.classList.add('selected-pattern')
        document.querySelector('.pattern-tabs').scrollIntoView()
      })
      listDiv.appendChild(rowDiv)
    })
    parentDiv.appendChild(listDiv)
  },

  updateSelectedCompareVersion(version) {
    this.setVisible('#compare .version-select-text', false, false)
    this.setVisible('#compare .version-options-list', false, false)
    this.empty(['#compare .version-selected'])
    let option = document.createElement('div')
    option.className = 'version-option'
    // commit icon
    let commitIconDiv = document.createElement('div')
    commitIconDiv.innerHTML = '<img src="./images/git-commit.png">'
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
    document.querySelector('#compare .version-selected').appendChild(option)
  },

  createCompareSelectList(data, versionList, selectedVersion) {
    let element = document.querySelector('.version-options-list')
    if(!element.classList.contains('created')) {
      element.classList.add('created')
      // versionList = _.remove(versionList, v => v !== selectedVersion)
      versionList.forEach(version => {
        if(version == selectedVersion) {
          let option = document.createElement('div')
          option.className = 'current-version-divider'
          element.appendChild(option)
        } else {
          let option = document.createElement('div')
          option.className = 'version-option'
          // commit icon
          let commitIconDiv = document.createElement('div')
          commitIconDiv.innerHTML = '<img src="./images/git-commit.png">'
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
            this.empty(['#compare .version-selected'])
            let div = optionDiv.cloneNode(true)
            document.querySelector('#compare .version-selected').appendChild(div)
            element.classList.add('closed')
            document.querySelector('#compare .version-select-icon').textContent = 'keyboard_arrow_down'
            document.querySelector('.list-view-options .selected-view').classList.remove('selected-view')
            this.setVisible('#compare .version-select-text', false, false)
            this.setVisible('#compare .version-options-list', false, false)
            compare.showChanges(data, selectedVersion, version)
            document.querySelector('.list-view-options .all').classList.add('selected-view')
            this.setVisible('#compare .list-view-options', true, false)
            this.clearChangeLists()
            this.resetListIcon()
          })
          element.appendChild(option)
        }
      })
      document.querySelector('.version-select-icon').textContent = 'keyboard_arrow_up'
      this.setVisible('.version-options-list', true, false)
    } else if(element.classList.contains('closed') && element.classList.contains('created')) {
      document.querySelector('.version-select-icon').textContent = 'keyboard_arrow_up'
      this.setVisible('.version-options-list', true, false)
      element.classList.toggle('closed')
    } else {
      document.querySelector('.version-select-icon').textContent = 'keyboard_arrow_down'
      this.setVisible('.version-options-list', false, false)
      element.classList.toggle('closed')
    }
  },

  toggleChangeList(name) {
    let element = document.querySelector(`.change-list.${name}-list`)
    element.classList.toggle('hide')
    if(element.classList.contains('hide')) {
      document.querySelector(`.change-list-div.${name}-div .change-list-icon`).textContent = 'keyboard_arrow_down'
    } else {
      document.querySelector(`.change-list-div.${name}-div .change-list-icon`).textContent = 'keyboard_arrow_up'
    }
  },

  updateChangeListView(option) {
    document.querySelector('.list-view-options .selected-view').classList.remove('selected-view')
    this.setVisible('.change-lists .change-list-group', false, true)
    this.setVisible('.change-lists .change-list', false, true)
    switch(option) {
      case 'all':
        document.querySelector('.list-view-options .all').classList.add('selected-view')
        this.setVisible('.change-lists .change-list-group', true, true)
        break
      case 'removed':
        document.querySelector('.list-view-options .removed').classList.add('selected-view')
        this.setVisible('.change-list.removed-list', true, false)
        break
      case 'added':
        document.querySelector('.list-view-options .added').classList.add('selected-view')
        this.setVisible('.change-list.added-list', true, false)
        break
      case 'role-changed':
        document.querySelector('.list-view-options .role-changed').classList.add('selected-view')
        this.setVisible('.change-list.role-changed-list', true, false)
        break
    }
  },

  createListItem(data, node) {
    let element, div, sub, packageText, classText
      element = document.createElement('div')
      element.className = 'change-list-row'
      element.addEventListener('click', () => {
        graph.clickChangeListItem(data.cy, data.level, node.id, data.options.layout)
        this.updateDependencyLevel(3)
      })
      div = document.createElement('div')
      div.className = 'list-item-text'
      sub = document.createElement('div')
      packageText = document.createElement('div')
      packageText.className = 'list-item-package-text'
      classText = document.createElement('div')
      classText.className = 'list-item-class-text'
      if(node.role === undefined) {
          sub.className = 'list-item-package'
          packageText.innerHTML = node.id
      } else {
          sub.className = 'list-item-circle'
          sub.style['background-color'] = data.roleMap.get(node.role)
          let index = node.id.lastIndexOf('.')
          packageText.innerHTML = node.id.slice(0, index)
          classText.innerHTML = node.id.slice(index + 1)
      }
      element.appendChild(sub)
      div.appendChild(packageText)
      div.appendChild(classText)
      element.appendChild(div)
      return element
  },

  createRoleChangedListItem(data, node, currentVersion, versionToCompare, isComparingToLaterVersion) {
    let element, div, fromRole, toRole, packageText, classText, arrow
      element = document.createElement('div')
      element.className = 'change-list-row'
      element.addEventListener('click', () => {
        graph.clickChangeListItem(data.cy, data.level, node.id, data.options.layout)
        this.updateDependencyLevel(3)
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
        fromRole.style['background-color'] = data.roleMap.get(node[`${currentVersion}`])
        toRole.style['background-color'] = data.roleMap.get(node[`${versionToCompare}`])
      } else {
        fromRole.style['background-color'] = data.roleMap.get(node[`${versionToCompare}`])
        toRole.style['background-color'] = data.roleMap.get(node[`${currentVersion}`])
      }
      let index = node.id.lastIndexOf('.')
      packageText.innerHTML = node.id.slice(0, index)
      classText.innerHTML = node.id.slice(index + 1)
      element.appendChild(fromRole)
      element.appendChild(arrow)
      element.appendChild(toRole)
      div.appendChild(packageText)
      div.appendChild(classText)
      element.appendChild(div)
      return element
  }
}

export default Dom