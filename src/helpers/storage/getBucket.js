var admin = require("firebase-admin");

const serviceAccount = require("../../config/firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let firestoreInstance;
const getAdmin = () => {
  if (!firestoreInstance) {
    firestoreInstance = admin.storage().bucket();
  }
  return firestoreInstance;
};

module.exports = getAdmin;