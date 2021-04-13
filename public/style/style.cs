#animation .slide .version, #animation .animation-controls, #pattern .pattern-buttons .apply-cancel, #pattern .pattern-buttons, #pattern .pattern-role, #pattern .pattern-group, #pattern .pattern-tabs, #compare .change-list-div .change-list .change-list-row, #compare .change-list-div .change-list-group, #compare .list-view-options .list-view, #compare .list-view-options, #compare #version-select .version-option-div, #compare #version-select .version-select-div, #legend .legend-role, #legend, #tools .tool-row .tool-row-items, #history .history-row .history-commit, #info .class-id, #info .commit, .flex-row {
  display: flex;
  flex-direction: row;
}
#animation .slide .hide.version, #animation .hide.animation-controls, #pattern .pattern-buttons .hide.apply-cancel, #pattern .hide.pattern-buttons, #pattern .hide.pattern-role, #pattern .hide.pattern-group, #pattern .hide.pattern-tabs, #compare .change-list-div .change-list .hide.change-list-row, #compare .change-list-div .hide.change-list-group, #compare .list-view-options .hide.list-view, #compare .hide.list-view-options, #compare #version-select .hide.version-option-div, #compare #version-select .hide.version-select-div, #legend .hide.legend-role, .hide#legend, #tools .tool-row .hide.tool-row-items, #history .history-row .hide.history-commit, #info .hide.class-id, #info .hide.commit, .hide.flex-row {
  display: none;
}

#pattern .pattern-count .pointer-group, #pattern .pattern-count, .icons .icon, .icons {
  display: flex;
  flex-direction: column;
}
#pattern .pattern-count .hide.pointer-group, #pattern .hide.pattern-count, .icons .hide.icon, .hide.icons {
  display: none;
}

#animation .animation-controls, #animation, #pattern .pattern-buttons .apply-cancel, #pattern .pattern-buttons .add-remove, #pattern .pattern-count .pointer-group, #pattern .pattern-count .pointer, #pattern .pattern-count, #compare .list-view-options .list-view, #compare #version-select .version-option-div, #compare #version-select .version-select-div, #sourceCode, .icons .icon, .icons {
  display: flex;
  align-items: center;
  justify-content: center;
}
#animation .hide.animation-controls, .hide#animation, #pattern .pattern-buttons .hide.apply-cancel, #pattern .pattern-buttons .hide.add-remove, #pattern .pattern-count .hide.pointer-group, #pattern .pattern-count .hide.pointer, #pattern .hide.pattern-count, #compare .list-view-options .hide.list-view, #compare #version-select .hide.version-option-div, #compare #version-select .hide.version-select-div, .hide#sourceCode, .icons .hide.icon, .hide.icons {
  display: none;
}

.hide {
  display: none;
}

.material-icons {
  cursor: pointer;
  color: #465054;
}

.animate__animated.animate__slideInRight {
  --animate-duration: 0.5s;
}

body {
  font-family: "Inconsolata", monospace;
  margin: 0;
  padding: 0;
  color: #465054;
}
body ::-webkit-scrollbar {
  width: 2px;
  height: 2px;
}
body ::-webkit-scrollbar-track {
  background-color: transparent;
}
body ::-webkit-scrollbar-thumb {
  border: 1px solid #465054;
  background-color: #465054;
}

#cy {
  margin: 10px;
  z-index: 99;
  height: calc(100vh - 150px);
  width: calc(100vw - 75px);
  border: 5px solid #465054;
  background-color: #f6f7f8;
}

.loader {
  z-index: 999;
  border: 5px solid #F3F3F3;
  border-radius: 50%;
  border-top: 5px solid #465054;
  width: 30px;
  height: 30px;
  -webkit-animation: spin 2s linear infinite;
  /* Safari */
  animation: spin 2s linear infinite;
  position: absolute;
  top: 50%;
  left: 50%;
}

/* Safari */
@-webkit-keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
  }
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.header {
  height: 90px;
}

