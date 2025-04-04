import React from 'react';
import ContentPage from '../components/ContentPage';
import styles from './Blogs.module.css';

const Blogs: React.FC = () => {
  return (
    <div className={styles.container}>
      <ContentPage
        title="Blogs"
        subtitle="Explore our collection of educational articles and insights"
        defaultCategory="Education"
      />
    </div>
  );
};

export default Blogs; 