'use strict';

var vueScript = document.createElement('script');
var vueResourceScript = document.createElement('script');
// TODO: add "script.js" to web_accessible_resources in manifest.json
vueScript.src = chrome.extension.getURL('libs/vue.min.js');
vueResourceScript.src = chrome.extension.getURL('libs/vue-resource.min.js');
(document.head || document.documentElement).appendChild(vueScript);
(document.head || document.documentElement).appendChild(vueResourceScript);
// s.onload = function() {
//     console.log('onload')
//     // this.parentNode.removeChild(this);
// };
// var srcs = [
//   chrome.extension.getURL('libs/vue.min.js'),
//   chrome.extension.getURL('libs/vue-resource.min.js')
// ]
// function addMultiScripts (urls) {
//   urls.forEach((url) => {
//     var script = document.createElement('script')
//     console.log(script)
//     (document.head || document.documentElement).appendChild(script)
//   });
// }

// addMultiScripts(srcs)

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
            <div class="popover-content" v-show="hasResult">
                <div class="definition">
                  <p v-for="item in definition">{{item}}</p>
                </div>
                <div class="add-btn">
                  <div href="#" class="v-transit_btn" v-show="!isAddSuccess" id="shanbay-add-btn" @click="addWord(id)">添加生词</div>
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
      let self = this
      return new Promise(
        function(resolve, reject) {
          var url = `https://api.shanbay.com/bdc/search/?word=${word}`
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
      // v2 401 (UNAUTHORIZED)
      // const url = 'https://api.shanbay.com/bdc/learning/'
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
    }
  },
  ready() {
    // console.log('ready')
    var that = this
    this.addListenerMulti(document, 'mouseup', function (e) {
      const selection = window.getSelection().toString().trim()
      if (/[\u4e00-\u9fa5]/.test( selection ) || /^[\s.\-0-9()•+]+$/.test( selection )) return
      if (selection && that.canTranslate (selection)) {
        that.word = selection
        that.search(selection, that)
        that.show = true
        that.hide()
      }
    })
    this.addListenerMulti(this.$els.app, 'mouseover', function (e) {
      clearTimeout(timeout)
      that.allowHide = false
    })
    this.addListenerMulti(this.$els.app, 'mouseout', function (e) {
      that.allowHide = true
      that.hide()
    })    
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        console.log("received\n");
        console.log(message.data);
        switch (message.callback) {
            case 'popover':
                popover(message.data);
                break;
            case 'forgetWord':
                switch (message.data.msg) {
                    case "success":
                        $('#shanbay-forget-btn').addClass('hide');
                        $('#shanbay_popover .success, #shanbay-check-btn').removeClass('hide');
                        break;
                    case "error":
                        $('#shanbay_popover .success').text('添加失败，请重试。').removeClass().addClass('failed');
                        break;
                    default:
                }
                break;
            case 'addWord':
                switch (message.data.msg) {
                    case "success":
                        that.isAddSuccess = true
                        // $('#shanbay-check-btn').attr('href', 'http://www.shanbay.com/review/learning/' + rsp.data.rsp.id);
                        break;
                    case "error":
                        $('#shanbay_popover .success').text('添加失败，请重试。').removeClass().addClass('failed');
                        break;
                    default:
                }
                break;
        }
    });
  }
})

