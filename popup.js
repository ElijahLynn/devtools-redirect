
(function() {
  var storage = chrome.storage.sync;
  var options = {};

  storage.get([
    'opt-velocity-stacktrace'
  ], function(opts) {
    console.log('Options loaded.');
    options = opts;
    
    initPopup();
    
  });

  var initPopup = function() {
    
    velocityStackTrace.init();
  };
  
  var velocityStackTrace = {
    enabled: false,
    
    init: function() {
      var _this = this;
      
      //DOM els,
      this.btn = $('#btn-velocity-stacktrace');
      
      this.btn.bind('click', function() {
        console.log('switching stack trace feature on/off');
        _this.toggleFeature();
      });
      
      chrome.tabs.getSelected(null, function(tab) {
        this.enabled = this.isLoaded();
        console.info(this.enabled);
        this.btn.val(this.enabled ? 'on' : 'off');
        console.log(this.btn.val());
        document.getElementById('currentLink').innerHTML = tab.url;
      });
      
    },
    
    toggleFeature: function() {
      var newFeatureState = this.enabled ? false : true;
      
      //Call the tweakParams page,
      console.log('set the feature to : '+(newFeatureState ? 'on' : 'off'));
      
      
    },
    
    isLoaded: function(document) {
      //Search for the stack trace table, if present, it's loaded,
      return document.getElementById('#velocityerrors') ? true : false;
    }
  };
  
  
})();

