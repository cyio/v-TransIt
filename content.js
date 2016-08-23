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
                <input v-model="word" @keyup.enter="hasChinese ? youdao(word) : shanbay(word)">
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
            <div class="popover-content" v-show="hasResult">
                <div class="definition">
                  <p v-for="item in definition">{{item}}</p>
                </div>
                <div class="add-btn">
                  <div href="#" class="v-transit_btn" v-bind:class="{'disabled': isAddSuccess}" v-show="showAddBtn" id="shanbay-add-btn" @click="addWord(id)">{{isAddSuccess ? '添加成功' : '添加生词'}}</div>
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
		learningId: null,
		showAddBtn: false,
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
		},
    hasChinese () {
      return /[\u4e00-\u9fa5]/.test(this.word)
    },
    canTranslate () {
      return /^[a-z]+(\'|\'s)?$/i.test(this.word)
    }
  },
  methods: {
    addListenerMulti (el, s, fn) {
      s.split().forEach(e => el.addEventListener(e, fn, false));
		},
		youdao (word) {
			this.reset()
      const API_URL = 'https://fanyi.youdao.com/openapi.do?keyfrom=TransIt&key=90781853&type=data&doctype=json&version=1.1&q='
      const self = this
      this.$http.get(API_URL + word).then((response) => {
        //console.log(response)
				//TODO: 修改数据有效检测，可能返回请求频繁提示
        if (response.statusText === 'OK') {
          const errorCode = response.data.errorCode
          const data = response.data
          if (errorCode === 0) {
            //console.log(data.translation[0])
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
    shanbay (selection) {
			this.reset()
			chrome.runtime.sendMessage({method: "lookup", data: selection})
    },
		reset () {
      this.notFoundMsg = ''
			this.definition.length = 0
			this.learningId = null 
			this.showAddBtn = false
			this.isAddSuccess = false
		},
		handleShanbayData (data) {
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
    }
},
  ready() {
    var that = this
    this.addListenerMulti(document, 'mouseup', function (e) {
      const selection = window.getSelection().toString().trim()
			if (!selection) return
      if (/^[\s.\-0-9()•+]+$/.test( selection )) return
			that.word = selection
			if (that.hasChinese) {
				that.youdao(that.word)
				that.show = true
				that.hide()
			} else if (that.canTranslate){
				that.shanbay(that.word)
				that.show = true
				that.hide()
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
      //console.log(message.data)
      if (message.callback === 'lookup') {
				if (message.data.msg === "success") {
					const data = message.data.rsp.data
					if (data.status_code) {
						this.notFoundMsg = data.msg
					} else {
						this.handleShanbayData(data)
					}
				} else {
					//失败
				}

      } else if (message.callback === 'addWord') {
        if (message.data.msg === "success") {
          this.isAddSuccess = true
        } else {
          //添加失败
        }
      }
    })
  }
})