#info {
  padding: 10px 15px 0px 10px;
}
#info .system {
  font-weight: bold;
  font-size: 25px;
  text-transform: uppercase;
}
#info .commit {
  padding: 5px 0px 5px 10px;
}
#info .commit a {
  font-weight: bold;
  text-decoration: none;
  color: #465054;
}
#info .commit a:active {
  color: #465054;
}
#info .commit div {
  margin-right: 5px;
}
#info .commit div.commit-id {
  margin-right: 10px;
}
#info .commit div.commit-id:hover {
  cursor: pointer;
  text-decoration: underline;
  opacity: 0.6;
}
#info .commit img {
  width: 16px;
  opacity: 0.7;
}
#info .class-id {
  visibility: hidden;
}
#info .class-id .package {
  padding: 2px;
  width: fit-content;
  background-color: #ECECEA;
}
#info .class-id .class {
  padding: 2px;
  padding-left: 10px;
}
#info .class-id.show {
  visibility: visible;
}

.menu {
  position: fixed;
  top: 100px;
  right: 0;
  height: calc(100vh - 140px);
  overflow-x: hidden;
  overflow-y: auto;
}

.icons .icon {
  padding: 10px 8px;
  cursor: pointer;
}
.icons .icon:hover {
  opacity: 0.6;
}
.icons .icon .icon-text {
  font-size: 8px;
}

.timeline {
  margin: 0 10px;
  width: calc(100vw - 65px);
  height: 59px;
  overflow-x: auto;
  overflow-y: hidden;
}
.timeline #roles {
  display: flex;
  flex-direction: row;
  padding-left: 2px;
}
.timeline #roles .role {
  margin-top: 20px;
  min-width: 16px;
  min-height: 16px;
  border-radius: 8px;
  margin-right: 2px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-align: center;
  cursor: pointer;
}
.timeline #roles .role.role-package {
  border-radius: 0;
}
.timeline #roles .role.role-version {
  border-radius: 0;
  border: 2px solid #ECECEA;
  min-width: 14px;
  min-height: 14px;
}
.timeline #roles .role .selected:before {
  font-size: 12px;
  width: 100px;
  font-weight: bold;
  color: #465054;
  content: attr(data-text);
  opacity: 1;
  position: absolute;
  left: -24px;
  top: -13px;
}
.timeline #roles .role.hover-no-effect:hover {
  cursor: default;
  transform: none;
}
.timeline #roles .role.hover-no-effect:hover .date:hover:before {
  transform: translateY(-3px);
}
.timeline #roles .role:hover {
  transform: translateY(-3px);
}
.timeline #roles .role.selected-version {
  min-width: 80px;
}
.timeline #roles .role .date:before {
  font-size: 10px;
  width: 60px;
  height: 50px;
  color: #465054;
  content: attr(data-date);
  opacity: 0;
  position: absolute;
  bottom: -32px;
  left: -10px;
  text-align: left;
}
.timeline #roles .role .date:hover:before {
  opacity: 1;
}
.timeline #roles .role .tooltip {
  position: relative;
}

.close {
  position: fixed;
  cursor: pointer;
  top: 20px;
  right: 20px;
  z-index: 9999;
}
.close:hover {
  background-color: white;
}

.dialog {
  overflow-y: auto;
  background-color: white;
  z-index: 999;
  position: absolute;
  top: 0;
  right: 0;
  width: 30vw;
  border: 5px solid #f6f7f8;
  height: 90vh;
}
.dialog .message {
  padding: 10px;
}
@media screen and (max-width: 768px) {
  .dialog {
    right: 0;
    width: 100vw;
  }
  .dialog .message {
    font-size: 12px;
  }
}
@media screen and (max-width: 998px) {
  .dialog {
    width: 40vw;
  }
}

#sourceCode {
  width: 40vw;
}
#sourceCode .code {
  height: 100%;
  width: 100%;
}
#sourceCode .code .CodeMirror {
  height: 100%;
  font-size: 16px;
}
@media screen and (max-width: 600px) {
  #sourceCode {
    border: 0;
    width: 100vw;
  }
  #sourceCode .code .CodeMirror {
    font-size: 12px;
  }
}

