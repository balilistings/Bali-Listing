const express = require('express');
const axios = require('axios');

const router = express.Router();

const getChatbotApiUrl = () => {
  return process.env.REACT_APP_CHATBOT_API_URL || 'https://mock-chatbot-api.balilisting.com';
};

router.post('/client/register', async (req, res) => {
  try {
    const response = await axios.post(`${getChatbotApiUrl()}/client/register`, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error registering client:', error);
    res.status(500).json({ error: 'Failed to register client' });
  }
});

router.post('/chat/query', async (req, res) => {
  try {
    const response = await axios.post(`${getChatbotApiUrl()}/chat/query`, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error sending query:', error);
    res.status(500).json({ error: 'Failed to send query' });
  }
});

module.exports = router;
