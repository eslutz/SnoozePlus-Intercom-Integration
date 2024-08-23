// Get the endpoint URLs location
document.getElementById('init').innerHTML = window.location.href + 'initialize';
document.getElementById('submit').innerHTML = window.location.href + 'submit';

// Install the Messenger
const WORKSPACE_ID = '121095';

window.intercomSettings = {
  app_id: WORKSPACE_ID,
};

(function () {
  var w = window;
  var d = document;
  class i {
    constructor() {
      i.c(arguments);
    }
    static c(args) {
      i.q.push(args);
    }
  }
  i.q = [];
  w.Intercom = i;
  function l() {
    var s = d.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = `https://widget.intercom.io/widget/${intercomSettings.app_id}`;
    var x = d.getElementsByTagName('script')[0];
    x.parentNode.insertBefore(s, x);
  }
  if (w.attachEvent) {
    w.attachEvent('onload', l);
  } else {
    w.addEventListener('load', l, false);
  }
})();