#history {
  width: fit-content;
}
#history .history-header {
  padding: 10px;
}
#history .history-header .history-export {
  width: fit-content;
  padding: 10px;
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
}
#history .history-header .history-export:hover {
  text-decoration: none;
}
#history .history-row {
  padding: 20px;
  border-bottom: 3px solid #f6f7f8;
  font-size: 16px;
}
#history .history-row .package {
  padding: 2px;
  font-size: 14px;
  width: fit-content;
  background-color: #ECECEA;
}
#history .history-row .commit-date {
  padding-left: 8px;
  padding-top: 3px;
  font-size: 14px;
}
#history .history-row:hover {
  opacity: 0.6;
  cursor: pointer;
}
#history img {
  width: 20px;
  opacity: 0.7;
  padding-right: 5px;
}

#tools {
  padding: 20px;
  min-width: 300px;
  width: 300px;
}
#tools .tool-row {
  padding-bottom: 20px;
}
#tools .tool-row .tool-title {
  text-transform: uppercase;
  font-size: 12px;
  margin-bottom: 2px;
}
#tools .tool-row.class-level.disabled {
  opacity: 0.3;
}
#tools .tool-row.class-level.disabled .tool-row-items div:hover {
  cursor: default;
  opacity: 1;
}
#tools .tool-row .tool-row-items {
  font-size: 16px;
}
#tools .tool-row .tool-row-items.dep-level div {
  padding: 10px 20px;
}
#tools .tool-row .tool-row-items div {
  padding: 10px;
  margin-right: 10px;
}
#tools .tool-row .tool-row-items div.selected-option {
  background-color: #f6f7f8;
}
#tools .tool-row .tool-row-items div:hover {
  cursor: pointer;
  opacity: 0.6;
}
#tools .tool-row .tool-row-items.roles-filter .tool-role {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}
#tools .tool-row .tool-row-items.roles-filter .tool-role[data-role=Controller] {
  background-color: #755194;
}
#tools .tool-row .tool-row-items.roles-filter .tool-role[data-role=Coordinator] {
  background-color: #539967;
}
#tools .tool-row .tool-row-items.roles-filter .tool-role[data-role="Information Holder"] {
  background-color: #BF3F6A;
}
#tools .tool-row .tool-row-items.roles-filter .tool-role[data-role=Interfacer] {
  background-color: #E9AB45;
}
#tools .tool-row .tool-row-items.roles-filter .tool-role[data-role="Service Provider"] {
  background-color: #4D82B0;
}
#tools .tool-row .tool-row-items.roles-filter .tool-role[data-role=Structurer] {
  background-color: #E6A1B2;
}
#tools .tool-row .tool-row-items.roles-filter .tool-role.filtered {
  opacity: 0.2;
}
#tools .tool-row .tool-row-items.roles-filter .tool-role.filtered:hover {
  opacity: 0.8;
}
#tools .tool-row .tool-row-items.roles-filter .tool-role:before {
  font-size: 10px;
  color: #465054;
  content: attr(data-role);
  position: relative;
  opacity: 0;
  top: 30px;
  left: -15px;
}
#tools .tool-row .tool-row-items.roles-filter .tool-role:hover:before {
  opacity: 1;
}
#tools .tool-row .tool-row-items.roles-filter .tool-role:hover {
  opacity: 1;
}

#legend {
  width: calc(100vw - 75px);
  overflow-x: auto;
  font-size: 12px;
  margin: 5px 10px;
  margin-left: 15px;
}
#legend .legend-circle {
  min-width: 16px;
  width: 16px;
  min-height: 16px;
  height: 16px;
  border-radius: 8px;
  margin-right: 5px;
}
#legend .legend-role {
  margin-right: 20px;
}
@media screen and (max-width: 798px) {
  #legend {
    font-size: 10px;
  }
  #legend .legend-circle {
    min-width: 12px;
    width: 12px;
    min-height: 12px;
    height: 12px;
    border-radius: 24px;
    margin-right: 5px;
  }
  #legend .legend-role {
    margin-right: 10px;
  }
}

