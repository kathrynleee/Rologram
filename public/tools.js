const showSourceCode = async () => {
  setVisible('#sourceCode', true, true)
  setVisible('#sourceCode .code', false)
  setVisible('#sourceCode .not-found', false)
  if(level !== 'class') {
      setVisible('#sourceCode .not-found', true)
      document.querySelector('#sourceCode .not-found').textContent = 'Source code only available for classes'
  } else {
      selectedClass = 'wallet.WalletApplication'
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
  cy.elements().removeClass('hover')
}

const hoverLegend = (role) => {
  const nodes = cy.elements(`node[role="${role}"]`)
  const parents = nodes.ancestors()
  cy.elements().not(nodes).not(parents).addClass('hover')
}

const showHistory = () => {
  _.each(_.clone(historyList).reverse(), () => {
  //   let element = document.createElement('div')
  //   element.className = 'role'
  //   span.addEventListener('click', () => {
  //     // showChanges(v)
  //     createIndicators(v)
  //   })
  //   span.appendChild(text)
  //   document.getElementById('roles').appendChild(element)

  //   <div class="flex-row">
  //                   <div>
  //                       <img alt="Octicons-git-commit" src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Octicons-git-commit.svg/512px-Octicons-git-commit.svg.png">
  //                   </div>
  //                   <div class="commit-id">1b30fd5</div>
  //                   <div class="commit-date">on 2020-01-06</div>
  //               </div>
  //               <div class="package">wallet.ui</div>
  //               <div class="class">WalletApplication</div>
  })
  setVisible('#history', true)
}