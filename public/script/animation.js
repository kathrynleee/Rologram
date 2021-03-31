// 'use strict'

// let isStarted = false, startVersion

// const showAnimationDialog = async () => {
//   isStarted = false
//   removeIndicator()
//   pause()
//   document.querySelector('.splide__list').innerHTML = ''
//   setVisible('#animation', true, false)
//   // setVisible('.close', true, false)
//   let versionList = []
//   if(level === 'system') {
//     const versions = await getVersions()
//     versionList = versions.data
//   } else if(level === 'package') {
//     const roleList = await getPackageRoleList(selectedPackage)
//     versionList = _.map(roleList.data, 'version')
//   } else if(level === 'class') {
//     const roleList = await getClassRoleList(selectedClass)
//     versionList = _.map(roleList.data, 'version')
//   }
//   versionList.sort()
//   var currentIndex = _.indexOf(versionList, selectedVersion)
//   setVisible('#animation .message', (currentIndex === 0), false)
//   setVisible('#animation .splide', (currentIndex !== 0), false)
//   if(currentIndex !== 0) {
//     initSplide(versionList)
//     startVersion = versionList[0]
//   }
// }

// const createSlides = async (versions) => {
//   document.querySelector('.splide__list').innerHTML = ''
//   let currentIndex = _.indexOf(versions, selectedVersion)
//   const slideContainer = document.querySelector('.splide__list')
//   for(var i = 0; i <= currentIndex; i++) {
//     let index = versions[i].lastIndexOf('-')
//     let splideSlideDiv = document.createElement('li')
//     splideSlideDiv.className = 'splide__slide'
//     let slideDiv = document.createElement('div')
//     slideDiv.className = 'slide'
//     let versionDiv = document.createElement('div')
//     let commitIconDiv = document.createElement('div')
//     let commitIdDiv = document.createElement('div')
//     let commitDateDiv = document.createElement('div')
//     commitIconDiv.className = 'commit-icon'
//     commitIdDiv.className = 'commit-id'
//     commitDateDiv.className = 'commit-date'
//     commitIconDiv.innerHTML = '<img src="../image/git-commit.png">'
//     commitIdDiv.textContent = versions[i].slice(index + 1, index + 8)
//     commitDateDiv.textContent = 'on ' + versions[i].slice(0, 10)
//     versionDiv.appendChild(commitIconDiv)
//     versionDiv.appendChild(commitIdDiv)
//     versionDiv.appendChild(commitDateDiv)
//     versionDiv.className = 'version'
//     slideDiv.appendChild(versionDiv)
//     splideSlideDiv.appendChild(slideDiv)
//     slideContainer.appendChild(splideSlideDiv)
//   }
// }

// const initSplide = (versions) => {
//   createSlides(versions)
//   var splide = new Splide('.splide', {
//     type: 'slide',
//     perPage: 1,
//     autoplay: true,
//     pauseOnHover: false,
//     pagination: false,
//     interval: 10000,
//     autoWidth: true,
//     arrows: false,
//     rewind: false,
//     resetProgress: false
//   }).mount()
//   pause()
//   splide.on('move', (newIndex, oldIndex, destIndex) => {
//     if(oldIndex === splide.length - 1) {
//       stopAnimation()
//     } else {
//       // update graph
//       showChanges(versions[oldIndex], versions[newIndex])
//       // splide.go('+1')
//     }
//   })
//   // reset progress bar
//   document.querySelector('.splide__progress__bar').style.width = '0%'
// }

// const startAnimation = async () => {
//   if(!isStarted) {
//     isStarted = true
//     // get first graph
//     redrawGraph(startVersion)
//     emptyCompareList()
//     removeIndicator()
//     createIndicators(startVersion, 'SHOWING')
//   }
// }

// const pause = () => {
//   document.querySelector('.splide__pause').click()
// }

// const stopAnimation = () => {
//   isStarted = false
//   removeIndicator()
//   closeOpenedDialog()
//   pause()
//   document.querySelector('.splide__list').innerHTML = ''
//   initGraph(selectedVersion, selectedPackage, selectedClass)
// }

// const redrawGraph = async (version) => {
//   const elements = await getElements(version)
//   versionElements = elements.data
//   cy.startBatch()
//   cy.remove(cy.elements())
//   cy.add(versionElements)
//   cy.endBatch()
//   if(level !== 'class') {
//     updateGraph()
//   } else {
//     updateClassGraph(3, 'all', false, 'hideLabels')
//   }
// }
