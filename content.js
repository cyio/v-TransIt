'use strict';

var vueScript = document.createElement('script');
var vueResourceScript = document.createElement('script');
vueScript.src = chrome.extension.getURL('libs/vue.min.js');
vueResourceScript.src = chrome.extension.getURL('libs/vue-resource.min.js');
(document.head || document.documentElement).appendChild(vueScript);
(document.head || document.documentElement).appendChild(vueResourceScript);

const div = document.createElement('div')
div.innerHTML = '<div id="v-transit"></div>'
document.body.appendChild(div)
let timeout

var vm = new Vue({
  el: '#v-transit',
  template: `
    <div v-el:app id="v-transit-popover" v-show="show" transition="expand">
        <div class="popover-inner">
            <div class="popover-title">
              <div class="word">
                <input v-model="word" @keyup.enter="search(word, this)">
                <a v-show="hasResult" href="{{'https://www.shanbay.com/bdc/vocabulary/' + id + '/'}}" style="float: right;" target="_blank">详细</a>
              </div>
              <div class="pronunciation" v-show="hasResult"> 
                <span>[ {{pronunciations.us}} ]</span>
                <span>us:</span>
                <span class="speaker us" @click="play()"><i class="icon-volume-off"></i></span> 
                <span>uk:</span>
                <span class="speaker uk" @click="play('uk')"><i class="icon-volume-off"></i></span> 
              </div>
            </div>
            <div class="popover-content" v-show="hasAudio">
                <div class="definition">
                  <p v-for="item in definition">{{item}}</p>
                </div>
                <div class="add-btn">
                  <div href="#" class="v-transit_btn" v-show="!isAddSuccess && !hasChinese" id="shanbay-add-btn" @click="addWord(id)">添加生词</div>
                  <div class="v-transit_btn disabled" v-show="isAddSuccess">已加入学习计划</div>
                </div>
            </div>
            <div class="popover-content msg" v-show="!hasResult">{{notFoundMsg}}</div>
        </div>
    </div>
  `,
  data: {
    show: false,
    word: '',
    id: null,
    definition: [],
    pronunciations: {},
    hasAudio: null,
    audios: {},
    currentAudioUrl: '',
    notFoundMsg: '',
    allowHide: true,
    isAddSuccess: false
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
    }
  },
  methods: {
    addListenerMulti (el, s, fn) {
      s.split().forEach(e => el.addEventListener(e, fn, false));
    },
    translate (word) {
      const self = this
      return new Promise(
        function(resolve, reject) {
          const url = `https://api.shanbay.com/bdc/search/?word=${word}`
          self.$http.get(url).then(function (response) {            
            // console.log(response)
            if (response.status === 200) {
              resolve(response)
            } else {
              reject('fail')
            }
          })
        }
      )
    },
    youdao (word) {
      const API_URL = 'http://fanyi.youdao.com/openapi.do?keyfrom=TransIt&key=597592531&type=data&doctype=json&version=1.1&q='
      const self = this
      this.$http.get(API_URL + word).then((response) => {
        console.log(response)
        if (response.statusText === 'OK') {
          const errorCode = response.data.errorCode
          const data = response.data
          if (errorCode === 0) {
            console.log(data.translation[0])
            self.definition = data.translation
            //self.definition = data.web
            self.show = true
            self.hide()
          } else if (errorCode === 60) {
            // 无词典结果，仅在获取词典结果生效
          } else if (errorCode === 30) {
            // 无法进行有效的翻译
          }
        }
      })
    },
    search (selection, that) {
      that.notFoundMsg = ''
      that.translate(selection).then(function(response) {
        let data = response.data.data
        if (response.data.status_code) {
          that.notFoundMsg = response.data.msg
          return
        }
        that.definition = data.definition.split('\n')
        that.pronunciations = data.pronunciations
        that.hasAudio = data.has_audio
        that.id = data.id
        if (that.hasAudio) {
          // 0: aliyuncs  1: shanbay cdn
          that.audios = {
            uk: data.audio_addresses.uk[0],
            us: data.audio_addresses.us[0]
          }
        }
      })
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
      if (!this.allowHide) return
      clearTimeout(timeout)
      var time = 3
      var that = this
      timeout = setTimeout(function(){
        that.show = false
      }, time * 1000)
    },
    canTranslate (text) {
      return /^[a-z]+(\'|\'s)?$/i.test(text);
    },
    hasChinese (text) {
      return /[\u4e00-\u9fa5]/.test(text)
    }
  },
  ready() {
    // console.log('ready')
    var that = this
    this.addListenerMulti(document, 'mouseup', function (e) {
      const selection = window.getSelection().toString().trim()
      if (/^[\s.\-0-9()•+]+$/.test( selection )) return
      if (selection) {
        if (that.hasChinese(selection)) {
          that.word = selection
          that.youdao(selection)
        } else if (that.canTranslate (selection)){
          that.word = selection
          that.search(selection, that)
          that.show = true
          that.hide()
        }
      }
    })
    this.addListenerMulti(this.$els.app, 'mouseover', (e) => {
      clearTimeout(timeout)
      that.allowHide = false
    })
    this.addListenerMulti(this.$els.app, 'mouseout', (e) => {
      that.allowHide = true
      that.hide()
    })    

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("received\n")
      console.log(message.data)
      if (message.callback === 'popover') {
          popover(message.data);
      } else if (message.callback === 'addWord') {
        if (message.data.msg === "success") {
          that.isAddSuccess = true
        } else (
          //添加失败
        )
      }
    })

  }
})

