vtTpl = `
<div v-el:app id="v-transit-popover" v-show="show">
  <div class="popover-inner">
    <div class="popover-title">
      <div class="word">
        <input v-model="word" @keyup.enter="hasChinese ? youdao(word) : shanbay(word)">
        <a v-show="showResult" href="{{detailUrl}}" style="float: right;" target="_blank">详细</a>
      </div>
      <div class="pronunciation" v-show="showResult && !hasChinese"> 
        <span>[ {{pronunciations.us}} ]</span>
        <span>us:</span>
        <span class="speaker us" @click="play()"><i class="icon-volume-off"></i></span> 
        <span>uk:</span>
        <span class="speaker uk" @click="play('uk')"><i class="icon-volume-off"></i></span> 
      </div>
    </div>
    <div class="popover-content" v-show="showResult">
      <div class="definition">
        <p v-for="item in definition">{{item}}</p>
      </div>
      <div class="add-btn">
        <div href="#" class="v-transit_btn" v-bind:class="{'disabled': isAddSuccess}" v-show="showAddBtn && isUserLogin" id="shanbay-add-btn" @click="addWord(id)">{{isAddSuccess ? '添加成功' : '添加生词'}}</div>
      </div>
    </div>
    <div class="loading_dots" v-show="!showResult">
      <small>{{loadingText}}</small>
    </div>
    <div class="popover-content msg" v-show="!hasResult">{{notFoundMsg}}</div>
    <div class="close-btn" @click="close">&#215;</div>
  </div>
</div>
`
