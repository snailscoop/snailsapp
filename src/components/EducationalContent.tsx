import React from 'react';
import { Link } from 'react-router-dom';
import styles from './EducationalContent.module.css';

const EducationalContent = () => {
  return (
    <section className={styles.section}>
      <h2>Educational Content</h2>
      
      <p className={styles.description}>
        SNAILS. rewards its holder to produce educational content about
        the Cosmos Ecosystem.
      </p>

      <div className={styles.grid}>
        <Link to="/getting-started" className={styles.card}>
          <h3>Getting Started</h3>
          <p>Essential guides and tutorials for entering the Cosmos ecosystem.</p>
        </Link>

        <Link to="/exploring-cosmos" className={styles.card}>
          <h3>Exploring the Cosmos</h3>
          <p>Deep dive into the Cosmos ecosystem and discover its potential.</p>
        </Link>

        <Link to="/community-building" className={styles.card}>
          <h3>Community Building</h3>
          <p>Learn how to engage with and grow the Cosmos community.</p>
        </Link>

        <Link to="/blogs" className={styles.card}>
          <h3>Blogs</h3>
          <p>Read and contribute to our growing collection of educational content.</p>
        </Link>
      </div>
    </section>
  );
};

export default EducationalContent; 