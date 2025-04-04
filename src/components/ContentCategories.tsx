import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './ContentCategories.module.css';

const ContentCategories: React.FC = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.section}>
        <h2>EDUCATIONAL CONTENT</h2>
        <div className={styles.container}>
          <div 
            className={styles.category}
            onClick={() => handleCategoryClick('/getting-started')}
            role="link"
            tabIndex={0}
          >
            <h3>Getting Started</h3>
            <p>Essential guides and tutorials for entering the Cosmos ecosystem.</p>
          </div>
          <div 
            className={styles.category}
            onClick={() => handleCategoryClick('/exploring-cosmos')}
            role="link"
            tabIndex={0}
          >
            <h3>Exploring the Cosmos</h3>
            <p>Deep dive into the Cosmos ecosystem and discover its potential.</p>
          </div>
          <div 
            className={styles.category}
            onClick={() => handleCategoryClick('/community-building')}
            role="link"
            tabIndex={0}
          >
            <h3>Community Building</h3>
            <p>Learn how to engage with and grow the Cosmos community.</p>
          </div>
          <div 
            className={styles.category}
            onClick={() => handleCategoryClick('/blogs')}
            role="link"
            tabIndex={0}
          >
            <h3>Blogs</h3>
            <p>Read and contribute to our growing collection of educational content.</p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2>CO-OP</h2>
        <div className={styles.container}>
          <Link to="/coop" className={styles.category}>
            <h3>SNAILS. Co-op</h3>
            <p>Join our cooperative community and contribute to the ecosystem.</p>
          </Link>
          <Link to="/publishing" className={styles.category}>
            <h3>Publishing Group</h3>
            <p>Be part of our content creation and publishing team.</p>
          </Link>
        </div>
      </div>

      <div className={styles.section}>
        <h2>TRADE</h2>
        <div className={styles.container}>
          <a href="https://www.stargaze.zone/m/snailscoop/tokens" target="_blank" rel="noopener noreferrer" className={styles.category}>
            <h3>Secondary Market</h3>
            <p>Trade SNAILS NFTs on the Stargaze marketplace.</p>
          </a>
          <a href="https://www.stargaze.zone/l/snailssong" target="_blank" rel="noopener noreferrer" className={styles.category}>
            <h3>Theme Song</h3>
            <p>Get the official SNAILS theme song NFT.</p>
          </a>
          <a href="https://www.stargaze.zone/l/snailssong" target="_blank" rel="noopener noreferrer" className={styles.category}>
            <h3>Christmas OEM</h3>
            <p>Collect the special Christmas edition NFT.</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContentCategories; 