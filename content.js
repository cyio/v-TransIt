'use strict';

// inject dom
const div = document.createElement('div')
div.setAttribute('id', 'v-transit-popover');
// login detect
let shanbayIslogined = localStorage.getItem('shanbay_islogined')
if (!shanbayIslogined) {
  chrome.runtime.sendMessage({method: "is_user_signed_on"})
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.callback === 'loginDetect') {
    localStorage.setItem('shanbay_islogined', message.data)
    shanbayIslogined = message.data
  }
})
const eleId = '#v-transit-popover'
let timeout

document.addEventListener('mouseup', function (e) {
  const elemWhiteList = [
    'word_input',
    'v-transit_btn',
    'detail',
  ]
  if (elemWhiteList.some(i => e.target.className.includes(i))) return
  const selection = window.getSelection().toString().trim()
  if (!selection) return
  if (/^[\s.\-0-9()•+]+$/.test( selection )) return
  if (!$(eleId)) {
    document.body.appendChild(div)
  }
  initVue({eleId, selection})
}, false)

function initVue({eleId, selection}){
  return new Vue({
    el: eleId,
    template: vtTpl,
    data: {
      // word data
      id: null,
      learningId: null,
      word: '',
      definition: [],
      pronunciations: {},
      hasAudio: null,
      audios: {},
      currentAudioUrl: '',
      notFoundMsg: '',
      canHide: true,
      show: false,
      showResult: false,
      loadingText: '查询中',
      showAddBtn: false,
      isAddSuccess: false,
      cnToEn: false,
      isUserLogin: shanbayIslogined,
    },
    computed: {
      audioUrlUk () {
        return this.audioUrls.uk
      },
      audioUrlUs () {
        return this.audioUrls.us
      },
      hasResult () {
        return this.notFoundMsg === ''
      },
      hasChinese () {
        return /[\u4e00-\u9fa5]/.test(this.word)
      },
      canTranslate () {
        return /^[a-z]+(\'|\'s)?$/i.test(this.word)
      },
      detailUrl () {
        let url
        if (this.hasChinese) {
          url = 'http://youdao.com/w/eng/' + this.word 	
        } else {
          if (this.learningId) {
            url = 'https://www.shanbay.com/review/learning/' + this.learningId + '/'
          } else {
            url = 'https://www.shanbay.com/bdc/vocabulary/' + this.id + '/'
          }
        }
        return url
      }
    },
    methods: {
      youdao (word) {
        this.reset()
        const API_URL = 'https://fanyi.youdao.com/openapi.do?keyfrom=vTransIt&key=90781853&type=data&doctype=json&version=1.1&q='
        const self = this
        fetch(API_URL + word).then((response) => {
          console.log(response.json())
          return
          //console.log(response)
          //TODO: 修改数据有效检测，可能返回请求频繁提示
          if (response.statusText === 'OK') {
            const errorCode = response.data.errorCode
            const data = response.data
            if (errorCode === 0) {
              //console.log(data.translation[0])
              self.definition = data.translation
              //self.definition = data.web
              self.showResult = true
              self.hide()
            } else if (errorCode === 60) {
              // 无词典结果，仅在获取词典结果生效
              self.loadingText = '无结果'
            } else if (errorCode === 30) {
              // 无法进行有效的翻译
              self.loadingText = '无法进行有效查询'
            }
          }
        })
      },
      shanbay (selection) {
        this.reset()
        chrome.runtime.sendMessage({method: "lookup", data: selection})
      },
      reset () {
        this.notFoundMsg = ''
        this.showResult = false
        this.definition.length = 0
        this.learningId = null 
        this.showAddBtn = false
        this.isAddSuccess = false
        this.loadingText = '查询中'
      },
      handleShanbayData (data) {
        if (!(data && data.definition)) return
        this.definition = data.definition.split('\n')
        this.pronunciations = data.pronunciations
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
      },
      addWord (wordId) {
        chrome.runtime.sendMessage({method: "addWord", data: wordId})
      },
      play (para) {
        if (para === 'uk') {
          chrome.runtime.sendMessage({method: "playAudio", data: this.audios.uk})
        } else {
          chrome.runtime.sendMessage({method: "playAudio", data: this.audios.us})
        }
      },
      hide () {
        if (!this.canHide) return
        clearTimeout(timeout)
        var time = 3
        var that = this
        timeout = setTimeout(() => {
          this.close()
        }, time * 1000)
      },
      close () {
        this.show = false
        if ($(eleId)) {
          document.body.removeChild($(eleId))
        }
      },
      isEmptyObject (e) {
        var t;  
        for (t in e)  
          return !1;  
        return !0  
      }
    },
    ready() {
      this.$watch('word', function () {
        Vue.nextTick(function () {
          if (!this.canHide) {
            this.showResult = false
            this.loadingText = '待命中'
          }
        }.bind(this))
      })
      var that = this

      that.word = selection
      if (that.hasChinese && !that.cnToEn) return
      if (that.hasChinese) {
        that.youdao(that.word)
        that.show = true
      } else if (that.canTranslate){
        that.shanbay(that.word)
        that.show = true
      }

      addListenerMulti(this.$els.app, 'mouseenter', (e) => {
        clearTimeout(timeout)
        that.canHide = false
      })
      addListenerMulti(this.$els.app, 'mouseleave', (e) => {
        that.canHide = true
        that.hide()
      })    

      chrome.storage.onChanged.addListener(function(changes, namespace) {
        that.cnToEn = changes.cnToEn.newValue
      })

      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.callback === 'lookup') {
          this.hide()
          if (message.data && message.data.msg === "success") {
            const data = message.data.rsp.data
            if (this.isEmptyObject(data)) {
              this.loadingText = '未找到'
              return
            }
            if (data && data.status_code) {
              this.notFoundMsg = data.msg
            } else {
              this.handleShanbayData(data)
            }
          } else {
          }

        } else if (message.callback === 'addWord') {
          if (message.data.msg === "success") {
            this.isAddSuccess = true
          } else {
            //添加失败
          }
        } else if (message.callback === 'loginDetect') {
          this.isUserLogin = message.data
          localStorage.setItem('shanbay_islogined', this.isUserLogin)
          if (!this.isUserLogin) {
          }
        }
      })
    }
  })
}
