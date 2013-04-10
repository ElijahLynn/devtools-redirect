
(function() {
  
  var redirectRoot = "http://localhost/trsrc-MAINLINE/site/";
  var listeners = [];
  var resourcesRedirected = {};
  
  var opts = {};
  var refreshOptions = function() {
    //Make sure we remove the old listeners to avoid redirect conflicts,
    if(listeners.length) {
      for(index in listeners) {
        chrome.webRequest.onBeforeRequest.removeListener(listeners[index]);
      }
      //Reset the listeners,
      listeners.length = 0;
    }
    
    DevtoolsRedirect.getOptions(['rules']).then(function(storeOptions) {
      opts = storeOptions;
      if(opts.rules && opts.rules.length) generateResourceCatchers(opts.rules);
    });
  };
  
  var setBrowserIcon = function(state, tabId) {
    var imgSrc = 'images/browser-icon-inactive.png';
    if(state == 'active') {
      imgSrc = 'images/browser-icon-active.png';
    }
    
    chrome.browserAction.setIcon({
      path: imgSrc,
      tabId: tabId
    });
  };
  
  
  // Our hash
  var currentTabId = -1;
  // Set the ID of the current active tab
  chrome.tabs.onActivated.addListener(function(activeInfo) {
    currentTabId = activeInfo.tabId;
  });
  
  var badgeCounts = {};
  var resetBadgeCount = function(tabId) {
    badgeCounts[tabId] = 0;
  };
  
  var renderBadgeCount = function(tabId) {
    if(badgeCounts[tabId] > 0) {
      setBrowserIcon('active', tabId);
      chrome.browserAction.setBadgeText({text: badgeCounts[tabId].toString(), tabId: tabId});
    }
    else {
      setBrowserIcon('inactive', tabId);
      chrome.browserAction.setBadgeText({text: '', tabId: tabId});
    }
  };
  
  
  //Communication,
  var ports = {};
  chrome.extension.onConnect.addListener(function(port) {
      if(port.name != 'devtools' && port.name != 'popup') return;
      var tabId = port.sender && port.sender.tab.id ? port.sender.tab.id : null;
      ports[port.portId_] = {port: port, portId: port.portId_, tabId: tabId, name: port.name};
      
      // Remove port when destroyed (eg when devtools instance is closed)
      port.onDisconnect.addListener(function(port) {
        var portObj = ports[port.portId_];
        if(portObj && port.name == 'devtools' && portObj.tabId) disableTab(portObj.tabId);
        delete ports[port.portId_];
      });
      
      port.onMessage.addListener(function(msg) {
          // Whatever you wish
          if(msg && msg.action) {
            switch(msg.action) {
              case 'refreshOptions':
                refreshOptions();
              break;
              case 'enableTab':
                enableTab(msg.tabId);
              break;
              case 'disableTab':
                disableTab(msg.tabId);
              break;
              case 'getPopupHTML':
                getPopupHTML(msg.tabId);
              break;
            }
          }
      });
  });
  
  // Function to send a message to all devtool.html views:
  function notifyDevtools(msg) {
    Object.keys(ports).forEach(function(portId_) {
      if(ports[portId_].name == 'devtools') ports[portId_].port.postMessage(msg);
    });
  };
  
  // Function to send a message to a specific popup.html view:
  function notifyPopups(msg) {
    Object.keys(ports).forEach(function(portId_) {
      if(ports[portId_].name == 'popup') ports[portId_].port.postMessage(msg);
    });
  };
  
  var getPopupHTML = function(tabId) {
    var popupHTML = generatePopupHTML(tabId);
    notifyPopups({action: 'updateHTML', tabId: tabId, html: popupHTML})
  };
  
  var generatePopupHTML = function(tabId) {
    if(resourcesRedirected[tabId]) {
      var newHTML = '';
      $.each(resourcesRedirected[tabId], function(i, r) {
        newHTML += '<li><a href="'+r.resourceURL+'" title="'+r.resourceURL+'" target="_blank">'+truncateURL(r.resourceURL)+'</a> <i class="icon-arrow-right"></i> <a href="'+r.resourceRedirectURL+'" title="'+r.resourceRedirectURL+'" target="_blank">'+truncateURL(r.resourceRedirectURL)+'</a></li>';
      });
      return newHTML;
    }
  };
  
  var truncateURL = function(url) {
     var str = url;
     if(str.length > 40) str = url.substr(0, 20)+'...'+url.substr(url.length-20, url.length);
     return str
  };

  var activeTabs = {};
  window.activeTabs = activeTabs;
  var enableTab = function(tabId) {
    activeTabs[tabId] = true;
  };
  
  var disableTab = function(tabId) {
    delete activeTabs[tabId];
  };
  
  
  //Reset the icon on loading,
  chrome.tabs.onUpdated.addListener(function(updateTabId, changeInfo, tab) {
    if(!activeTabs[updateTabId]) return;
    
    if(changeInfo.status == 'loading') {
      var imgSrc = 'images/browser-icon-inactive.png';
      chrome.browserAction.setIcon({path: imgSrc, tabId: updateTabId});
      resetBadgeCount(updateTabId);
      
      resourcesRedirected[updateTabId] = [];
      getPopupHTML(updateTabId);
    } else if(changeInfo.status == 'complete') {
      renderBadgeCount(updateTabId);

      //Update popup's content to list active redirects,
      getPopupHTML(updateTabId);
    }
  });
  
  
  //Get options on init,
  refreshOptions();
  
  /*
    Build events for the domains,
    
    Note:
    We're divising it by domains in case there's a lot of domains,
    to not loose speed because we need to check on every resources for every domains at the same time.
  */
  function generateResourceCatchers(rules) {
    var activeRedirects = [];
    $.each(rules, function(i) {
      var rule = this;
      if(!rule.enabled) return; //Make sure the domain is enabled,
      chrome.webRequest.onBeforeRequest.addListener(listeners[listeners.length] = function(details) {
        //Make sure that the devtools for this tab is active,
        if(!activeTabs[details.tabId]) return;
        
        for(var i=0;i<rule.resources.length;i++) {
          if(rule.resources[i].enabled && details.url.indexOf(rule.resources[i].resourceURL) != -1) {
            if(details.tabId) {
              badgeCounts[details.tabId] = badgeCounts[details.tabId] + 1;
              if(typeof resourcesRedirected[details.tabId] == 'undefined') {
                resourcesRedirected[details.tabId] = [];
              }
              resourcesRedirected[details.tabId].push(rule.resources[i]);
            }
            
            return {redirectUrl: rule.resources[i].resourceRedirectURL};
          }
        }
          
        },
        {
          urls: [
            //Matching only specific type of files,
            rule.domainURL+"*.js*",
            rule.domainURL+"*.css*",
            rule.domainURL+"*.less*"
          ]
        },
        ["blocking"]
      );
      
    });
    
  }
  
})();

