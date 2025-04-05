import React from 'react';
import { useStargazeVideos } from '../hooks/useStargazeVideos';
import VideoComponent from '../components/VideoComponent';
import Hero from '../components/Hero';
import ContentSection from '../components/ContentSection';
import styles from './GettingStarted.module.css';

const GettingStarted: React.FC = () => {
  const { videos, loading, error } = useStargazeVideos();

  return (
    <div className={styles.container}>
      <Hero 
        title="EDUCATIONAL CONTENT"
        subtitle="Learn, Build, and Grow with Snails"
        backgroundVideo="/videos/background.mp4"
      />

      <div className={styles.content}>
        <div className={styles.sections}>
          <ContentSection
            title="Getting Started"
            description="Essential guides and tutorials for entering the Cosmos ecosystem."
            link="/getting-started"
          />
          
          <ContentSection
            title="Exploring the Cosmos"
            description="Deep dive into the Cosmos ecosystem and discover its potential."
            link="/exploring-cosmos"
          />
          
          <ContentSection
            title="Community Building"
            description="Learn how to engage with and grow the Cosmos community."
            link="/community"
          />
          
          <ContentSection
            title="Blogs"
            description="Read and contribute to our growing collection of educational content."
            link="/blogs"
          />
        </div>

        <div className={styles.videoSection}>
          <h2>Featured Videos</h2>
          {loading ? (
            <div className={styles.loading}>Loading videos...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : (
            <div className={styles.videoList}>
              {videos.map((video) => (
                <VideoComponent
                  key={video.id}
                  tokenId={video.id}
                  ipfsLink={video.videoUrl || '/videos/background.mp4'}
                  title={video.title}
                  description={video.description}
                  creator={video.creator}
                  music={video.music}
                  category={video.category}
                  topic={video.category}
                  mintNumber={video.minted}
                  price={video.price}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;