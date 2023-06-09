const { admin, db } = require("./admin");
const { getAuth } = require("firebase-admin/auth");

module.exports = async (request, response, next) => {
  // Extract the ID token from the request headers
  let idToken;
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = request.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token found");
    return response.status(403).json({ error: "Unauthorized" });
  }

  // Verify the ID token using the Firebase Admin SDK
  getAuth(admin)
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      // Store the decoded user token in the request object
      request.user = decodedToken;

      // Retrieve user information from the Firestore database
      return db
        .collection("users")
        .where("userId", "==", request.user.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      // Store additional user details in the request object
      request.user.username = data.docs[0].data().username;
      request.user.imageUrl = data.docs[0].data().imageUrl;

      // Call the next middleware function
      return next();
    })
    .catch((err) => {
      console.error("Error while verifying token", err);
      return response.status(403).json(err);
    });
};
