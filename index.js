// server
const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const mqtt = require("mqtt");
const hostMQTT = "test.mosquitto.org";
const portMQTT = "1883";
const axios = require("axios");
// firebase
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getDatabase } = require("firebase-admin/database");
// port
dotenv.config();
const port = process.env.PORT || 3000;

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "insect-catch-electric",
    clientEmail:
      "firebase-adminsdk-ado4b@insect-catch-electric.iam.gserviceaccount.com",
    privateKey:
      "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDJf4hvNsJBgO+L\nTDqe9hK4lut+8UE78f1XREau6Ewl+yql1SgMUOup+5UOuuGILxhuurwphB+jj+Hd\n+SyTGDVOrCpu6Qauhxa+zgXpfjAi++jbdqvsZ8UbvH+zFwW6Ml2Zvt6BhXPaVgy7\nBzPPWzqh0CPIRuIKDM49SOQO/Abi7hIZd0eC4TldjORHPTgaG4/3wgg2Vzy8DpSt\nGTusOoA7DnK26V7RXyful5HSgeEGrw/9nN//b+ADr6jM6xw9tSvjcYBrWKL7Twxu\nliEWn8MswNu/ay+rmRv7hGUUGdLJJugvkx/6nRiIDAcuIyLU3eenzKzGKch4xfwH\nvC9pVKLXAgMBAAECggEAC7HvELCd8vO+QFiEgoHUl/AluDCqhGv8NBqoLsvlN4/t\n0fUFDD0m7UiT4AH9+xiFeeloTtFc8/JZV4SrdXIo2rZPB2O92b1isMczPD69u01I\nHtmZcVdoiL6WrtjxCFvKAPvW3RYKbl68m58qy6gHR1yis9buLn6/YOE5+c149nMx\nvLtSIGsbpJc/Z8z5YyzBOCoT8aDAgpRiZNPlzsGvm3Chsv5ErcuDcpKo3JqRV7ST\nBaJf2Dmm5Z7dXgQytgK5LbtdT3W/rtWgkfvgoPRz9ZUNgnYNnjX+3EmoyChUjjEZ\nSX59Qy7yV2ShjxtMb5uE/EfrtKie1n2/NAyGdZnaOQKBgQDwm/eakuHjGaaUzoRn\nCuV/DupRmpaAYnMR+oP3+X+cPG4PdG5XhrJecVKIGfQdO5drCxNUu4xo7eOglw1f\nElugK5pQ6/jie86ZNKyC9T7GMV0KfKy6YeDRVvzqTvkkB07Td8n44ojvKmzzqiT8\n6bt3v2ZyXqwRxJzHWSphi+FsWwKBgQDWYxzfof46ptOBupIbGBXbKxZZk+K6G1WI\nWZ5HyVLOHQDttbqtUb35EL8DHwLRi3VAaZRqIEsPb8EW+Ie/F/OIDaBb9HzKHBqi\n+3sYToFn/Qf/whSH7RJ/R6+c/40LFgwuHipyNe7T9vLbG6UuDgbDbbBT2+L37KsC\nhBSXAZHcNQKBgGzwoT4qbP4vOf48NzSUeW566VsDXEtKyAEG5UOcgsvRjJ+QvvkA\nMriSJKUc4yttNNSxkhIWTK+hriOi4Nn/7N5rf5ZOEUUye0tgzw8ITWDdLtw1sNs+\nv9ToxuCr2yAV8vnKTfdTUl6/Xc9BZTfh+BBy58a22L++vqF/3LGH7QvrAoGANbhk\nNc17zOqcuTctAUkJwP+M/ClIeOX8iswaE1bpPuiZoPcWrfN7rPt7Qab1p9hQKzHJ\nlMY+yMFyGvVv3nx7862mbyRWWLauHgTyFWcmmg4XgQj66AyJxAcMhESs7Qg7SRsZ\n+8Bz9f09YZYNz/qHy1SjCIBi4UkWmOzL1AL6r7kCgYBe1r33+kQuv3t+97sXnLjn\nJMsFRPQQ3RZpgbcX4ZdNvAGhxY9rc/z0EM6ETerEAXSXax1UDLRTEmLO58rTXWPl\niv1adYYdrANwpcKVIkmCk4PxE62tbciofqDgJoQyRFsMWLTrf201BgdL5yVjtqJI\nF1x2ukkIZvZXYpfLKa//WQ==\n-----END PRIVATE KEY-----\n",
  }),
  databaseURL:
    "https://insect-catch-electric-default-rtdb.asia-southeast1.firebasedatabase.app",
});
// admin.initializeApp({
//   credential: admin.credential.cert({
//     projectId: process.env.FIREBASE_PROJECT_ID,
//     privateKey: process.env.FIREBASE_PRIVATE_KEY,
//     clientEmail: process.env.FIREBASE_CLIENT_EMAIL
//   }),
//   databaseURL:
//     "https://insect-catch-electric-default-rtdb.asia-southeast1.firebasedatabase.app",
// });
const mqttUrl = `mqtt://${hostMQTT}:${portMQTT}`;
const clientMQTT = mqtt.connect(mqttUrl, {
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
});
const fireStoreDB = getFirestore();
const realTimeDb = getDatabase();
var jsonParser = bodyParser.json();

