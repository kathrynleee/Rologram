'use strict'

let animationCurrentVersion, animationCompareVersion
let duration = 10 * 1000, times
const showAnimationDialog = async () => {
  const versions = await getVersions()
  let currentIndex = _.indexOf(versions.data, selectedVersion)
  times = currentIndex - 1
  setVisible('#animation', true, true)
  setVisible('.close', true)
  setVisible('#animation .animation-options', (currentIndex !== 0))
  setVisible('#animation .message', (currentIndex === 0))
  animationCurrentVersion = versions.data[0]
  animationCompareVersion = versions.data[1]
}

const startAnimation = async () => {
  callAnimation()
  _.times(times, () => setTimeout(() => callAnimation(), duration))
    // var elem = document.getElementById('progressBar')
    // var width = 1
    // var id = setInterval(frame, 100)
    // function frame() {
    //   if (width >= 100) {
    //     clearInterval(id)
    //   } else {
    //     width++
    //     elem.style.width = width + "%"
    //   }
    // }
  // setTimeout(() => callAnimation, duration)
  // let timerId = setTimeout(() => showChanges(current, compare), duration)
  // clearTimeout(timerId)
}

const callAnimation = async () => {
  const versions = await getVersions()
  if(animationCompareVersion !== undefined) {
    showChanges(animationCurrentVersion, animationCompareVersion)
    let currentIndex = _.indexOf(versions.data, animationCurrentVersion)
    animationCurrentVersion = versions.data[currentIndex + 1]
    animationCompareVersion = versions.data[currentIndex + 2]
  }
}

const pauseAnimation = () => {
  let timerId = setTimeout(() => callAnimation, duration)
  clearTimeout(timerId)
}

const stopAnimation = () => {
  let timerId = setTimeout(() => callAnimation, duration)
  clearTimeout(timerId)
}