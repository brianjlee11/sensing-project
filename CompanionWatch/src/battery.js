import "regenerator-runtime/runtime";

export const getBatteryLevel = async () => {
  return new Promise((resolve) => {
    let callback = (batteryInfo) => {
      resolve(batteryInfo.level * 100);
    };
    tizen.systeminfo.getPropertyValue("BATTERY", callback);
  });
};
