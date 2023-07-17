const express = require('express');
const cors = require('cors'); // Import the cors module
const bodyParser = require('body-parser');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const app = express();
const corsOptions = {
  origin: '*',
  credentials: true, // Add this line
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

// Add a POST route for user sign-in
app.post('/signin', (req, res) => {
  const { email, password } = req.body;

  // Read user data from the JSON file
  let data = [];
  try {
    const jsonData = fs.readFileSync('users.json', 'utf8');
    data = JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading users.json:', error);
  }

  // Check if the user with the given email exists
  const user = data.find((user) => user.email === email);

  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  // Create a JWT token
  jwt.sign(
    {
      user,
    },
    process.env.MY_SECRET_TOKEN,
    {},
    (err, token) => {
      if (err) throw err;
      // Set the cookie
      res.cookie('jwt', token, {
        httpOnly: true, // Ensure the cookie is only accessible via HTTP(S)
        secure: true, // Only send the cookie over HTTPS in production
      }).json({ user, token });
    }
  );
});

app.post('/signup', (req, res) => {
  const { name, email, collegeID, password, dob } = req.body;

  // Create a new user object
  const newUser = {
    name,
    email,
    collegeID,
    password,
    dob,
  };

  // Read existing data from the JSON file
  let data = [];
  try {
    const jsonData = fs.readFileSync('users.json', 'utf8');
    data = JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading users.json:', error);
  }

  // Add the new user to the existing data
  data.push(newUser);

  // Write the updated data back to the JSON file
  try {
    fs.writeFileSync('users.json', JSON.stringify(data));
  } catch (error) {
    console.error('Error writing users.json:', error);
  }

  res.json({ message: 'Signup successful' });
});

// Add a route to get user data from the token
app.get('/user', (req, res) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify the token
  jwt.verify(token, 'secret',{ expiresIn: '1h' }, (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the user data from the token
    const user = decodedToken.user;

    res.json(user);
  });
});
app.post('/signout', (req, res) => {
  // Clear the JWT token from the client-side by setting an expired cookie
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: true, // Only send the cookie over HTTPS in production
  }).json({ message: 'Signout successful' });
});

const port = 4000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
