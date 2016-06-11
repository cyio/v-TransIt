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
    <div class="v-transit-popover" v-show="show">
        <div class="popover-inner">
            <div class="popover-title">
              <div class="word">
                <input v-model="word" @keyup.enter="query(word, this)">
                <a href="/bdc/vocabulary/5334" style="float: right;" target="_blank">详细</a>
              </div>
              <div class="pronunciation"> 
                <span>/{{pronunciations.us}}/</span>
                <span>us:</span>
                <span class="speaker us" @click="playAudio()"><i class="icon-volume-off"></i></span> 
                <span>uk:</span>
                <span class="speaker uk" @click="playAudio('uk')"><i class="icon-volume-off"></i></span> 
              </div>
              <audio v-el:audiouk preload="auto" v-bind:src="audioUrlUk"></audio>
              <audio v-el:audious preload="auto" v-bind:src="audioUrlUs"></audio>
            </div>
            <div class="popover-content">
                <p>{{ definition }}</p>
                <div class="add-btn" v-show="isShanbay"><a href="#" class="btn" id="shanbay-add-btn">添加生词</a>
                    <p class="success hide">成功添加！</p><a href="#" target="_blank" class="btn hide" id="shanbay-check-btn">查看</a></div>
            </div>
        </div>
    </div>
    `,
  data: {
    show: false,
    word: '',
    definition: '',
    pronunciations: {},
    hasAudio: null,
    audioUrls: {},
    currentAudioUrl: ''
  },
  computed: {
    audioUrlUk () {
      return this.audioUrls.uk
    },
    audioUrlUs () {
      return this.audioUrls.us
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
            console.log(response)
            if (response.status === 200) {
              resolve(response)
            } else {
              reject('fail')
            }
          })
        }
      )
    },
    query (selection, that) {
      that.translate(selection).then(function(result) {
        let data = result.data.data
        that.definition = data.definition
        that.pronunciations = data.pronunciations
        that.hasAudio = data.has_audio
        if (that.hasAudio) {
          // 0: aliyuncs  1: shanbay cdn
          that.audioUrls.uk = data.audio_addresses.uk[0]
          that.audioUrls.us = data.audio_addresses.us[0]
        }
      })
    },
    playAudio (para) {
      console.log(this.audioUrlUk)
      console.log(this.audioUrls.uk)
      if (para === 'uk') {
        this.$els.audiouk.play()
      } else {
        this.$els.audious.play()
      }
    }
  },
  ready() {
    console.log('ready')
    var that = this
    this.addListenerMulti(document, 'mouseup', function (e) {
      const selection = window.getSelection().toString().trim()
      if (selection) {
        that.word = selection
        that.query(selection, that)
        that.show = true
      }
    })
  }
})