.chart-container .chart-div {
  width: 100%;
}
.chart-container .chart-div .ct-series-a .ct-line {
  stroke: #465054;
  stroke-width: 2px;
}
.chart-container .chart-div .ct-series-a .ct-point {
  stroke-width: 5px;
  stroke: #465054;
}
.chart-container .chart-div .ct-series-a .ct-label {
  padding: 5px;
  padding-bottom: 15px;
  font-size: 14px;
  fill: #465054;
  color: #465054;
  opacity: 0;
}
.chart-container .chart-div .ct-series-a .ct-label:hover {
  opacity: 1;
  cursor: pointer;
}

#compare {
  min-width: 500px;
  overflow-x: hidden;
  padding: 20px;
  font-size: 16px;
}
@media screen and (max-width: 600px) {
  #compare {
    min-width: 0;
    width: calc(50vw);
    font-size: 12px;
    padding: 20px;
  }
}
#compare #version-select {
  width: 300px;
}
@media screen and (max-width: 600px) {
  #compare #version-select {
    width: 250px;
  }
}
#compare #version-select .version-select-div {
  cursor: pointer;
  padding: 10px;
  justify-content: space-between;
}
#compare #version-select .version-select-div .version-selected .version-option-div {
  padding: 0 10px;
  background-color: transparent;
  transform: scale(1.2);
}
@media screen and (max-width: 600px) {
  #compare #version-select .version-select-div .version-selected .version-option-div {
    transform: none;
  }
}
#compare #version-select .version-select-icon {
  padding-left: 20px;
}
#compare #version-select .version-options-list {
  position: fixed;
  top: 60px;
  width: 300px;
  background-color: white;
  max-height: calc(50vh);
  overflow: auto;
}
@media screen and (max-width: 600px) {
  #compare #version-select .version-options-list {
    transform: none;
  }
}
@media screen and (max-width: 600px) {
  #compare #version-select .version-options-list .version-option {
    width: 250px;
  }
}
#compare #version-select .version-option-div {
  cursor: pointer;
  background-color: #f6f7f8;
  padding: 10px;
  margin-bottom: 2px;
}
#compare #version-select .version-option-div img {
  width: 14px;
  opacity: 0.7;
  padding-right: 5px;
}
#compare #version-select .version-option-div .commit-id {
  font-weight: bold;
  font-size: 14px;
  padding-right: 10px;
}
#compare #version-select .version-option-div .commit-date {
  font-size: 12px;
}
#compare #version-select .version-option-div:hover {
  opacity: 0.6;
}
#compare .list-view-options {
  justify-content: space-between;
}
@media screen and (max-width: 600px) {
  #compare .list-view-options {
    overflow-y: hidden;
    overflow-x: auto;
  }
  #compare .list-view-options .list-view {
    padding: 5px;
  }
}
#compare .list-view-options .list-view {
  cursor: pointer;
  min-width: 90px;
  text-align: center;
  padding: 10px;
}
#compare .list-view-options .list-view:hover {
  background-color: #f6f7f8;
}
#compare .list-view-options .list-view.selected-view {
  font-weight: bold;
  border-bottom: 6px solid #ECECEA;
  margin-bottom: -2px;
}
#compare .list-view-options .list-view .count {
  margin-left: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  color: #465054;
  background-color: #ECECEA;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  white-space: nowrap;
  height: 12px;
}
#compare .change-list-div .change-list-group {
  margin-top: 10px;
  padding: 10px;
  background-color: #f6f7f8;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
#compare .change-list-div .change-list .change-list-row {
  align-items: center;
  padding: 10px;
  cursor: pointer;
  margin-bottom: 2px;
}
#compare .change-list-div .change-list .change-list-row:hover {
  background-color: #f6f7f8;
}
#compare .change-list-div .change-list .change-list-row .list-item-circle {
  min-width: 20px;
  min-height: 20px;
  border-radius: 10px;
}
#compare .change-list-div .change-list .change-list-row .list-item-package {
  background-color: #465054;
  min-width: 20px;
  min-height: 20px;
}
#compare .change-list-div .change-list .change-list-row .list-item-text {
  padding-left: 10px;
  overflow: hidden;
}
#compare .change-list-div .change-list .change-list-row .list-item-text .list-item-package-text {
  font-size: 12px;
  padding: 2px;
  width: fit-content;
  background-color: #ECECEA;
}
#compare .change-list-div .change-list .change-list-row .list-item-text .list-item-class-text {
  font-size: 14px;
}
@media screen and (max-width: 600px) {
  #compare .change-list-div .change-list .change-list-row .list-item-text .list-item-package-text {
    font-size: 10px;
  }
  #compare .change-list-div .change-list .change-list-row .list-item-text .list-item-class-text {
    font-size: 12px;
  }
}

