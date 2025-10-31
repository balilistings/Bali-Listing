import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import './Message.css';

import { sendQuery } from '../../util/chatbotApi';

import { ReactComponent as Logo } from '../../assets/balilistings-logo-icon.svg';
import { ReactComponent as Person1 } from '../../assets/help-widget/person-1.svg';
import { ReactComponent as UserAvatar } from '../../assets/help-widget/usericon.svg';
import { IoIosSend } from 'react-icons/io';
import { IconClose } from '../../components';

const senderDetails = {
  admin: {
    avatar: Person1,
    name: 'Admin',
  },
  user: {
    avatar: UserAvatar,
    name: 'You',
  },
};

// MessageItem component for rendering individual messages
const MessageItem = memo(({ message }) => {
  const { sender, text, results } = message;
  const { avatar: Avatar, name } = senderDetails[sender];
  const [isExpanded, setIsExpanded] = useState(false);

  const hasManyResults = Array.isArray(results) && results.length > 3;
  const visibleResults = hasManyResults && !isExpanded ? results.slice(0, 3) : results;

  return (
    <div className={`message-container ${sender}`} role="listitem">
      <Avatar className="avatar" aria-hidden="true" />
      <div className="message-content">
        <div className="message">
          <p className={sender === 'admin' ? 'username-admin' : 'username'}>
            {name}
          </p>
          {text.split('\n').map((line, i) => (
            <p key={i} className="message-text">
              {line}
              <br />
            </p>
          ))}
        </div>
        {Array.isArray(results) && results.length > 0 && (
          <>
            <div className={`results ${hasManyResults && !isExpanded ? 'results-collapsed' : ''}`}>
              {visibleResults.map((result, index) => (
                <a
                  key={index}
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-link"
                >
                  <div className="result">
                    <div className="result-title">{result.title}</div>
                    <div className="result-description">{result.description}</div>
                    <div className="result-price">{result.price}</div>
                  </div>
                </a>
              ))}
            </div>
            {hasManyResults && !isExpanded && (
              <div className="show-more-container">
                <button onClick={() => setIsExpanded(true)} className="show-more-button">
                  Show more
                </button>
              </div>
            )}
            {hasManyResults && isExpanded && (
              <div className="show-less-container">
                <button onClick={() => setIsExpanded(false)} className="show-less-button">
                  Show less
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

// ChatHeader component
const ChatHeader = memo(() => (
  <div className="chat-header">
    <div className="header-left">
      <Logo src={Logo} alt="Bali Listings Logo" className="logo" />
      <div className="text-header">Bali Listings</div>
    </div>
    <span>Support</span>
  </div>
));

// ChatInput component
const ChatInput = memo(({ inputValue, setInputValue, handleSend, onClose, isSessionActive }) => (
  <div className="chat-footer">
    <form
      onSubmit={e => {
        e.preventDefault();
        handleSend();
      }}
      className="input-wrapper"
    >
      <input
        type="text"
        placeholder="Type here..."
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        autoComplete="off"
        aria-label="Type your message"
      />
      <button 
        type="submit" 
        disabled={inputValue.trim() === '' || !isSessionActive}
        aria-label="Send message"
      >
        <IoIosSend className="send" />
      </button>
    </form>
    <button onClick={onClose} className="chat-close-button" aria-label="Close chat">
      <IconClose />
    </button>
  </div>
));

// Main Message component
import { getChatMessagesKey } from './storageKeys';

// ... (rest of the imports)

// Main Message component
const Message = ({ onClose, className, session }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      const messagesKey = getChatMessagesKey(session.session_id);
      try {
        const savedMessages = localStorage.getItem(messagesKey);
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        } else {
          const initialMessages = [
            {
              sender: 'admin',
              text: 'Hello!\nWhat we can help?',
            },
          ];
          setMessages(initialMessages);
          localStorage.setItem(messagesKey, JSON.stringify(initialMessages));
        }
      } catch (error) {
        console.error('Could not process messages from local storage', error);
        setMessages([
          {
            sender: 'admin',
            text: 'Hello!\nWhat we can help?',
          },
        ]);
      }
    } else {
      setMessages([
        {
          sender: 'admin',
          text: 'Sorry, I am having trouble connecting. Please try again later.',
        },
      ]);
    }
  }, [session]);

  useEffect(() => {
    if (session && messages.length > 0) {
      const messagesKey = getChatMessagesKey(session.session_id);
      localStorage.setItem(messagesKey, JSON.stringify(messages));
    }
  }, [messages, session]);

  const chatBodyRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (inputValue.trim() === '' || isLoading) return;

    const userMessage = {
      sender: 'user',
      text: inputValue,
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    const currentInputValue = inputValue;
    setInputValue('');
    setIsLoading(true);

    if (session) {
      try {
        const botResponse = await sendQuery(session.session_id, session.client_id, currentInputValue);
        const messageText = botResponse.needs_clarification
          ? botResponse.clarification_question
          : botResponse.ai_message;
        const adminMessage = {
          sender: 'admin',
          text: messageText,
          results: botResponse.results || [],
        };
        setMessages(prev => [...prev, adminMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = {
          sender: 'admin',
          text: 'Sorry, something went wrong. Please try again.',
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, session]);

  return (
    <div className={`chat-widget ${className || ''}`} role="dialog" aria-labelledby="chat-header">
      <ChatHeader />
      
      <div ref={chatBodyRef} className="chat-body" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.map((msg, index) => (
          <MessageItem key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="message-container admin">
            <Person1 className="avatar" aria-hidden="true" />
            <div className="message-content">
              <div className="message typing-indicator">
                <span className="username-admin">Admin</span>
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSend={handleSend}
        onClose={onClose}
        isSessionActive={!!session}
      />
    </div>
  );
};

export default Message;
