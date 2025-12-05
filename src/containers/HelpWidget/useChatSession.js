import { useState, useEffect } from 'react';
import { registerClient } from '../../util/chatbotApi';
import { CHAT_SESSION_KEY, getChatMessagesKey } from './storageKeys';
import appSettings from '../../config/settings';

const EXPIRATION_MINUTES = 15;

export const clearChatHistory = () => {
  const storedSessionData = localStorage.getItem(CHAT_SESSION_KEY);
  if (storedSessionData) {
    try {
      const { sessionData } = JSON.parse(storedSessionData);
      if (sessionData && sessionData.session_id) {
        localStorage.removeItem(getChatMessagesKey(sessionData.session_id));
      }
    } catch (error) {
      console.error('Could not clear chat messages from local storage', error);
    }
  }
  localStorage.removeItem(CHAT_SESSION_KEY);
};

const useChatSession = () => {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const initSession = async () => {
      const storedSessionData = localStorage.getItem(CHAT_SESSION_KEY);
      if (storedSessionData) {
        const { sessionData, timestamp } = JSON.parse(storedSessionData);
        const isExpired = new Date().getTime() > timestamp + EXPIRATION_MINUTES * 60 * 1000;

        if (!isExpired) {
          setSession(sessionData);
          return;
        } else {
          // Session expired, clear its messages
          localStorage.removeItem(getChatMessagesKey(sessionData.session_id));
        }
      }

      // If no session, or it's expired, get a new one
      try {
        const newSessionData = await registerClient();
        const timestamp = new Date().getTime();
        localStorage.setItem(
          CHAT_SESSION_KEY,
          JSON.stringify({ sessionData: newSessionData, timestamp })
        );
        setSession(newSessionData);
      } catch (error) {
        appSettings.dev? console.error(error) : console.error('Could not initialize chat session.');
      }
    };

    initSession();
  }, []); // Run only once

  return session;
};

export default useChatSession;
