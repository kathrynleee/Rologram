'use strict'

const showPatternDialog = async () => {
  setVisible('#pattern', true)
  setVisible('.close', true)
  test()
}

const test = async () => {
  document.querySelector('.chart-div').innerHTML = ''
  let data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [
      [5, 2, 4, 2, 0],
      [25, 32, 0, 0, 0]
    ]
  }
  let options = {
    fullWidth: true,
    axisX: { showGrid: false, showLabel: false },
    axisY: { showGrid: false, showLabel: false },
    chartPadding: {
      top: 30,
      right: 40
    },
    // plugins: [ 
    //   Chartist.plugins.ctPointLabels({ 
    //     textAnchor: 'middle', 
    //     labelInterpolationFnc: (value) => (typeof value === "undefined") ? "0" : value
    //   })
    // ]
  }
  new Chartist.Line('.chart-div', data, options)
}