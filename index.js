const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const WebSocket = require('ws');
const Review = require('./models/Review');
const dotenv=require("dotenv")
dotenv.config({
  path: './.env'
})
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());

// Connect to MongoDB
//
mongoose.connect(`${process.env.MONGODBURI}/${process.env.DATABASE}`).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error.message);
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// WebSocket server

wss.on('connection', async (ws) => {
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data);
      if (data.type === 'addReview') {
        // Create a new review and save it to the database
        const newReview = new Review(data.review);
        await newReview.save();

        // Send the new review to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'addReview', review: newReview }));
          }
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
});




wss.on('connection', async (ws) => {
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data);
      
      if (data.type === 'updateReview') {
        const { id, title, content } = data.review;
        
        // Find the review by ID and update its title and content
        const updatedReview = await Review.findByIdAndUpdate(
          id,
          { title, content },
          { new: true } // Return the updated review
        );
        
        // Broadcast the updated review to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'updateReview', review: updatedReview }));
          }
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
});




wss.on('connection', async (ws) => {
  try {
    // Fetch reviews from MongoDB
    const reviews = await Review.find();
    ws.send(JSON.stringify(reviews));
  } catch (error) {
    console.error('Error fetching reviews:', error);
  }

  // Optionally, you can listen for messages from the client
  wss.on('message', (message) => {
    console.log('Received message from client:', message);
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});