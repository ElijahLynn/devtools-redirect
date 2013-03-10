
(function() {
  
  var redirectRoot = "http://localhost/trsrc-MAINLINE/site/";
  var listeners = [];
  
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
  
  //Communication,
  var ports = {};
  chrome.extension.onConnect.addListener(function(port) {
      if (port.name !== "devtools") return;
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
            }
          }
      });
  });
  
  // Function to send a message to all devtool.html views:
  function notifyDevtools(msg) {
    Object.keys(ports).forEach(function(portId_) {
      ports[portId_].postMessage(msg);
    });
  }
  
  
  
  //Get options on init,
  refreshOptions();
  
  /*
    Build events for the domains,
    
    Note:
    We're divising it by domains in case there's a lot of domains,
    to not loose speed because we need to check on every resources for every domains at the same time.
  */
  function generateResourceCatchers(rules) {
    console.info(rules);
    $.each(rules, function(i) {
      var rule = this;
      console.log(rule.domainURL+' : '+rule.enabled);
      if(!rule.enabled) return; //Make sure the domain is enabled,
      chrome.webRequest.onBeforeRequest.addListener(listeners[listeners.length] = function(details) {
          for(var i=0;i<rule.resources.length;i++) {
            console.info(rule.resources[i].resourceURL+" : "+rule.resources[i].enabled+" && "+details.url.indexOf(rule.resources[i].resourceURL));
            if(rule.resources[i].enabled && details.url.indexOf(rule.resources[i].resourceURL) != -1) {
              console.warn(details.url);
              console.warn(rule.resources[i].resourceRedirectURL);
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

