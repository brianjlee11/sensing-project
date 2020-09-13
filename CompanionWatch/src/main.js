import { deleteDB } from "idb";
import { cancelFile } from "../src/sap_utils";
import { setEventListners } from "../src/listeners";
import { initDB } from "../src/database";

(function () {
  deleteDB("sensorData");
  initDB(); // Initialize DB

  var sendPage = document.getElementById("sendPage");
  sendPage.addEventListener("pagehide", function () {});

  window.addEventListener("tizenhwkey", function (e) {
    /* For the flick down gesture */
    if (e.keyName == "back") {
      var page = document.getElementsByClassName("ui-page-active")[0],
        pageid = page ? page.id : " ";
      if (pageid === "main") {
        /* When a user flicks down, the application exits */
        tizen.application.getCurrentApplication().exit();
      } else {
        cancelFile();
        window.history.back();
      }
    }
  });

  window.addEventListener("load", function (ev) {
    console.log("loaded");
    setEventListners();
  });
})();

(function (tau) {
  var toastPopup = document.getElementById("popupToast");
  toastPopup.addEventListener(
    "popupshow",
    function (ev) {
      setTimeout(function () {
        tau.closePopup();
      }, 1500);
    },
    false
  );
})(window.tau);
