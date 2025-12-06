require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port=3000

console.log(process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 