
(function(Arthur, Boris) {
  
  /*
    Rules Model,
  */
  Boris.Rule = can.Model({
    attributes : {
      resources : "App.Models.Resource.models",
      enabled: 'boolean'
    }
  }, {
    enabled: true,
    domainURL: null,
    resources: null
    
  });
  
  Boris.Resource = can.Model({
    attributes: {
      enabled: 'boolean'
    }
  }, {
    enabled: true,
    resourceURL: null,
    resourceRedirectURL: null
  });
  
  Boris.Resource.List = can.Model.List({
   
  });
  
  /*
    Panel constructor,
  */
  Boris.Panel = can.Control({
    
    defaults: {
      rules: null
    }
    
  },
  {
    //Functions,
    init: function() {
      var _this = this;
      
      //DOM els,
      this.formRules = $('#form-rules');
      this.formActions = this.formRules.find('.form-actions');
      
      var optionsDef = null;
      if(!this.options.rules) {
        optionsDef = Boris.getOptions('rules').then(function(opts) {
          _this.options.rules = opts['rules'];
        });
      }
      
      //Bind events,
      this.formRules.on('change', 'input.siteEnabled', function(event) {
        var fieldset = $(this).parents('fieldset');
        if(!fieldset[0]) return;
        
        fieldset.find('ul input').attr('disabled', $(this).is(':checked') ? false : true);
        
        event.preventDefault();
      });
      
      //Render the rules,
      $.when(optionsDef).then(function() {
        _this.options.rules = Boris.Resource.models(_this.options.rules);
        
        var rulesHTML = can.view('../views/rules.ejs', {rules: _this.options.rules});
        _this.element.prepend(rulesHTML);
      });
      
    },
    
    /*
      Delegated Events,
    */
    "legend .btn-add click": function(el, event) {
      //Add a new resource row
      var list = el.parents('fieldset').find('ul.list-resources');
      if(list) this.addResource(list);
      
      event.preventDefault();
    },
    
    "ul li .btn-delete click": function(el, event) {
      //Add a new resource row
      this.deleteResourceRow(el.parent());
      
      event.preventDefault();
    },
    
    ".btn-rules-add click": function(el, event) {
      this.addRulesSet();
      
      event.preventDefault();
    },
    
    ".btn-save click": function(el, event) {
      
      el.attr('disabled', true);
      
      var rules = this.retrieveRules();
      
      Boris.setOption({'rules': rules}).then(function() {
        el.removeAttr('disabled');
        
        //Once options are set, update options,
        if(typeof window.respond != 'undefined') window.respond({action: 'refreshOptions'});
        
      });
      
      event.preventDefault();
    },
    
    addResource: function(list, resource) {
      list = list ? list : this.element.find('.list-resources').eq(0);
      
      var newResourceList = Boris.Resource.models([
        {resourceURL: resource ? resource.resourceURL : null, resourceRedirectURL: resource ? resource.resourceRedirectURL : null}
      ]);
      
      var resourceHTML = can.view('../views/rule-resources.ejs', {resources: newResourceList});
      list.append(resourceHTML);
    },
    
    addRulesSet: function() {
      var newRules = Boris.Resource.models([new Boris.Rule()]);
      var ruleHTML = can.view('../views/rules.ejs', {rules: newRules});
      this.formActions.before(ruleHTML);
    },
    
    addResourceFromTools: function(tab, resource) {
      
      //Get domain,
      var domain = this.getDomain(tab.url, true);
      
      //Try to match it in the list,
      var list = this.findDomainList(domain);
      
      // Retrieve the file path,
      var resourceURL = resource.url.replace(/^[^\/]*(?:\/[^\/]*){2}/, "");
      
      //Add the resource,
      this.addResource(list, {resourceURL: resourceURL});
      
    },
    
    deleteResourceRow: function(rowEl) {
      rowEl.remove();
    },
    
    retrieveRules: function() {
      var rules = [];
      
      this.element.find('fieldset').each(function() {
        var el = $(this);
        //Retrieve domain data,
        var domain = {};
        domain.enabled = el.find('input.siteEnabled').is(':checked') ? true : false;
        domain.domainURL = el.find('input.domainURL').val();
        
        //Retrieve rules data,
        domain.resources = [];
        el.find('ul.list-resources li').each(function() {
          var el = $(this);
          
          var resource = {};
          resource.enabled = el.find('input.resourceEnabled').is(':checked') ? true : false;
          resource.resourceURL = el.find('input.resourceURL').val();
          resource.resourceRedirectURL = el.find('input.resourceRedirectURL').val();
          
          domain.resources.push(resource);
          
        });
        
        rules.push(domain);
      });
      
      return rules;
    },
    
    findDomainList: function(domain) {
      var list = null;
      
      //Crawl current domains,
      this.element.find('fieldset legend').each(function() {
        var txtDomain = $(this).find('input.domainURL');
        if(txtDomain.val() == domain) list = $(this).next('ul.list-resources');
      });
      
      return list;
    },
    
    getDomain: function(url, asRegex) {
      var matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
      var domain  = matches && matches[1] ? matches[1] : null;
      return domain && asRegex ? "*://"+domain : domain;
    }
    
  });
  
  window.Panel = new Boris.Panel('#form-rules', {});
  
})(Arthur, Boris);


