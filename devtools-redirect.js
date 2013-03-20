
(function() {
  
  window.DevtoolsRedirect = {
    //Constants,
    
    //Vars,
    options: {},
    storageItems: null,
    storageOptions: null,
    
    //Functions,
    init: function(options) {
      this.options = $.extend(true, this.options, options);
      
      this.storageItems = $.merge([], ['rules'], this.options.storageOptions)
      
      //Set options on Arthur,
      Arthur.updateOptions({
        storageItems: this.storageItems
      });
      
    },
    
    getOptions: function(opts) {
      return Arthur.retrieve(opts ? opts : this.options.storageOptions);
    },
    
    /*
      setOptions()
        - params: opts -> {'option_name': theOptionValue}
    */
    setOption: function(opt) {
      return Arthur.store(opt);
    }
  };
  
  
  
  DevtoolsRedirect.init({
    storageOptions: [
      'root',
      'disabled'
    ]
  });
  
})();