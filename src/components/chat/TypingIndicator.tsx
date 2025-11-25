import React from 'react';
import styles from './TypingIndicator.module.css';

const TypingIndicator: React.FC = () => {
  return (
    <div className={styles.typing}>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  );
};

export default TypingIndicator;
