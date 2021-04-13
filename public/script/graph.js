'use strict'

class Graph {
  cy
  currentLayoutOptions = klay

  klay = {
    name: 'klay',
    nodeDimensionsIncludeLabels: true, 
    fit: true,
    animate: 'end',
    animationDuration: 500,
    animationEasing: 'spring(500, 50)',
    klay: {
      borderSpacing: 20, // spacing between compound nodes
      spacing: 15, // spacing between nodes
      compactComponents: true,
      nodePlacement:'SIMPLE',
      direction: 'DOWN', // UP, DOWN, LEFT, RIGHT
      edgeRouting: 'POLYLINE',
      edgeSpacingFactor: 0.3,
      layoutHierarchy: false
    },
    start: () => setVisible('.loader', true, false),
    stop: () => setVisible('.loader', false, false)
  }

  hierarchy = {
    name: 'klay',
    nodeDimensionsIncludeLabels: true, 
    fit: true,
    animate: 'end',
    animationDuration: 500,
    animationEasing: 'spring(500, 50)',
    klay: {
      borderSpacing: 20, // spacing between compound nodes
      spacing: 15, // spacing between nodes
      compactComponents: true,
      nodePlacement:'SIMPLE',
      direction: 'DOWN', // UP, DOWN, LEFT, RIGHT
      edgeRouting: 'POLYLINE',
      edgeSpacingFactor: 0.1,
      layoutHierarchy: true
    },
    start: () => setVisible('.loader', true, false),
    stop: () => setVisible('.loader', false, false)
  }

  setLayoutOptions(option) {
    this.currentLayoutOptions = option
  }
}