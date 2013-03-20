
(function() {
  var currentTabId = null;
  
  var updateHTML = function(newHTML) {
    var list = $('#list-resources');

    if(newHTML && newHTML != '') {
      list.html(newHTML);
    } else {
      list.html('<li>No active redirects</li>');
    }
  };
  
  
  var port = chrome.extension.connect({name:"popup"});
  port.onMessage.addListener(function(msg) {
    console.info(msg);
    if(msg.action == 'updateHTML' && typeof updateHTML == 'function' && currentTabId == msg.tabId) {
      updateHTML(msg.html);
    }
  });
  
  chrome.tabs.getSelected(null, function(tab) {
    currentTabId = tab.id;
    port.postMessage({action: 'getPopupHTML', tabId: currentTabId});
  });
  
  
  
})();

