
window.Pivotwall = {};

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if(pair[0] == variable){
      return pair[1];
    };
  };
  return(false);
};

(function() {
  "use strict"

  var root = this,
      $ = root.jQuery,
      Pivotwall = root.Pivotwall,
      Project,
      Stories,
      Story,
      Base;


  Base = function() {
    this.$pivotalKey = getQueryVariable("pivotal_key");
  };
  Base.prototype = {
    render: function() {},
    fetch: function() {}
  };


  Project = function(projectId) {
    Base.apply(this, arguments);
    this.$projectId = projectId;
    this.$started;
    this.$finished;
    this.$rejected;
    this.$delivered;
    this.$name;

    this.fetch();
  };
  Project.prototype.render = function() {
    $("#results").html( this.$name );
    if (this.$started !== undefined) {
      this.$started.render();
    };
    if (this.$finished !== undefined) {
      this.$finished.render();
    };
    if (this.$delivered !== undefined) {
      this.$delivered.render();
    };
    if (this.$rejected !== undefined) {
      this.$rejected.render();
    };
  };
  Project.prototype.fetch = function() {
    var _this = this;

    $.ajax({
      url: "https://www.pivotaltracker.com/services/v5/projects/" + _this.$projectId,
      headers: {
        "X-TrackerToken" : _this.$pivotalKey
      },
      success: function(data) {
        _this.$name = data.name;
        _this.$started = new Pivotwall.Stories(_this, "started", $('#started'));
        _this.$finished = new Pivotwall.Stories(_this, "finished", $('#finished'));
        _this.$delivered = new Pivotwall.Stories(_this, "delivered", $('#delivered'));
        _this.$rejected = new Pivotwall.Stories(_this, "rejected", $('#rejected'));
        _this.render();
      }
    });
  };


  Stories = function(project, state, renderTarget) {
    Base.apply(this, arguments);
    this.$project = project;
    this.$storyState = state;
    this.$renderTarget = renderTarget;
    this.$stories;
    this.fetch();
  }
  Stories.prototype.fetch = function() {
    var _this = this;

    $.ajax({
      url: "https://www.pivotaltracker.com/services/v5/projects/" + _this.$project.$projectId + "/stories?with_state=" + _this.$storyState,
      headers: {
        "X-TrackerToken" : _this.$pivotalKey
      },
      success: function(data) {
        _this.$stories = $.map(data, function(item, idx) {
          return new Pivotwall.Story(item);
        });
        _this.$project.render();
      }
    });
  };
  Stories.prototype.render = function() {
    var _this = this;
    if (_this.$stories !== undefined) {
      _this.$renderTarget.html("");
      $.map(_this.$stories, function(item, idx) {
        item.render(_this.$renderTarget);
      });
    };
  };

  Story = function(storyData) {
    this.$data = storyData;
  };
  Story.prototype.render = function(target) {
    target.append("<p>" + this.$data.name + "<p>");
  };
  
  Pivotwall.Project = Project;
  Pivotwall.Story = Story;
  Pivotwall.Stories = Stories;
}.call(this));

(function() {
  var key = getQueryVariable("pivotal_key")
  var id = getQueryVariable("project_id")
  if (key && id) {
    var project = new window.Pivotwall.Project(id);
  }
//  project.onStart();
}.call(this));