#pattern {
  padding: 20px;
}
#pattern.full {
  width: 100vw;
}
#pattern .pattern-count {
  cursor: default;
}
#pattern .pattern-count .pointer {
  border-radius: 50%;
  background-color: #ECECEA;
  height: 20px;
  width: 20px;
}
#pattern .pattern-count .divider {
  height: 50px;
  width: 5px;
  background-color: #ECECEA;
}
#pattern .pattern-count .arrow {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #ECECEA;
}
#pattern .pattern-role {
  padding: 20px;
  justify-content: space-between;
}
#pattern .pattern-role-option {
  cursor: pointer;
  margin-right: 5px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
@media screen and (max-width: 798px) {
  #pattern .pattern-role-option {
    width: 30px;
    height: 30px;
    border-radius: 50%;
  }
}
#pattern .pattern-role-option[data-role=Controller] {
  background-color: #755194;
}
#pattern .pattern-role-option[data-role=Coordinator] {
  background-color: #539967;
}
#pattern .pattern-role-option[data-role="Information Holder"] {
  background-color: #BF3F6A;
}
#pattern .pattern-role-option[data-role=Interfacer] {
  background-color: #E9AB45;
}
#pattern .pattern-role-option[data-role="Service Provider"] {
  background-color: #4D82B0;
}
#pattern .pattern-role-option[data-role=Structurer] {
  background-color: #E6A1B2;
}
#pattern .pattern-role-option.removed {
  opacity: 0.2;
}
#pattern .pattern-role-option.removed:hover {
  opacity: 0.8;
}
#pattern .pattern-role-option:before {
  font-size: 10px;
  color: #465054;
  content: attr(data-role);
  position: relative;
  opacity: 0;
  top: 40px;
}
@media screen and (max-width: 798px) {
  #pattern .pattern-role-option:before {
    top: 30px;
  }
}
#pattern .pattern-role-option:hover:before {
  opacity: 1;
}
#pattern .pattern-role-option:hover {
  opacity: 1;
}
#pattern .pattern-buttons {
  margin-top: 50px;
  justify-content: space-between;
}
#pattern .pattern-buttons .add-remove .icon:first-child {
  margin-right: 20px;
}
#pattern .pattern-buttons .add-remove .icon:hover {
  opacity: 0.6;
}
#pattern .pattern-buttons .apply-cancel .cancel {
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
  padding: 10px;
  margin-right: 10px;
}
#pattern .pattern-buttons .apply-cancel .cancel:hover {
  text-decoration: none;
  opacity: 0.6;
}
#pattern .pattern-buttons .apply-cancel .button {
  padding: 10px;
  width: fit-content;
  cursor: pointer;
  font-size: 12px;
  border: 2px solid #465054;
  box-shadow: 2px 2px;
}
#pattern .pattern-buttons .apply-cancel .button:hover {
  opacity: 0.6;
}

#animation {
  overflow: hidden;
  height: 50px;
  width: 150px;
}
#animation .splide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 200px;
}
#animation .splide .splide__slide {
  width: 400px;
  height: auto;
}
#animation .splide__progress {
  padding: 10px;
}
#animation .animation-controls div {
  cursor: pointer;
  margin-right: 20px;
}
#animation .animation-controls div:last-child {
  margin-right: 0;
}
#animation .animation-controls div:hover {
  opacity: 0.6;
}
#animation .slide {
  display: none;
}
#animation .slide .version .commit-icon img {
  width: 20px;
  opacity: 0.7;
  padding-right: 5px;
}
#animation .slide .version .commit-id {
  font-weight: bold;
}
#animation .slide .version .commit-date {
  padding-left: 8px;
  padding-top: 3px;
  font-size: 14px;
}

/*# sourceMappingURL=style.cs.map */
