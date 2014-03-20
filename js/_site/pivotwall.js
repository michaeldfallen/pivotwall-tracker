
window.Pivotwall = {};

(function() {

  var root = this,
      $ = root.jQuery,
      Pivotwall = root.Pivotwall;

  Pivotwall = function() {
    this.onStart();
  };

  Pivotwall.prototype.onStart = function() {
    var pivotalKey = "3f67d754bf101e238add9361f007de37";
    var projectId = "890072";

    $.get(
      "https://www.pivotaltracker.com/services/v5/projects/" + projectId,
      function(data) {
        $('#results').html(data);
      }
    );
  };

  Pivotwall();
});
