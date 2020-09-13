let appPath = "/opt/usr/apps/XIQbjfoxch/data/";

export const readFile = (sensorType) => {
  tizen.filesystem.resolve(appPath, function (dir) {
    let file = dir.resolve(`sensor-data/data-${sensorType}.json`);
    file.openStream(
      "r",
      function (fs) {
        let text = fs.read(file.fileSize);
        fs.close();
        console.log(text);
      },
      function (e) {
        console.log("Error " + e.message);
      },
      "UTF-8"
    );
  });
};
