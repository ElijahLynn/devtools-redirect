Devtools Redirect - Google Chrome extension
===============================

Catch and redirect resources loaded from a specific domain to any file hosted on a local or remote server.

Installation
---------------------
You can either install it from the Chrome Webstore https://chrome.google.com/webstore/detail/devtools-redirect/jmhdebkkippcccflcoddckhjjfgnfhnp
**or**
fork it from Github http://github.com/kbouchard/devtools-redirect and load it unpacked.

Demo
---------------------
http://www.youtube.com/watch?v=5J2-9lFaESI

Important
---------------------
- Right now, you can only redirect *.js .css .less* resources.
- You can NOT redirect resources to a local file using the **file:// protocol**. In order to redirect locally, you need to be running a **local server** (e.g Apache) and redirect the file to the right path using it (e.g *http://localhost/my-project/css/style.css*).

Upcoming features
---------------------
- Make the **file://** protocol work.
- Integrate a status check when setting a file in the redirection inputs.

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/53371b8038403906d6d9e528178991f4 "githalytics.com")](http://githalytics.com/kbouchard/boris)
