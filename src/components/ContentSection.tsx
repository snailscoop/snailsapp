import React from 'react';
import styles from './ContentSection.module.css';

interface ContentSectionProps {
  title: string;
  description: string;
  link?: string;
}

const ContentSection: React.FC<ContentSectionProps> = ({ title, description, link }) => {
  const content = (
    <div className={styles.section}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );

  if (link) {
    return (
      <a href={link} className={styles.link}>
        {content}
      </a>
    );
  }

  return content;
};

export default ContentSection; 