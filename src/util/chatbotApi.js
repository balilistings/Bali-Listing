import { post } from './api';

const useProxy = process.env.REACT_APP_CHATBOT_PROXY === 'true';

const getChatbotApiUrl = () => {
  const baseUrl =
    process.env.REACT_APP_CHATBOT_API_URL || 'https://mock-chatbot-api.balilisting.com';
  return baseUrl;
};

export const registerClient = () => {
  if (useProxy) {
    return post(
      getChatbotApiUrl(),
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } else {
    return registerClientExternal();
  }
};

export const sendQuery = (sessionId, clientId, query) => {
  if (useProxy) {
    const body = {
      session_id: sessionId,
      client_id: clientId,
      query: query,
    };
    return post(getChatbotApiUrl(), body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } else {
    return sendQueryExternal(sessionId, clientId, query);
  }
};

export const registerClientExternal = async () => {
  try {
    const response = await fetch(`${getChatbotApiUrl()}/client/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      throw new Error('Failed to register client');
    }
    const data = await response.json();
    return data; // { session_id, client_id }
  } catch (error) {
    console.error('Error registering client:', error);
    throw error;
  }
};

export const sendQueryExternal = async (sessionId, clientId, query) => {
  try {
    const response = await fetch(`${getChatbotApiUrl()}/chat/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        client_id: clientId,
        query: query,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to send query');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending query:', error);
    throw error;
  }
};
