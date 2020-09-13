import { readFile } from "../src/read_files";
import { sensorList } from "../src/sensors"
import { db } from "../src/database";
import "regenerator-runtime/runtime";

let appPath = "/opt/usr/apps/XIQbjfoxch/data/";

export const writeAndRead = () => {
  tizen.filesystem.resolve(
    appPath,
    (dir) => {
      let sensorData;
      try {
        console.log("got directory");
        sensorData = dir.resolve("sensor-data");
      } catch (e) {
        console.log("created new directory");
        sensorData = dir.createDirectory("sensor-data");
      }
      let lightfile;
      if (sensorList.light) {
        try {
          console.log("got file");
          lightfile = sensorData.resolve("data-light.json");
        } catch (e) {
          console.log("create new file");
          lightfile = sensorData.createFile("data-light.json");
        }
        lightfile.openStream(
          "w",
          writeToLightFile,
          function (e) {
            console.log("Error " + e.message);
          },
          "UTF-8"
        );
      }
      let pressfile;
      if (sensorList.pressure) {
        try {
          console.log("got file");
          pressfile = sensorData.resolve("data-press.json");
        } catch (e) {
          console.log("create new file");
          pressfile = sensorData.createFile("data-press.json");
        }
        pressfile.openStream(
          "w",
          writeToPressureFile,
          function (e) {
            console.log("Error " + e.message);
          },
          "UTF-8"
        );
      }
      let accelfile;
      if (sensorList.accelerometer) {
        try {
          console.log("got file");
          accelfile = sensorData.resolve("data-accel.json");
        } catch (e) {
          console.log("create new file");
          accelfile = sensorData.createFile("data-accel.json");
        }
        accelfile.openStream(
          "w",
          writeToAccelerationFile,
          function (e) {
            console.log("Error " + e.message);
          },
          "UTF-8"
        );
      }
    },
    (e) => {
      console.log(e);
    },
    "rw"
  );
};

const writeToLightFile = async (fs) => {
  let cursor = await db.transaction("light").store.openCursor();
  fs.write("[\n");
  while (cursor) {
    fs.write(`\t{"${cursor.key}" : ${cursor.value}}`);
    cursor = await cursor.continue();
    if (cursor) {
      fs.write(",\n");
    } else {
      fs.write("\n");
    }
  }
  fs.write("]");
  fs.close();
  readFile("light");
};

const writeToPressureFile = async (fs) => {
  let cursor = await db.transaction("pressure").store.openCursor();
  fs.write("[\n");
  while (cursor) {
    fs.write(`\t{"${cursor.key}" : ${cursor.value}}`);
    cursor = await cursor.continue();
    if (cursor) {
      fs.write(",\n");
    } else {
      fs.write("\n");
    }
  }
  fs.write("]");
  fs.close();
  readFile("press");
};

const writeToAccelerationFile = async (fs) => {
  let cursor = await db.transaction("acceleration").store.openCursor();
  fs.write("[\n");
  while (cursor) {
    fs.write(`\t{"${cursor.key}" : {\n`);
    fs.write(`\t\t\t"x":${cursor.value.x},\n`);
    fs.write(`\t\t\t"y":${cursor.value.y},\n`);
    fs.write(`\t\t\t"z":${cursor.value.z}\n`);
    fs.write(`\t\t}\n`);
    fs.write(`\t}`);
    cursor = await cursor.continue();
    if (cursor) {
      fs.write(",\n");
    } else {
      fs.write("\n");
    }
  }
  fs.write("]");
  fs.close();
  readFile("accel");
};
