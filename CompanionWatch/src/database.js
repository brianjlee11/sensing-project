import { openDB, deleteDB } from "idb";
import "regenerator-runtime/runtime";

export let db;

// Initialize the db
export async function initDB() {
  db = await openDB("sensorData", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("light")) {
        db.createObjectStore("light");
        console.log("Create light store");
      }
      if (!db.objectStoreNames.contains("acceleration")) {
        db.createObjectStore("acceleration");
        console.log("Create acceleration store");
      }
      if (!db.objectStoreNames.contains("pressure")) {
        db.createObjectStore("pressure");
        console.log("Create pressure store");
      }
    },
    blocked() {
      console.log("currently blocked by older version of the db");
    },
    blocking() {
      console.log("blocking future version from going out");
    },
  });
}

export const writeLightSensorData = (sensorData) => {
  let timestamp = Date.now();
  db.add("light", sensorData.lightLevel, timestamp);
};

export const writeAccelSensorData = (sensorData) => {
  let timestamp = Date.now();
  let accelData = {
    x: sensorData.x,
    y: sensorData.y,
    z: sensorData.z,
  };
  db.add("acceleration", accelData, timestamp);
};
