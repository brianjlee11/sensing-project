import "regenerator-runtime/runtime";
import {sensorAccel, sensorLight, sensorPress} from "../src/listeners";
import { db } from "../src/database";
import {toastAlert} from "../src/sap_utils";

export let sensorList = {
  light: false,
  pressure: false,
  accelerometer: false,
};

export const startSensor = async () => {
  if (sensorList.light) {
    console.log("Light sensor started");
    sensorLight.setChangeListener(onLightSensorChange, 1000);
    sensorLight.start(onSensorSuccess);
  }
  if (sensorList.pressure) {
    console.log("Pressure sensor started");
    sensorPress.setChangeListener(onPressSensorChange, 1000);
  }
  if (sensorList.accelerometer) {
    console.log("Accelerometer sensor started");
    sensorAccel.setChangeListener(onAccelSensorChange, 1000, 300000);
    sensorAccel.start(onSensorSuccess);
  }
};

export const killSensor = () => {
  if (sensorList.light) {
    console.log("Stopped light sensor");
    sensorLight.stop();
  }
  if (sensorList.pressure) {
    console.log("Stopped pressure sensor");
    sensorPress.stop();
  }
  if (sensorList.accelerometer) {
    console.log("Stopped accel sensor");
    sensorAccel.stop();
  }
  // sensorAccel.stop();
  toastAlert("Stopped Sensors");
};

const onLightSensorChange = (sensorData) => {
  let timestamp = Date.now();
  db.add("light", sensorData.lightLevel, timestamp);
};

const onAccelSensorChange = (sensorData) => {
  let timestamp = Date.now();
  let accelData = {
    x: sensorData.x,
    y: sensorData.y,
    z: sensorData.z,
  };
  db.add("acceleration", accelData, timestamp);
};

const onPressSensorChange = (sensorData) => {
  let timestamp = Date.now();
  db.add("pressure", sensorData.pressure, timestamp);
};

const onSensorSuccess = () => {
  console.log("Sensor started successfully");
};

// Functions to test battery
// sensorLight.start(
// 	function onSensorStart() {
// 		console.log("Light sensor started");
// 		lightInterval = window.setInterval(() => {
// 			sensorLight.getLightSensorData(
// 				writeLightSensorData,
// 				writeError);
// 		}, 30000);
// 	},
// 	function onError(err) {
// 			console.error('Could not start light sensor.',
// 					err.message);
// 	}
// );
// sensorAccel.start(
// 	function onSensorStart() {
// 						console.log("Acceleration sensor started");
// 			accelInterval = window.setInterval(() => {
// 				sensorAccel.getAccelerationSensorData(
// 					writeAccelSensorData,
// 					writeError);
// 			}, 30000);
// 		},
// 		function onError(err) {
// 				console.error('Could not start light sensor.',
// 						err.message);
// 	}
// );
// getBatteryLevel().then((batteryLevel) => {
// 	console.log(batteryLevel);
// });
// window.setTimeout(() => {
// 	getBatteryLevel().then((batteryLevel) => {
// 		console.log(batteryLevel);
// 	});
// 	sensorLight.stop();
// 	sensorAccel.stop();
// 	tizen.power.release("CPU");
// 	window.clearInterval(lightInterval);
// 	window.clearInterval(accelInterval);
// 	// writeAndRead();
// }, MINUTE * 60);
