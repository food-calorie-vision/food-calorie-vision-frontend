import React from 'react';
import styles from './ChatBubble.module.css';

interface ChatBubbleProps {
  role: 'user' | 'bot';
  children: React.ReactNode;
  className?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ role, children, className }) => {
  const bubbleClass = role === 'user' ? styles.user : styles.bot;

  return (
    <div className={`${styles.bubble} ${bubbleClass} ${className || ''}`}>
      {children}
    </div>
  );
};

export default ChatBubble;
