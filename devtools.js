
(function() {
  
  var opts = {};
  Boris.getOptions().then(function(storeOptions) {
    opts = storeOptions;
  });
  
  chrome.devtools.panels.create("Boris", "img/icon-32x32.png", "panel/panel.html", function(panel) {
    var _window; // Going to hold the reference to panel.html's `window`
    var newResource = null;
    var currentTab = null;
    
    var data = [];
    var port = chrome.extension.connect({name:"devtools"});
    port.onMessage.addListener(function(msg) {
        // Write information to the panel, if exists.
        // If we don't have a panel reference (yet), queue the data.
        if (_window) {
            _window.do_something(msg);
        } else {
            data.push(msg);
        }
    });
    
    panel.onShown.addListener(function tmp(panelWindow) {
      var _window = panelWindow;

      // Release queued data
      var msg;
      while (msg = data.shift()) { _window.do_something(msg); }
          
      // Just to show that it's easy to talk to pass a message back:
      _window.respond = function(msg) {
          port.postMessage(msg);
      };
      console.info(_window);
  	
  	  //panel.onShown.removeListener(tmp); // Run once only
  	  
  	  //FIXME: Clean that, us a double condition check to make sure that the panel is ready to display and that the data is ready,
    	/*
    	setTimeout(function() {
    	  console.info('panel is shown actions!');
    	  if(!newResource) return;

      	_window.Panel.addResourceFromTools(currentTab, newResource);
      	newResource = null;
    	}, 250);
  	  */
    });
    
    // Show the panel and add the resource when it's selected in the right-click menu,
    chrome.devtools.panels.setOpenResourceHandler(function(resource) {
      panel.show();
      
      //Get the current tab,
      var tabID = chrome.devtools.inspectedWindow.tabId;
      chrome.extension.sendRequest({action: "tabs.get", id: tabID}, function(r) {
        newResource = resource;
        currentTab = r.tab;
        console.info('data ready!');
      });
      
    });
    
  });
    
})();

