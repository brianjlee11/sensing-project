import {startSensor, killSensor, sensorList} from "../src/sensors";
import {initialize, cancelFile, toastAlert} from "../src/sap_utils";
import { writeAndRead } from "../src/create_files";

export let sensorLight;
export let sensorPress;
export let sensorAccel;

export const setEventListners = () => {
  let connectButton = document.getElementById("connect");
  let startSensorButton = document.getElementById("startSensor");
  let stopSensorButton = document.getElementById("stopSensor");
  let writeDataButton = document.getElementById("writeData");
  let cancelButton = document.getElementById("cancelButton");
  let nextButton = document.getElementById("toMainPage");
  let lightCheck = document.getElementById("light-check");
  let pressCheck = document.getElementById("press-check");
  let accelCheck = document.getElementById("accel-check");

  connectButton.addEventListener("click", () => {
    initialize();
  });
  startSensorButton.addEventListener("click", () => {
    if (!lightCheck.checked && !pressCheck.checked && !accelCheck.checked) {
      toastAlert("Need to select at least one sensor");
    } else {
      tau.changePage("#manage");
      startSensor();
    }
  });
  stopSensorButton.addEventListener("click", () => {
    killSensor();
  });
  writeDataButton.addEventListener("click", () => {
    writeAndRead();
  });
  cancelButton.addEventListener("click", () => {
    cancelFile();
  });
  lightCheck.addEventListener("click", () => {
    sensorList.light = !sensorList.light;
  });
  pressCheck.addEventListener("click", () => {
    sensorList.pressure = !sensorList.pressure;
  });
  accelCheck.addEventListener("click", () => {
    sensorList.accelerometer = !sensorList.accelerometer;
  });
  nextButton.addEventListener("click", () => {
    if (!lightCheck.checked && !pressCheck.checked && !accelCheck.checked) {
      console.log("its checked");
      toastAlert("Need to select at least one sensor");
    } else {
      console.log("page change");
      tau.changePage("#main");
      if (sensorList.light) {
        console.log("Light sensor set");
        sensorLight = tizen.sensorservice.getDefaultSensor("LIGHT");
      }
      if (sensorList.pressure) {
        console.log("Pressure sensor set");
        sensorPress = tizen.sensorservice.getDefaultSensor("PRESSURE");
      }
      if (sensorList.accelerometer) {
        console.log("Accelerometer sensor set");
        sensorAccel = tizen.sensorservice.getDefaultSensor("ACCELERATION");
      }
    }
  });
};
