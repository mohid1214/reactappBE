const express = require('express');
const SessionSecret = "This is the session secret and we intend to keep it save_veryvery safe 99999999999";
const session = require('express-session');
const cors = require('cors'); // Import CORS
const app = express();
const PORT = 3000; // Define PORT properly
const mongoose = require('mongoose');
const JWT_SECRET = "THis is my very own json web token which is very very special, plase stay from it";
const jwt = require('jsonwebtoken');

app.use(cors({
      origin: 'http://localhost:3001', // Your frontend URL
      credentials: true // Allow credentials to be sent
}));
app.use(express.json());
const Mongo_URI = "mongodb+srv://muhammad:123@cluster0.qm1lj.mongodb.net/testdb"

mongoose.connect(Mongo_URI)
      .then(() => console.log("Connedted to testdb"))
      .catch((error) => console.log("Error conneccting to db" + error))

const userSchema = mongoose.Schema({
      name: String,
      email: String,
      password: String
})

const User = mongoose.model('User', userSchema);

app.use(session({
      secret: SessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
            maxAge: 6000000,
            secure: false,
            httpOnly: true
      }
}))

const VerifyToken = (req, res, next) => {
      const token = req.headers['authorization'];
      if (!token) {
            return res.status(403).json({ message: "Token is required" });
      }

      try {
            const decode = jwt.verify(token, JWT_SECRET);
            req.User = decode;
            next();
      } catch (e) {
            console.log(e);
      }
}


const verifysession = (req, res, next) => {
      if (req.session.visited === true) {
            next();
      } else {
            res.status(401).json({ message: "Unauthorised access" });
      }
}

app.post('/user/saveuser', async (req, res) => {
      const { name, email, password } = req.body;

      try {
            const existingUser = await User.findOne({ email: email })

            if (existingUser) {
                  console.log("User already exists");
                  return res.status(409).json({ message: "User already exists" });
            }

            const newUser = new User({ name, email, password })
            await newUser.save();
            res.json({ message: "data saved successfully", data: newUser });

      } catch (e) {
            console.log(e + "  I am the error here");
      }

});

app.post('/user/validate', async (req, res) => {
      const { email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (!existingUser) {
            return res.status(401).json({ message: "User not found" });
      }

      if (existingUser.password !== password) {
            return res.status(401).json({ message: "Invalid password" });
      }


      req.session.visited = true; 

      if (password === existingUser.password) {

            const token = jwt.sign({ email: existingUser.email }, JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).json({ message: "User credentials valid", token });
      }

})

app.post('/user/getpassword', async (req, res) => {
      console.log(req.session);
      const { email } = req.body;
      try {
            const foundUser = await User.findOne({ email });
            console.log(foundUser.password)
            res.status(200).json({ message: "Sending Password", data: foundUser.password });
      } catch (e) {
            console.log(e);
      }

})

app.get('/user/dashbaord', VerifyToken, (req, res) => {
      res.status(200).json({ message: "Token verified successfully" });
});





app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
});
