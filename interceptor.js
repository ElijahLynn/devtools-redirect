
(function() {
  
  var redirectRoot = "http://localhost/trsrc-MAINLINE/site/";
  var listeners = [];
  var resourcesRedirected = {};
  window.resourcesRedirected = resourcesRedirected;
  
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
    
    Boris.getOptions(['rules']).then(function(storeOptions) {
      opts = storeOptions;
      if(opts.rules && opts.rules.length) generateResourceCatchers(opts.rules);
    });
  };
  
  var setBrowserIcon = function(state, tabId) {
    console.info('set icon : '+state);
    var imgSrc = 'img/browser-icon-inactive.png';
    if(state == 'active') {
      imgSrc = 'img/browser-icon-active.png';
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
  window.ports = ports; // REMOVE
  chrome.extension.onConnect.addListener(function(port) {
    console.info('port : '+port.name);
      if(port.name !== "devtools" && port.name !== "popup") return;
      ports[port.portId_] = port;
      
      // Remove port when destroyed (eg when devtools instance is closed)
      port.onDisconnect.addListener(function(port) {
          delete ports[port.portId_];
      });
      
      port.onMessage.addListener(function(msg) {
          // Whatever you wish
          console.log(msg);
          if(msg && msg.action) {
            switch(msg.action) {
              case 'refreshOptions':
                refreshOptions();
              break;
              case 'bindBadgeUpdateEvent':
                bindBadgeUpdateEvent(msg.tabId);
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
      ports[portId_].postMessage(msg);
    });
  };
  
  // Function to send a message to a specific popup.html view:
  function notifyPopups(msg) {
    Object.keys(ports).forEach(function(portId_) {
      ports[portId_].postMessage(msg);
    });
  };
  
  var getPopupHTML = function(tabId) {
    var popupHTML = generatePopupHTML(tabId);
    notifyPopups({action: 'updateHTML', tabId: tabId, html: popupHTML})
  };
  
  var generatePopupHTML = function(tabId) {
    var newHTML = '';
    if(resourcesRedirected[tabId]) {
      $.each(resourcesRedirected[tabId], function(i, r) {
        console.info(r);
        newHTML += '<li>"'+r.resourceURL+'" -> "'+r.resourceRedirectURL+'"</li>';
      });
      
      return newHTML;
    }
  };
  
  
  var bindBadgeUpdateEvent = function(tabId) {
    
    //Reset the icon on loading,
    chrome.tabs.onUpdated.addListener(function(updateTabId, changeInfo, tab) {
      console.info(tabId+" : "+updateTabId);
      if(tabId != updateTabId) return false;
      
      console.info(changeInfo);
      if(changeInfo.status == 'loading') {
        console.info('set icon from devtools');
        var imgSrc = 'img/browser-icon-inactive.png';
        chrome.browserAction.setIcon({path: imgSrc, tabId: tabId});
        resetBadgeCount(tabId);
        
        resourcesRedirected[tabId] = [];
        getPopupHTML(tabId);
      } else if(changeInfo.status == 'complete') {
        renderBadgeCount(tabId);
        //Update popup's content to list active redirects,
        getPopupHTML(tabId);
      }
    });
  };
  
  
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
    //console.info(rules);
    $.each(rules, function(i) {
      var rule = this;
      //console.log(rule.domainURL+' : '+rule.enabled);
      if(!rule.enabled) return; //Make sure the domain is enabled,
      chrome.webRequest.onBeforeRequest.addListener(listeners[listeners.length] = function(details) {
          for(var i=0;i<rule.resources.length;i++) {
            //console.info(rule.resources[i].resourceURL+" : "+rule.resources[i].enabled+" && "+details.url.indexOf(rule.resources[i].resourceURL));
            if(rule.resources[i].enabled && details.url.indexOf(rule.resources[i].resourceURL) != -1) {
              console.warn(details.url);
              //console.warn(rule.resources[i].resourceRedirectURL);
              if(details.tabId) {
                console.info(details.tabId);
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

