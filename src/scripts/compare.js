'use strict'

import dom from './update.js'
import graph from './graph.js'
import api from './api.js'
import tools from './tools.js'

class Compare {
  async showChanges(data, currentVersion, versionToCompare) {
    let cy = data.cy
    dom.resetListCount()
    cy.remove(cy.elements())
    graph.runLayout(cy, data.options.layout)
    dom.showLoader()
    let changes
    switch(data.level) {
      case 'system':
        changes = await api.getSystemChangesList(currentVersion, versionToCompare)
        break
      case 'package':
        changes = await api.getPackageChangesList(currentVersion, versionToCompare, data.selectedPackage)
        break
      case 'class':
        changes = await api.getClassChangesList(currentVersion, versionToCompare, data.selectedClass)
        break
    }
    let currentIndex = _.indexOf(data.system.versionList, currentVersion)
    let targetIndex = _.indexOf(data.system.versionList, versionToCompare)
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
  
    if(data.level === 'class') {
      cy.$id(data.selectedClass).addClass('selected')
      data.options.codeViewing = 'compare'
      tools.updateCodeView(data.selectedClass, currentVersion, versionToCompare, isComparingToLaterVersion)
      dom.setVisible('.code-compare', true, false)
    }
    cy.endBatch()
    graph.updateGraph(data)
    dom.clearChangeLists()
    dom.createIndicator(versionToCompare, 'COMPARE')
    this.createChangeList(data, changes.data, currentVersion, versionToCompare, isComparingToLaterVersion)
    dom.resetListIcon()
    dom.resetChangeLists()
    dom.updateSelectedCompareVersion(versionToCompare)
  }

  async createSelect(data, level, selectedVersion) {
    let versionList = []
    if(level === 'system') {
      const versions = await api.getVersions()
      versionList = versions.data
    } else if(level === 'package') {
      const roleList = await api.getPackageRoleList(data.selectedPackage)
      versionList = _.map(roleList.data, 'version')
    } else if(level === 'class') {
      const roleList = await api.getClassRoleList(data.selectedClass)
      versionList = _.map(roleList.data, 'version')
    }
    dom.createCompareSelectList(data, versionList, selectedVersion)
  }

  createChangeList(data, changeData, currentVersion, versionToCompare, isComparingToLaterVersion) {
    // update list count
    let status, addedCount = 0, removedCount = 0, changedCount = 0
    changedCount = changeData.changedRoles.length
    if(changeData.nodes.inCurrent.length > 0) {
      status = changeData.nodes.inCurrent[0].data.status
      addedCount = (status === 'added') ? changeData.nodes.inCurrent.length : changeData.nodes.inCompared.length
      removedCount = (status === 'removed') ? changeData.nodes.inCurrent.length : changeData.nodes.inCompared.length
    } else if(changeData.nodes.inCompared.length > 0) {
      status = changeData.nodes.inCompared[0].data.status
      addedCount = (status === 'added') ? changeData.nodes.inCompared.length : changeData.nodes.inCurrent.length
      removedCount = (status === 'removed') ? changeData.nodes.inCompared.length : changeData.nodes.inCurrent.length
    }
    document.querySelector('.list-view.all .count').textContent = addedCount + removedCount + changedCount
    document.querySelector('.list-view.removed .count').textContent = removedCount
    document.querySelector('.list-view.added .count').textContent = addedCount
    document.querySelector('.list-view.role-changed .count').textContent = changedCount
  
    dom.setVisible('#compare .added-div', false, false)
    dom.setVisible('#compare .removed-div', false, false)
    // create list
    if(changeData.nodes.inCurrent.length > 0) {
      status = changeData.nodes.inCurrent[0].data.status
      changeData.nodes.inCurrent.forEach(n => {
        document.querySelector(`#compare .${status}-list`).appendChild(dom.createListItem(data, n.data))
      })
      dom.setVisible(`.${status}-div`, true, false)
    }
    if(changeData.nodes.inCompared.length > 0) {
      status = changeData.nodes.inCompared[0].data.status
      changeData.nodes.inCompared.forEach(n => {
        document.querySelector(`#compare .${status}-list`).appendChild(dom.createListItem(data, n.data))
      })
      dom.setVisible(`.${status}-div`, true, false)
    }
    if(changeData.changedRoles.length > 0) {
      changeData.changedRoles.forEach(n => {
        document.querySelector(`#compare .role-changed-list`).appendChild(dom.createRoleChangedListItem(data, n, currentVersion, versionToCompare, isComparingToLaterVersion))
      })
      dom.setVisible('.role-changed-div', true, false)
    } else {
      dom.setVisible('.role-changed-div', false, false)
    }
    dom.setVisible('.list-view-options', true, false)
    dom.setVisible('#compare-legend', true, false)
  }
}

export default new Compare()