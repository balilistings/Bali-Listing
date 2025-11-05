import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import './Message.css';
import { getChatMessagesKey, getListingDataKey } from './storageKeys';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { types as sdkTypes } from '../../util/sdkLoader';
import { createResourceLocatorString } from '../../util/routes';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { getSearchPageResourceLocatorStringParams } from '../SearchPage/SearchPage.shared';

import { sendQuery } from '../../util/chatbotApi';

import { ReactComponent as Logo } from '../../assets/balilistings-logo-icon.svg';
import { ReactComponent as Person1 } from '../../assets/help-widget/person-1.svg';
import { ReactComponent as UserAvatar } from '../../assets/help-widget/usericon.svg';
import { IoIosSend } from 'react-icons/io';
import { IconClose } from '../../components';
import IconCollection from '../../components/IconCollection/IconCollection';
import { formatPriceInMillions } from '../../components/ListingCard/ListingCard';
import { Link } from 'react-router-dom';

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

const getPrice = (attributes, rate) => {
  const isRentals = attributes.publicData.categoryLevel1 === 'rentalvillas';
  const publicData = attributes.publicData;

  const price =
    (isRentals
      ? publicData.yearprice || publicData.monthprice || publicData.weekprice
      : attributes.price.amount / 100) * rate;

  const suffix = isRentals
    ? publicData.yearprice
      ? '/year'
      : publicData.monthprice
      ? '/month'
      : '/week'
    : '';
  return formatPriceInMillions(price) + suffix;
};

// ResultItem component for rendering individual result links
const ResultItem = ({ result }) => {
  const USDConversionRate = useSelector(state => state.currency.conversionRate?.USD);
  const selectedCurrency = useSelector(state => state.currency.selectedCurrency);
  const needPriceConversion = selectedCurrency === 'USD';

  // Extract listing ID once
  const listingId = result.link.split('/l/').pop();
  const storageKey = getListingDataKey(listingId);

  const [listingData, setListingData] = useState(() => {
    // Initialize state from sessionStorage
    try {
      const cachedData = sessionStorage.getItem(storageKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (error) {
      console.error('Could not load listing data from sessionStorage', error);
    }
    return null;
  });

  useEffect(() => {
    const sdk = window.app.sdk;
    if (!sdk || listingData) return; // Skip if SDK not available or we already have data

    // Only fetch from SDK if we don't have cached data
    const show = sdk.listings.show({
      id: new sdkTypes.UUID(listingId),
      include: ['author', 'author.profileImage', 'images'],
      'fields.listing': ['title', 'price', 'publicData'],
      'fields.image': ['variants.scaled-small'],
    });
    show.then(res => {
      setListingData(res.data);
      // Save to sessionStorage for future use
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(res.data));
      } catch (error) {
        console.error('Could not save listing data to sessionStorage', error);
      }
    });
  }, [listingId, storageKey, listingData]);

  // Get thumbnail image from first included image
  const thumbnailUrl = listingData?.included?.find(item => item.type === 'image')?.attributes
    ?.variants?.['scaled-small']?.url;

  // Get lister name from included user data
  const listerName = listingData?.included?.find(item => item.type === 'user')?.attributes?.profile
    ?.displayName;

  const priceToDisplay = listingData?.data.attributes
    ? getPrice(listingData.data?.attributes, needPriceConversion ? USDConversionRate : 1)
    : result.price;

  return (
    <a href={result.link} target="_blank" rel="noopener noreferrer" className="result-link">
      <div className="result">
        <div className="result-header">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={listerName || 'Listing image'}
              className="result-thumbnail"
            />
          ) : (
            <div className="result-thumbnail placeholder">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z"
                  fill="white"
                  opacity="0.5"
                />
              </svg>
            </div>
          )}
          <div className="result-meta">
            <div className="result-title">{result.title}</div>
            {listerName && (
              <div className="result-lister">
                {listerName}
                <IconCollection name="icon_profile_badge" />
              </div>
            )}
          </div>
        </div>
        <div className="result-description">{result.description}</div>
        {listingData?.data.attributes && (
          <div className="result-price">
            {needPriceConversion ? 'USD' : 'Rp'} {priceToDisplay}
          </div>
        )}
      </div>
    </a>
  );
};

// MessageItem component for rendering individual messages
const MessageItem = memo(({ message }) => {
  const { sender, text, results, filterUrl } = message;
  const { avatar: Avatar, name } = senderDetails[sender];
  const [isExpanded, setIsExpanded] = useState(false);

  const hasManyResults = Array.isArray(results) && results.length > 3;
  const visibleResults = hasManyResults && !isExpanded ? results.slice(0, 3) : results;

  const searchPageLink = filterUrl && <Link to={'/' + filterUrl} className="search-page-link">Go to search list</Link>

  return (
    <div className={`message-container ${sender}`} role="listitem">
      <Avatar className="avatar" aria-hidden="true" />
      <div className="message-content">
        <div className="message">
          <p className={sender === 'admin' ? 'username-admin' : 'username'}>{name}</p>
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
                <ResultItem key={index} result={result} />
              ))}
              {searchPageLink}
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
                {searchPageLink}
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
        const botResponse = await sendQuery(
          session.session_id,
          session.client_id,
          currentInputValue
        );
        const messageText = botResponse.needs_clarification
          ? botResponse.clarification_question
          : botResponse.ai_message;

        const { filter_url } = botResponse;
        const adminMessage = {
          sender: 'admin',
          text: messageText,
          results: botResponse.results || [],
          filterUrl: filter_url,
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

      <div
        ref={chatBodyRef}
        className="chat-body"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
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
