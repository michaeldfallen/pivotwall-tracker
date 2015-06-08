
window.Pivotwall = {};

(function() {
  "use strict"

  var root = this,
      $ = root.jQuery,
      Pivotwall = root.Pivotwall,
      Project,
      Stories,
      Story,
      Users,
      User,
      Base;

  Pivotwall.getQueryVariable = function(variable) {
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

  Pivotwall.hideUsage = function() {
    $('#usage').hide();
    $('#demo').hide();
  };


  Base = function(projectId, pivotalKey) {
    this.$projectId = projectId;
    this.$pivotalKey = pivotalKey;
  };
  Base.prototype = {
    render: function() {},
    fetch: function() {}
  };


  Project = function() {
    Base.apply(this, arguments);
    if (this.$projectId && this.$pivotalKey) {
      Pivotwall.hideUsage();
    };

    this.$renderTarget = '#cards';
    this.$users;
    this.$unstarted;
    this.$started;
    this.$finished;
    this.$rejected;
    this.$delivered;
    this.$name;

    this.schedule();
  };
  Project.prototype.schedule = function() {
    var _this = this;
    var updateInterval = Pivotwall.getQueryVariable('update_interval') || 6;
    var renderInterval = Pivotwall.getQueryVariable('render_interval') || 6;

    _this.fetch();
    _this.render();

    setInterval(function() {
      _this.update()
    }, updateInterval * 1000);
    setInterval(function() {
      _this.render()
    }, renderInterval * 1000);
  };
  Project.prototype.render = function() {
    $("#project-name").html( this.$name );
    $(this.$renderTarget).html("");

    if (this.$rejected !== undefined) {
      this.$rejected.render(this.$users);
    };
    if (this.$delivered !== undefined) {
      this.$delivered.render(this.$users);
    };
    if (this.$finished !== undefined) {
      this.$finished.render(this.$users);
    };
    if (this.$started !== undefined) {
      this.$started.render(this.$users);
    };
    if (this.$unstarted !== undefined) {
      this.$unstarted.render(this.$users);
    };
  };
  Project.prototype.update = function() {
    if (this.$unstarted !== undefined) {
      this.$unstarted.fetch();
    };
    if (this.$rejected !== undefined) {
      this.$rejected.fetch();
    };
    if (this.$delivered !== undefined) {
      this.$delivered.fetch();
    };
    if (this.$finished !== undefined) {
      this.$finished.fetch();
    };
    if (this.$started !== undefined) {
      this.$started.fetch();
    };
    if (this.$users !== undefined) {
      this.$users.fetch();
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
        _this.$unstarted = new Pivotwall.Stories(_this, "planned", _this.$renderTarget);
        _this.$started = new Pivotwall.Stories(_this, "started", _this.$renderTarget);
        _this.$finished = new Pivotwall.Stories(_this, "finished", _this.$renderTarget);
        _this.$delivered = new Pivotwall.Stories(_this, "delivered", _this.$renderTarget);
        _this.$rejected = new Pivotwall.Stories(_this, "rejected", _this.$renderTarget);
        _this.$users = new Pivotwall.Users(_this);
      }
    });
  };


  Stories = function(project, state, renderTarget) {
    Base.apply(this, [project.$projectId, project.$pivotalKey]);
    this.$storyState = state;
    this.$renderTarget = renderTarget;
    this.$stories;
    this.fetch();
  }
  Stories.prototype.fetch = function() {
    var _this = this;

    $.ajax({
      url: "https://www.pivotaltracker.com/services/v5/projects/" +
        _this.$projectId + "/stories?with_state=" + _this.$storyState,
      headers: {
        "X-TrackerToken" : _this.$pivotalKey
      },
      success: function(data) {
        _this.$stories = $.map(data, function(item, idx) {
          return new Pivotwall.Story(item);
        });
      }
    });
  };
  Stories.prototype.render = function(users) {
    var _this = this;
    if (_this.$stories !== undefined) {
      $.map(_this.$stories, function(item, idx) {
        item.render(_this.$renderTarget, users);
      });
    };
  };


  Story = function(storyData) {
    this.$data = storyData;
  };
  Story.prototype.render = function(target, users) {
    $(target).append(this.card(users));
  };
  Story.prototype.card = function(users) {
    var owners;
    if (users !== undefined) {
      owners = $.map(this.$data.owner_ids, function(item, idx) {
        var user = users.get(item);
        if (user) { return user.avatar(); } else { return ""; };
      });
    }

    var classes = this.$data.current_state + " " + this.$data.story_type;
    var newHtml = '' +
      '<div class="card ' + classes + '">' +
        //this.$data.name +
        '<span class="name">' + this.$data.name + '</span>' +
        '<span class="type">' + this.$data.story_type + '</span>' +
        '<span class="state">' + this.$data.current_state + '</span>' +
        '<span class="owners">' + owners.join("") + '</span>' +
      '</div>';
    return newHtml;
  };


  Users = function(project) {
    Base.apply(this, [project.$projectId, project.$pivotalKey]);
    this.$users;
  };
  Users.prototype.fetch = function() {
    var _this = this;

    $.ajax({
      url: "https://www.pivotaltracker.com/services/v5/projects/" +
        _this.$projectId + "/memberships",
      headers: {
        "X-TrackerToken" : _this.$pivotalKey
      },
      success: function(data) {
        _this.$users = $.map(data, function(item, idx) {
          return new Pivotwall.User(item);
        });
      }
    });
  };
  Users.prototype.get = function(id) {
    if (id === undefined || this.$users === undefined) {
      return false;
    };
    var foundUsers = $.grep(this.$users, function(user) {
      return user.$data.person.id == id
    });
    if (foundUsers.length === 0) {
      return false;
    };
    return foundUsers[0];
  };


  User = function(userData) {
    this.$data = userData;
  };
  User.prototype.render = function(target) {
    $(target).append(this.avatar());
  };
  User.prototype.avatar = function() {
    return '<span class"owner">' + this.$data.person.name + '</span>';
  };

  Pivotwall.Project = Project;
  Pivotwall.Story = Story;
  Pivotwall.Stories = Stories;
  Pivotwall.Users = Users;
  Pivotwall.User = User;
}.call(this));

$(document).ready(function() {
  var key = Pivotwall.getQueryVariable("pivotal_key");
  var id = Pivotwall.getQueryVariable("project_id");
  if (key && id) {
    var project = new window.Pivotwall.Project(id, key);
  }
});

