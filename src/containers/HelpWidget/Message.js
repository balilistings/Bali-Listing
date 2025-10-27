import React, { useState } from 'react';
import './Message.css';

import { ReactComponent as Logo } from '../../assets/balilistings-logo-icon.svg';
import { ReactComponent as Person1 } from '../../assets/help-widget/person-1.svg';
import { ReactComponent as UserAvatar } from '../../assets/help-widget/usericon.svg';
import { IoIosSend } from 'react-icons/io';
import { IconClose } from '../../components';

const Message = ({ onClose, className }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'admin',
      avatar: Person1,
      name: 'Admin',
      text: 'Hello!\nWhat we can help?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim() === '') return;

    setMessages([
      ...messages,
      {
        sender: 'user',
        avatar: UserAvatar,
        name: 'You',
        text: inputValue,
      },
    ]);
    setInputValue('');
  };

  return (
    <div className={`chat-widget ${className || ''}`}>
      {/* Header */}
      <div className="chat-header">
        <div className="header-left">
          <Logo src={Logo} alt="Logo" className="logo" />

          <div className="text-header">Bali Listings</div>
        </div>
        <span>Support</span>
      </div>

      {/* Body */}
      <div className="chat-body">
        {messages.map((msg, index) => (
          <div key={index} className={`message-container ${msg.sender}`}>
            {msg.sender === 'admin' ? (
              <Person1 className="avatar" />
            ) : (
              <UserAvatar className="avatar" />
            )}
            <div className="message-content">
              <div className="message">
                <span className={msg.sender === 'admin' ? 'username-admin' : 'username'}>
                  {msg.name}
                </span>
                {msg.text.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
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
          />
          <button type="submit" disabled={inputValue.trim() === ''}>
            <IoIosSend className="send" />
          </button>
        </form>
        <button onClick={onClose} className="chat-close-button">
          <IconClose />
        </button>
      </div>
    </div>
  );
};

export default Message;
