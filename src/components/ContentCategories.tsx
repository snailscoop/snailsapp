import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ContentCategories.module.css';

const ContentCategories: React.FC = () => {
  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2>EDUCATIONAL CONTENT</h2>
          <p>SNAILS. rewards its holder to produce educational content about the Cosmos Ecosystem.</p>
        </div>
        <div className={styles.container}>
          <Link to="/getting-started" className={styles.category}>
            <h3>Getting Started</h3>
            <p>Essential guides and tutorials for entering the Cosmos ecosystem.</p>
          </Link>
          <Link to="/exploring-cosmos" className={styles.category}>
            <h3>Exploring the Cosmos</h3>
            <p>Deep dive into the Cosmos ecosystem and discover its potential.</p>
          </Link>
          <Link to="/community-building" className={styles.category}>
            <h3>Community Building</h3>
            <p>Learn how to engage with and grow the Cosmos community.</p>
          </Link>
          <Link to="/blogs" className={styles.category}>
            <h3>Blogs</h3>
            <p>Read and contribute to our growing collection of educational content.</p>
          </Link>
        </div>
      </div>

      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2>CO-OP</h2>
          <p>Join our creator Co-Op and collaborate with other content creators in the Cosmos ecosystem.</p>
        </div>
        <div className={styles.container}>
          <Link to="/coop" className={styles.category}>
            <h3>SNAILS. CO-OP</h3>
            <p>Join our creator cooperative and contribute to the Cosmos ecosystem's growth through educational content.</p>
          </Link>
          <Link to="/publishing" className={styles.category}>
            <h3>PUBLISHING GROUP</h3>
            <p>Collaborate with other creators and publish high-quality content for the Cosmos community.</p>
          </Link>
        </div>
      </div>

      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2>TRADE</h2>
          <p>Trade and collect SNAILS. NFTs on the Stargaze marketplace.</p>
        </div>
        <div className={styles.container}>
          <a href="https://www.stargaze.zone/m/snailscoop/tokens" target="_blank" rel="noopener noreferrer" className={styles.category}>
            <h3>SECONDARY MARKET</h3>
            <p>Trade SNAILS. NFTs on the secondary market through Stargaze.</p>
          </a>
          <a href="https://www.stargaze.zone/l/snailssong" target="_blank" rel="noopener noreferrer" className={styles.category}>
            <h3>THEME SONG</h3>
            <p>Collect the official SNAILS. theme song NFT on Stargaze.</p>
          </a>
          <a href="https://www.stargaze.zone/l/snailssong" target="_blank" rel="noopener noreferrer" className={styles.category}>
            <h3>CHRISTMAS OEM</h3>
            <p>Get the special SNAILS. Christmas OEM collection on Stargaze.</p>
          </a>
        </div>
      </div>
    </>
  );
};

export default ContentCategories; 