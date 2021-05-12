import compare from './compare.js'

let slider = function(data, versionList) {
  init()
  function init() {
    const slider = document.getElementById('slider')
    let max = versionList.length - 1
    slider.setAttribute('max', max)
    slider.value = 0
    document.getElementById('labelMin').textContent = versionList[0].version.slice(0, 10)
    document.getElementById('labelMax').textContent = versionList[max].version.slice(0, 10)
    document.getElementById('value').textContent = versionList[0].version.slice(0, 10)
    initSlider()
  }
  
  function initSlider() {
    const slider = document.getElementById('slider')
    slider.oninput = onSliderInput
    updateValue(slider)
    updateValuePosition(slider)
    updateLabels(slider)
    updateProgress(slider)
    setTicks(slider)
  }

  function onSliderInput(event) {
    // not possible to choose the first version
    if(event.target.value == 0 && versionList.length > 1) {
      event.target.value = 1
    }
    if(versionList.length > 1) {
      updateValue(event.target)
      updateValuePosition(event.target)
      updateLabels(event.target)
      updateProgress(event.target)
      updateChanges(event.target)
    }
  }

  function updateChanges(slider) {
    let counter = parseInt(slider.value, 10)
    compare.showChanges(data, versionList[counter - 1].version, versionList[counter].version)
  }

  function updateValue(slider) {
    let value = document.getElementById(slider.dataset.valueId)
    let date = versionList[slider.value].version.slice(0, 10)
    value.innerHTML = '<div>' + date + '</div>'
  }
  
  function updateValuePosition(slider) {
    let value = document.getElementById(slider.dataset.valueId)
    const percent = getSliderPercent(slider)
    const sliderWidth = slider.getBoundingClientRect().width
    const valueWidth = value.getBoundingClientRect().width
    const handleSize = slider.dataset.handleSize
    let left = percent * (sliderWidth - handleSize) + handleSize / 2 - valueWidth / 2
    left = Math.min(left, sliderWidth - valueWidth)
    left = slider.value === slider.min ? 0 : left
    value.style.left = left + 'px'
  }
  
  function updateLabels(slider) {
    const value = document.getElementById(slider.dataset.valueId)
    const minLabel = document.getElementById(slider.dataset.minLabelId)
    const maxLabel = document.getElementById(slider.dataset.maxLabelId)
  
    const valueRect = value.getBoundingClientRect()
    const minLabelRect = minLabel.getBoundingClientRect()
    const maxLabelRect = maxLabel.getBoundingClientRect()
  
    const minLabelDelta = valueRect.left - (minLabelRect.left)
    const maxLabelDelta = maxLabelRect.left - valueRect.left
  
    const deltaThreshold = 90
  
    if (minLabelDelta < deltaThreshold) minLabel.classList.add("hidden")
    else minLabel.classList.remove("hidden")
  
    if (maxLabelDelta < deltaThreshold) maxLabel.classList.add("hidden")
    else maxLabel.classList.remove("hidden")
  }
  
  function updateProgress(slider) {
    let progress = document.getElementById(slider.dataset.progressId)
    const percent = getSliderPercent(slider)
    progress.style.width = percent * 100 + "%"
  }
  
  function getSliderPercent(slider) {
    const range = slider.max - slider.min
    const absValue = slider.value - slider.min
    return absValue / range
  }
  
  function setTicks(slider) {
    let container = document.getElementById(slider.dataset.tickId)
    const spacing = parseFloat(slider.dataset.tickStep)
    const sliderRange = slider.max - slider.min
    const tickCount = sliderRange / spacing + 1 // +1 to account for 0
    container.innerHTML = ''
    for (let ii = 0 ; ii < tickCount ; ii++) {
      let tick = document.createElement("span")
      tick.className = "tick-slider-tick"
      container.appendChild(tick)
    }
  }
  
  function onResize() {
    const slider = document.getElementsByClassName("tick-slider-input")[0]
    updateValuePosition(slider)
  }

  window.addEventListener('resize', onResize)
}

export default slider