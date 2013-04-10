
(function() {
  
  window.Arthur = {
    //Constants,
    
    //Vars,
    options: {},
    storage: null,
    storageItems: null,
    msgEvents: null,
    
    //Functions,
    init: function(options) {
      
      //set options,
      this.updateOptions(options);
      
      this.msgEvents = {};
      
      //We'll use the chrome storage API,
      if(chrome.storage) this.storage = chrome.storage.sync;
      
    },
    
    updateOptions: function(options) {
      this.options = $.extend(true, this.options, options);
      this.storageItems = this.options.storageItems ? this.options.storageItems : [];
    },
    
    store: function(items, val) {
      var storeObj = null;
      var def = new $.Deferred();
      if(!this.storage) return def.reject();
      
      if(items instanceof Array) {
        for(var i = 0; i<items.length; i++) {
          this.store(items[i]);
        }
      }
      else if(typeof items == 'string' && typeof val != 'undefined') {
        storeObj = {};
        storeObj[items] = val;
      }
      else {
        storeObj = items;
      }
      
      if(storeObj instanceof Object) {
        this.storage.set(items, function() { def.resolve(); });
      }
      else { def.reject('Unrecognized value type to store.'); }
      
      return def;
    },
    
    retrieve: function(items) {
      var def = new $.Deferred();
      if(!this.storage) return def.reject();
      
      //Retrieve all options if no option is passed,
      items = items ? items : this.storageItems;
      
      this.storage.get(items, function(storageItems) {
        def.resolve(storageItems);
      });
      
      return def;
    },
    
    /*
      Port connection communication,
    */
    initConnection: function(portName) {
      var _this = this;
      var connection = {};
      
      // Communication,
      var ports = {};
      chrome.extension.onConnect.addListener(function(port) {
          if (port.name !== portName) return;
          ports[port.portId_] = port;
          
          // Remove port when destroyed (eg when devtools instance is closed)
          port.onDisconnect.addListener(function(port) {
              delete ports[port.portId_];
          });
          
          port.onMessage.addListener(function(msg) {
            _this.catchMsg(msg);
          });
      });
      
      // Function to send a message to all devtool.html views:
      var notifyPort = function(msg) {
        Object.keys(ports).forEach(function(portId_) {
          ports[portId_].postMessage(msg);
        });
      }
      
      var port = chrome.extension.connect({name: portName});
      
      //We return a function that is used to call the port if needed,
      return notifyPort;
    },
    
    bindMsgEvent: function(msg, func) {
      this.msgEvents[msg] = func;
      return this.msgEvents[msg];
    },
    
    catchMsg: function(passedMsg) {
      var firedMsg = false;
      $.each(this.msgEvents, function(msg, key) {
        if(key === passedMsg) {
          msg();
          firedMsg = true;
        }
      });
      
    }
    
  };
  
  Arthur.init();
  
})();


chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  switch (request.action) {
    case "tabs.get":
      chrome.tabs.get(request.id, function(tab) {
        sendResponse({tab: tab});
      });
    break;

    default:
      sendResponse({}); // snub them.
    break;
  }
});

