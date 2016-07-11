'use strict';

console.log('debug contentscript')

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
                <span class="speaker us" @click="playAudio()"><i class="icon-volume-off"></i></span> 
                <span>uk:</span>
                <span class="speaker uk" @click="playAudio('uk')"><i class="icon-volume-off"></i></span> 
              </div>
              <audio v-el:audious preload="auto" src=""></audio>
              <audio v-el:audiouk preload="auto" src=""></audio>
            </div>
            <div class="popover-content" v-show="hasResult">
                <p>{{ definition }}</p>
                <div class="add-btn"><div href="#" class="v-transit_btn" id="shanbay-add-btn" @click="addWord(id)">添加生词</div>
                    <p class="success hide"  v-show="isAddSuccess">成功添加！</p><a href="#" target="_blank" class="v-transit_btn hide" id="shanbay-check-btn">查看</a></div>
            </div>
            <div class="popover-content msg" v-show="!hasResult">{{notFoundMsg}}</div>
        </div>
    </div>
  `,
  data: {
    show: false,
    word: '',
    id: null,
    definition: '',
    pronunciations: {},
    hasAudio: null,
    currentAudioUrl: '',
    notFoundMsg: ''
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
        that.definition = data.definition
        that.pronunciations = data.pronunciations
        that.hasAudio = data.has_audio
        that.id = data.id
        if (that.hasAudio) {
          // 0: aliyuncs  1: shanbay cdn
          that.$els.audiouk.src = data.audio_addresses.uk[0]
          that.$els.audious.src = data.audio_addresses.us[0]
        }
      })
    },
    addWord (wordId) {
      // v2 401 (UNAUTHORIZED)
      // const url = 'https://api.shanbay.com/bdc/learning/'
      chrome.runtime.sendMessage({method: "addWord", data: wordId})
    },
    playAudio (para) {
      if (para === 'uk') {
        this.$els.audiouk.play()
      } else {
        this.$els.audious.play()
      }
    },
    destroy () {
      var time = 3
      var that = this
      var timeout = setTimeout(function(){
        that.show = false
      }, time * 1000)
      clearTimeout(timeout)
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
      }
    })
    this.addListenerMulti(document, 'click', function (e) {
      if (document.activeElement.tagName === "BODY") {
        that.destroy()
      }
    })
  }
})

