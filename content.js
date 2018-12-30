'use strict';

// login detect
const loginDetected = localStorage.getItem('shanbay_islogined')
chrome.runtime.sendMessage({method: "is_user_signed_on"})

let word, loadingText, notFoundMsg, isUserLogin, definition, pronunciations, hasAudio, id, learningId, canHide, show, timeout;
document.addEventListener('mouseup', function (e) {
  const selection = window.getSelection().toString().trim()
  if (!selection) return
  if (/^[\s.\-0-9()•+]+$/.test( selection )) return

  document.body.appendChild(div)
  hide()
  word = selection
  if (hasChinese(word)) {
    youdao(word)
    show = true
  } else if (canTranslate(word)){
    shanbay(word)
    show = true
  }
})
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.callback === 'lookup') {
    // this.hide()
    if (message.data && message.data.msg === "success") {
      const data = message.data.rsp.data
      if (isEmptyObject(data)) {
        loadingText = '未找到'
        return
      }
      if (data && data.status_code) {
        notFoundMsg = data.msg
      } else {
        handleShanbayData(data)
      }
    } else {
    }
  } else if (message.callback === 'addWord') {
    if (message.data.msg === "success") {
      isAddSuccess = true
    } else {
      //添加失败
    }
  } else if (message.callback === 'loginDetect') {
    isUserLogin = message.data
    localStorage.setItem('shanbay_islogined', isUserLogin)
    if (!isUserLogin) {
    }
  }
})
function shanbay(selection) {
  // this.reset()
  chrome.runtime.sendMessage({method: "lookup", data: selection})
}
function handleShanbayData(data) {
  if (!(data && data.definition)) return
  $('.definition').innerHTML = data.definition
    .split('\n')
    .map(i => `<p>${i}</p>`)
    .join('')
  $('.vt-pronunciation-us').innerHTML = `[ ${data.pronunciations.us } ]`
  return
  // this.pronunciations = data.pronunciations
  this.hasAudio = data.has_audio
  this.id = data.id
  this.learningId = data.learning_id
  if (!this.learningId) {
    this.showAddBtn = true
  }
  if (this.hasAudio) {
    // 0: aliyuncs  1: shanbay cdn
    this.audios = {
      uk: data.audio_addresses.uk[0],
      us: data.audio_addresses.us[0]
    }
  }
  this.showResult = true
}
function hide () {
  // if (!canHide) return
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    // show = false
    document.body.removeChild(div)
  }, 3 * 1000)
}
// inject dom
const div = document.createElement('div')
div.innerHTML = `
  <div id="v-transit">
    <div v-el:app id="v-transit-popover" v-show="show">
      <div class="popover-inner">
        <div class="popover-title">
          <div class="word">
            <input v-model="word" @keyup.enter="hasChinese ? youdao(word) : shanbay(word)">
            <a v-show="showResult" href="{{detailUrl}}" style="float: right;" target="_blank">详细</a>
          </div>
          <div class="pronunciation" v-show="showResult && !hasChinese"> 
            <span class="vt-pronunciation-us"></span>
            <span>us:</span>
            <span class="speaker us" @click="play()"><i class="icon-volume-off"></i></span> 
            <span>uk:</span>
            <span class="speaker uk" @click="play('uk')"><i class="icon-volume-off"></i></span> 
          </div>
        </div>
        <div class="popover-content" v-show="showResult">
          <div class="definition">
          </div>
          <div class="add-btn">
          </div>
        </div>
        <div class="loading_dots" v-show="!showResult">
        </div>
        <div class="close-btn" @click="close">&#215;</div>
      </div>
    </div>
  </div>
  `
// document.body.appendChild(div)

