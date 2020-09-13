let gTransferId = 0;
let progressBar = document.getElementById("file-progress");
let ratio = document.getElementById("file-ratio");

export const toastAlert = (msg) => {
  var toastMsg = document.getElementById("popupToastMsg");
  toastMsg.innerHTML = msg;
  tau.openPopup("#popupToast");
  console.log(msg);
};

export const showMain = (message) => {
  tau.changePage("#main");
  if (message != undefined) {
    toastAlert(message);
  }
  gTransferId = 0;
};

export const ftSuccessCb = {
  onsuccess: function () {
    toastAlert("Succeed to connect");
    // updateContents();
    sendFile("/opt/usr/apps/XIQbjfoxch/data/sensor-data/data.json");
  },
  onsendprogress: function (id, progress) {
    console.log("onprogress id : " + id + " progress : " + progress);
    progressBar.value = progress;
    ratio.innerHTML = progress + "%";
  },
  onsendcomplete: function (id, localPath) {
    progressBar.value = 100;
    ratio.innerHTML = "100%";
    showMain("send Completed!! id : " + id + " localPath :" + localPath);
  },
  onsenderror: function (errCode, id) {
    showMain("Failed to send File. id : " + id + " errorCode :" + errCode);
  },
};

export const clearList = (reconnect) => {
  console.log("clear List");
  $(".ui-listview").empty();
  if (reconnect) {
    $(".ui-listview").append(
      '<li><a href="#" onclick="reconnect();">Connect</a></li>'
    );
  } else {
    $(".ui-listview").append("<li>BT Disconnected. Connection waiting...</li>");
  }
  var snaplistEl = document.getElementsByClassName("ui-snap-listview")[0];
  if (snaplistEl) {
    var snaplistWidget = tau.widget.SnapListview(snaplistEl);
    snaplistWidget.refresh();
  }
};

export const reconnect = () => {
  $(".ui-listview").empty();
  sapFindPeer(
    function () {
      console.log("Succeed to find peer");
      ftInit(ftSuccessCb, function (err) {
        toastAlert("Failed to get File Transfer");
        // clearList(true);
      });
    },
    function (err) {
      toastAlert("Failed to reconnect to service");
      // clearList(true);
    }
  );
};

export const updateContents = () => {
  try {
    tizen.content.find(
      function (contents) {
        $(".ui-listview").empty();
        if (contents.length > 0) {
          for (var i = 0; i < contents.length; i++) {
            console.log(
              "name : " + contents[i].title + " URI : " + contents[i].contentURI
            );
            var nameStr =
              contents[i].title.length > 15
                ? contents[i].title.substring(0, 11) + "..."
                : contents[i].title;
            $(".ui-listview").append(
              "<li><a onclick=\"sendFile('" +
                contents[i].contentURI +
                "');\">" +
                nameStr +
                "</a></li>"
            );
          }
          $(".ui-listview").append(
            '<li><a onclick="updateContents();">Update contents...</a></li>'
          );
        } else {
          $(".ui-listview").append(
            '<li><a onclick="updateContents();">No items. Update contents</a></li>'
          );
        }
        var snaplistEl = document.getElementsByClassName("ui-snap-listview")[0];
        if (snaplistEl) {
          var snaplistWidget = tau.widget.SnapListview(snaplistEl);
          snaplistWidget.refresh();
        }
      },
      function (err) {
        console.log("Failed to find contents");
      }
    );
  } catch (err) {
    console.log("content.find exception <" + err.name + "> : " + err.message);
  }
};

export const initialize = () => {
  var sapinitsuccesscb = {
    onsuccess: function () {
      console.log("Succeed to connect");
      ftInit(ftSuccessCb, function (err) {
        toastAlert("Failed to get File Transfer");
      });
    },
    ondevicestatus: function (status) {
      if (status == "DETACHED") {
        console.log("Detached remote peer device");
        // clearList();
      } else if (status == "ATTACHED") {
        console.log("Attached remote peer device");
        reconnect();
      }
    },
  };

  sapInit(sapinitsuccesscb, function (err) {
    toastAlert("Failed to connect to service");
  });
};

export const cancelFile = () => {
  ftCancel(
    gTransferId,
    function () {
      console.log("Succeed to cancel file");
      showMain();
    },
    function (err) {
      console.log("Failed to cancel File");
      showMain();
    }
  );
};

export const sendFile = (path) => {
  ftSend(
    path,
    function (id) {
      console.log("Succeed to send file");
      gTransferId = id;
      tau.changePage("#sendPage");
      progressBar.value = 0;
      ratio.innerHTML = "0%";
    },
    function (err) {
      showMain("Failed to send File");
    }
  );
};
