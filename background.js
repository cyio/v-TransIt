chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if(request.method != 'getLocalStorage') {
        console.log("received method: " + request.method);
        console.log(request);
    }
    switch (request.method) {
        case 'is_user_signed_on':
            isUserSignedOn();
            break;
        case 'lookup':
            isUserSignedOn(function () {
                getClickHandler(request.data, sender.tab);
            });
            break;
        case 'addWord':
            addNewWordInBrgd(request.data, sender.tab);
            break;
        case 'forgetWord':
            forgetWordInBrgd(request.data, sender.tab);
            break;
        case 'playAudio':
            playAudio(request.data);
            break;
        default :
            sendResponse({data: []}); // snub them.
    }
});


function addNewWordInBrgd(word_id, tab) {
    chrome.cookies.getAll({"url": 'http://www.shanbay.com'}, function (cookies) {
        Vue.http({url: 'http://www.shanbay.com/api/v1/bdc/learning/', method: 'POST', data: JSON.stringify({content_type: "vocabulary", id: word_id}) }).then(function (response) {
          console.log(response)
          chrome.tabs.sendMessage(tab.id, {
              callback: 'addWord',
              data: {msg: 'success', rsp: response.data}
          });
          console.log('success');
        }, function (response) {
          chrome.tabs.sendMessage(tab.id, {
              callback: 'addWord',
              data: {msg: 'error', rsp: {}}
          });
          console.log('error');
        })
    });
}

function playAudio(audio_url) {
    if (audio_url) {
        new Howl({
            src: [audio_url]
        }).play()
    }
}
