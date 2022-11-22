const {initializeApp } = require("firebase/app")
require("firebase/firestore")



// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7MabbKYpWBJI0W3mpp4TEUsWPVLfbhuM",
  authDomain: "testo1-1c272.firebaseapp.com",
  databaseURL: "https://testo1-1c272.firebaseio.com",
  projectId: "testo1-1c272",
  storageBucket: "testo1-1c272.appspot.com",
  messagingSenderId: "484995004222",
  appId: "1:484995004222:web:55e230e088bd78acfd5e6f",
  measurementId: "G-CVL0VT5Z0X"
};
  const fb = initializeApp(firebaseConfig);
 

 const db = fb.firestore(); // objeto db

  module.exports = {
    db
}
