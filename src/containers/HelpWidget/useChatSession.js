import { useState, useEffect } from 'react';
import { registerClient } from '../../util/chatbotApi';
import { CHAT_SESSION_KEY, getChatMessagesKey } from './storageKeys';

const EXPIRATION_MINUTES = 15;

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
        console.error('Could not initialize chat session.');
      }
    };

    initSession();
  }, []); // Run only once

  return session;
};

export default useChatSession;
