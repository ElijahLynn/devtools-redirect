
(function(Arthur, DevtoolsRedirect) {

  /*
    Rules Model,
  */
  DevtoolsRedirect.Rule = can.Model({
    attributes : {
      resources : "App.Models.Resource.models",
      enabled: 'boolean'
    }
  }, {
    enabled: true,
    domainURL: null,
    resources: null
    
  });
  
  DevtoolsRedirect.Resource = can.Model({
    attributes: {
      enabled: 'boolean'
    }
  }, {
    enabled: true,
    resourceURL: null,
    resourceRedirectURL: null
  });
  
  DevtoolsRedirect.Resource.List = can.Model.List({
   
  });
  
  /*
    Panel constructor,
  */
  DevtoolsRedirect.Panel = can.Control({
    
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

        optionsDef = DevtoolsRedirect.getOptions('rules').then(function(opts) {
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
        _this.options.rules = DevtoolsRedirect.Resource.models(_this.options.rules);
        
        if(_this.options.rules && _this.options.rules.length) {
          var rulesHTML = can.view('views/rules.ejs', {rules: _this.options.rules});
          _this.element.prepend(rulesHTML);
        }
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
      
      var rules = this.retrieveRules();
      
      if(!chrome.storage) { return; }

      el.attr('disabled', true);

      chrome.storage.sync.set({'rules': rules}, function() {
        el.removeAttr('disabled');
        
        //Once options are set, update options,
        if(typeof window.respond != 'undefined') window.respond({action: 'refreshOptions'});
      });
      
      event.preventDefault();
    },
    
    addResource: function(list, resource) {
      list = list ? list : this.element.find('.list-resources').eq(0);
      
      var newResourceList = DevtoolsRedirect.Resource.models([
        {resourceURL: resource ? resource.resourceURL : null, resourceRedirectURL: resource ? resource.resourceRedirectURL : null}
      ]);
      
      var resourceHTML = can.view('views/rule-resources.ejs', {resources: newResourceList});
      list.append(resourceHTML);
    },
    
    addRulesSet: function() {
      var newRules = DevtoolsRedirect.Resource.models([new DevtoolsRedirect.Rule()]);
      var ruleHTML = can.view('views/rules.ejs', {rules: newRules});
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
  
  window.Panel = new DevtoolsRedirect.Panel('#form-rules', {});
  
})(Arthur, DevtoolsRedirect);

(function(window) {
  can.view.preload('views_rules_ejs', can.EJS(function(_CONTEXT,_VIEW) { with(_VIEW) { with (_CONTEXT) {var ___v1ew = [];___v1ew.push(can.view.txt(0,'',0,this,function(){var ___v1ew = []; $.each( rules, function( i, rule ) { ___v1ew.push("\n  <fieldset>\n    <legend>\n      <input class=\"siteEnabled\" type=\"checkbox\" placeholder=\"Enabled\" ");___v1ew.push(can.view.txt(0,'input',1,this,function(){var ___v1ew = []; if(rule.attr('enabled')) { ___v1ew.push(" checked=\"checked\""); } ;return ___v1ew.join('')}));
___v1ew.push(" ",can.view.pending(),"/>");___v1ew.push("\n      <div class=\"input-prepend\">\n        <span class=\"add-on\"><i class=\"icon-globe\"></i></span>\n        <input class=\"domainURL span6\" type=\"text\" placeholder=\"domain URL\" value=\"");___v1ew.push(can.view.txt(1,'input','value',this,function(){ return  rule.attr('domainURL') }));___v1ew.push("\" ",can.view.pending(),"/>");___v1ew.push("\n      </div>\n      <a class=\"btn btn-add\"><i class=\"icon-plus-sign\"></i></a>\n    </legend>\n    \n    <ul class=\"list-resources\">\n      ");___v1ew.push(can.view.txt(0,'ul',0,this,function(){var ___v1ew = []; if(rule.resources) { ___v1ew.push("\n        ");___v1ew.push(can.view.txt(0,'ul',0,this,function(){ return  can.view.render('views/rule-resources.ejs', {'resources': rule.resources}) }));___v1ew.push("\n      "); } ;return ___v1ew.join('')}));
___v1ew.push("\n    </ul>\n    <div class=\"clear\"></div>\n  </fieldset>\n  \n"); }); ;return ___v1ew.join('')}));
; return ___v1ew.join('')}} }));
  can.view.preload('views_rule-resources_ejs', can.EJS(function(_CONTEXT,_VIEW) { with(_VIEW) { with (_CONTEXT) {var ___v1ew = [];___v1ew.push(can.view.txt(0,'ul',0,this,function(){var ___v1ew = []; $.each( resources, function( i, resource ) { ___v1ew.push("\n  <li>\n    <input class=\"resourceEnabled\" type=\"checkbox\" ");___v1ew.push(can.view.txt(0,'input',1,this,function(){var ___v1ew = []; if(resource.attr('enabled')) { ___v1ew.push(" checked=\"checked\""); } ;return ___v1ew.join('')}));
___v1ew.push(" ",can.view.pending(),"/>");___v1ew.push("\n    <input class=\"resourceURL span5\" type=\"text\" placeholder=\"Resource URL\" value=\"");___v1ew.push(can.view.txt(1,'input','value',this,function(){ return  resource.attr('resourceURL') }));___v1ew.push("\" ",can.view.pending(),"/>");___v1ew.push("\n    <span class=\"icon-chevron-right\"></span>\n    <input class=\"resourceRedirectURL span5\" type=\"text\" placeholder=\"Resource Redirect URL\" value=\"");___v1ew.push(can.view.txt(1,'input','value',this,function(){ return  resource.attr('resourceRedirectURL') }));___v1ew.push("\" ",can.view.pending(),"/>");___v1ew.push("\n    <a class=\"btn btn-delete\"><i class=\"icon-minus-sign\"></i></a>\n  </li>\n"); }); ;return ___v1ew.join('')}));
; return ___v1ew.join('')}} }));
})(this);