'use strict'

import dom from './update.js'
import api from './api.js'

import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/eclipse.css'
import 'codemirror/addon/merge/merge.css'
import 'codemirror/mode/clike/clike.js'
import 'codemirror/addon/merge/merge.js'
import 'codemirror/addon/display/autorefresh.js'

class Tools {
  showSingleCode(code) {
    // remove existing CodeMirror
    dom.removeElement('.CodeMirror')
    // initialise CodeMirror
    let codeEditor = CodeMirror.fromTextArea(document.getElementById('editor'), {
      mode: 'text/x-java',
      theme: 'eclipse',
      lineNumbers: true,
      lineWrapping: true,
      readOnly: true,
      autoRefresh: true
    })
    codeEditor.setValue(code)
    dom.showCodeView('class', 'single')
  }

  async updateCodeView(classId, currentVersion, versionToCompare, isComparingToLaterVersion) {
    dom.empty(['#view'])
    let currentCode = await this.getSourceCode(currentVersion, classId)
    let comparedCode = await this.getSourceCode(versionToCompare, classId)
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
    dom.showCodeView('class', 'compare')
  }

  async updateCode(version, classId, codeViewing) {
    if(classId != '') {
      // get code at class level
      let code = await this.getSourceCode(version, classId)
      if(code !== undefined) {
        if(codeViewing == 'single') {
          document.querySelector('#sourceCode').classList.remove('view')
          this.showSingleCode(code.data)
        }
      } else {
        // display code not found message
        dom.showCodeMessage('Not found.')
      }
    } else {
      // display not class level message 
      dom.showCodeMessage('Source code only available for classes.')
    }
  }

  async getSourceCode(version, classId) { // displaySourceCode()
    let index = version.lastIndexOf('-')
    let systemName = version.slice(11, index)
    let commitId = version.slice(index + 1)
    // handle inner class
    if(classId.indexOf('$') !== -1) {
      classId = classId.slice(0, classId.indexOf('$'))
    }
    let filePath = classId.split('.').join('/') + '.java'
    let path = await api.getPath(version, classId)
    let packagePath = path.data.path
    let username = path.data.username
    let url = `https://raw.githubusercontent.com/${username}/${systemName}/${commitId}/${packagePath}/${filePath}`
    let code = await api.getSourceCode(url)
    return code
  }

  toggleTimeline() {
    return (document.querySelector('.toggle-timeline input').checked) ? 'compareVersion' : 'switchVersion'
  }

  download(cy, level, selectedVersion, selectedPackage, selectedClass) {
    let png64 = cy.png()
    let link = document.createElement('a')
    document.body.appendChild(link)
    link.setAttribute('type', 'hidden')
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

  exportHistory(historyList) {
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
}

export default new Tools()