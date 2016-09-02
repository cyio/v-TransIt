const check = document.getElementById('cn-to-en')
chrome.storage.sync.get(['cnToEn'], function(items) {
	check.checked = items.cnToEn
});
check.addEventListener("change", function (e) {
	chrome.storage.sync.set({'cnToEn': check.checked}, function() {
		console.log('Settings saved');
	});
})