app.use(cors());
app.use(jsonParser);

clientMQTT.on("connect", () => {
  console.log("connect MQTT");
  clientMQTT.subscribe("/postDataDevice", () => {
    console.log("subscribe to topic /postDataDevice");
  });
});

clientMQTT.on("message", (topic, payload) => {
  if (topic === "/postDataDevice") {
    const dataDevice = JSON.parse(payload);
    updateFriebaseDataDevice(dataDevice);
  }
});
const updateFriebaseDataDevice = async (json) => {
  try {
    const idDevice = json.id;
    const dataUpdate = json.data;
    // console.log(idDevice, dataUpdate);

    const fireStoteRef = fireStoreDB.collection("device").doc(idDevice);
    const realTimeRef = realTimeDb.ref(`device/${idDevice}`);
    if (
      dataUpdate.hasOwnProperty("temp") &&
      dataUpdate.hasOwnProperty("humi") &&
      dataUpdate.hasOwnProperty("optic") &&
      dataUpdate.hasOwnProperty("coordinates")
    ) {
      if (
        dataUpdate.temp === 0 ||
        dataUpdate.humi === 0 ||
        dataUpdate.optic === 0 ||
        dataUpdate.coordinates.latitude === 0 ||
        dataUpdate.coordinates.longitude === 0
      ) {
        console.log("exit");
        return;
      }
      console.log("firestore");
      const coordinates = dataUpdate.coordinates;
      const reverseGeocode = await axios({
        url: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coordinates.latitude}&lon=${coordinates.longitude}`,
        method: "get",
      });
      const location = reverseGeocode.data.display_name;
      const updateReq = await fireStoteRef.update({
        oldData: FieldValue.arrayUnion({
          temp: dataUpdate.temp,
          humi: dataUpdate.humi,
          optic: dataUpdate.optic,
          location: location,
          coordinates: coordinates,
          time: new Date(),
        }),
      });

      realTimeRef.update({
        timeUpdate: getTime(),
        location: location,
        ...dataUpdate,
        status: true,
      });
    } else {
      realTimeRef.update({
        timeUpdate: getTime(),
        ...dataUpdate,
        status: true,
      });
    }
  } catch (error) {
    console.log(error);
  }
};
app.post("/updateDeviceData", jsonParser, async (req, res) => {
  try {
    {
      updateFriebaseDataDevice(req.body);
      res.send({ alert: "updated!" });
    }
  } catch (error) {
    console.log(error);
  }
});
app.post("/updateDeviceImg", jsonParser, async (req, res) => {
  try {
    {
      const idDevice = req.body.id;
      const imgUpdate = req.body.data.img;

      const realTimeRef = realTimeDb.ref(`device/${idDevice}`);
      realTimeRef.update({ imgUrl: imgUpdate, status: true });

      res.send(realTimeRef);
    }
  } catch (error) {
    console.log(error);
  }
});
app.get("/getNewImg", async (req, res) => {
  try {
    const deviceID = req.query.deviceID;
    const realTimeRef = realTimeDb.ref(`device/${deviceID}`);
    realTimeRef.update({ status: false });
    clientMQTT.publish(
      `/${deviceID}`,

      JSON.stringify({
        command: "sendNewImg",
        data: {},
      }),
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
});
app.get("/getNewDeviceData", async (req, res) => {
  try {
    const deviceID = req.query.deviceID;
    const realTimeRef = realTimeDb.ref(`device/${deviceID}`);
    realTimeRef.update({ status: false });
    clientMQTT.publish(
      `/${deviceID}`,
      JSON.stringify({
        command: "sendNewDeviceData",
        data: {},
      }),
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
    res.send("send to device");
  } catch (error) {
    console.log(error);
  }
});
app.post("/userUpdateDeviceData", jsonParser, async (req, res) => {
  try {
    const deviceID = req.body.deviceID;
    const ledColor = req.body.ledColor;
    const brightness = req.body.brightness;
    const timeSend = req.body.timeSend;
    const timeStart = req.body.timeStart;
    const timeEnd = req.body.timeEnd;

    console.log(
      deviceID,
      ":",
      ledColor,
      brightness,
      timeSend,
      timeStart,
      timeEnd
    );

    const realTimeRef = realTimeDb.ref(`device/${deviceID}`);
    realTimeRef.update({
      ledColor: ledColor,
      brightness: brightness,
      timeSend: timeSend,
      timeStart: timeStart,
      timeEnd: timeEnd,
    });

    clientMQTT.publish(
      `/${deviceID}`,
      JSON.stringify({
        command: "updateDeviceData",
        data: {
          ledColor: ledColor,
          brightness: brightness,
          timeSend: timeSend,
          timeStart: timeStart,
          timeEnd: timeEnd,
        },
      }),
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
    res.send(realTimeRef);
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const getTime = () => {
  let a = new Date().toString().split(/\s/);
  return (
    a[2] +
    "/" +
    {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    }[a[1]] +
    "/" +
    a[3] +
    " " +
    a[4]
  );
  return a;
};
