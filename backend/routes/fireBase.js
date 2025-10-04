const firebase = require("firebase-admin");
 
const serviceAccount = require('../../secret.json');

// The Firebase token of the device which will get the notification
// It can be a string or an array of strings


firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://clips-b3441.firebaseio.com"
});

// const payload = {
//   notification: {
//     title: 'Notification Title',
//     body: 'This is an example notification',
//   }
// };

const options = {
  priority: 'high',
  timeToLive: 60 * 60 * 24, // 1 day
};

module.exports = {firebase,options};