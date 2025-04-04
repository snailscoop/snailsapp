import React from 'react';
import { useParams } from 'react-router-dom';
import VideoComments from '../components/VideoComments';
import styles from './VideoPage.module.css';

const VideoPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();

  if (!videoId) {
    return <div>Video not found</div>;
  }

  return (
    <div className={styles.videoPage}>
      <div className={styles.videoContainer}>
        <video 
          src={`/videos/${videoId}.mp4`} 
          controls 
          className={styles.videoPlayer}
        />
      </div>
      <VideoComments videoId={videoId} />
    </div>
  );
};

export default VideoPage; 