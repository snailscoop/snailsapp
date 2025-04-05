import React, { useState, useEffect } from 'react';
import { getLikes, getViews, getTotalWatchTime, getTopVideos, getDislikes, getFeedback } from '../services/algorithm';
import { useWallet } from '../contexts/WalletContext';
import styles from './AlgoPopup.module.css';

interface Stats {
  likes: number;
  dislikes: number;
  views: number;
  watchTime: number;
  feedback: number;
  score: number;
}

interface UserStats {
  likes: number;
  dislikes: number;
  watchTime: number;
  feedback: number;
}

interface TopVideo {
  tokenId: string;
  likes: number;
  dislikes: number;
  views: number;
  watchTime: number;
  feedback: number;
  score?: number;
}

interface AlgoPopupProps {
  currentTokenId?: string;
}

const AlgoPopup: React.FC<AlgoPopupProps> = ({ currentTokenId }) => {
  const { address } = useWallet();
  const [stats, setStats] = useState<Stats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [topVideos, setTopVideos] = useState<TopVideo[]>([]);
  const [isMinimized, setIsMinimized] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'user' | 'top'>('stats');

  useEffect(() => {
    const fetchStats = async () => {
      if (currentTokenId) {
        // Show stats for the current video
        const [likes, dislikes, views, watchTime, feedback] = await Promise.all([
          getLikes(currentTokenId),
          getDislikes(currentTokenId),
          getViews(currentTokenId),
          getTotalWatchTime(currentTokenId),
          getFeedback(currentTokenId)
        ]);
        
        const score = calculateScore(likes, views, watchTime);
        setStats({ likes, dislikes, views, watchTime, feedback, score });

        // Get user stats for current video if logged in
        if (address) {
          const userLikes = await getLikes(currentTokenId, address);
          const userDislikes = await getDislikes(currentTokenId, address);
          const userWatchTime = await getTotalWatchTime(currentTokenId, address);
          const userFeedback = await getFeedback(currentTokenId, address);
          setUserStats({ likes: userLikes, dislikes: userDislikes, watchTime: userWatchTime, feedback: userFeedback });
        }
      } else {
        // Show top videos if no specific video
        const ranked = await getTopVideos();
        setTopVideos(ranked.slice(0, 5).map(video => ({
          ...video,
          score: calculateScore(video.likes, video.views, video.watchTime)
        })));

        // Get overall user stats if logged in
        if (address) {
          const userStats = await Promise.all(ranked.map(async video => ({
            likes: await getLikes(video.tokenId, address),
            dislikes: await getDislikes(video.tokenId, address),
            watchTime: await getTotalWatchTime(video.tokenId, address),
            feedback: await getFeedback(video.tokenId, address)
          })));
          
          setUserStats({
            likes: userStats.reduce((sum, stat) => sum + stat.likes, 0),
            dislikes: userStats.reduce((sum, stat) => sum + stat.dislikes, 0),
            watchTime: userStats.reduce((sum, stat) => sum + stat.watchTime, 0),
            feedback: userStats.reduce((sum, stat) => sum + stat.feedback, 0)
          });
        }
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5s
    return () => clearInterval(interval);
  }, [currentTokenId, address]);

  const calculateScore = (likes: number, views: number, watchTime: number): number => {
    return likes + views + (watchTime / 60);
  };

  const formatWatchTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  const formatScore = (score: number): string => {
    return score.toFixed(2);
  };

  if (isMinimized) {
    return (
      <div 
        className={styles.minimizedPopup}
        onClick={() => setIsMinimized(false)}
      >
        📊
      </div>
    );
  }

  return (
    <div className={styles.popup}>
      <div className={styles.header}>
        <h3>Algorithm Progress</h3>
        <button 
          className={styles.minimizeButton}
          onClick={() => setIsMinimized(true)}
        >
          _
        </button>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'stats' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
        {address && (
          <button 
            className={`${styles.tab} ${activeTab === 'user' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('user')}
          >
            Your Stats
          </button>
        )}
        {!currentTokenId && (
          <button 
            className={`${styles.tab} ${activeTab === 'top' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('top')}
          >
            Top Videos
          </button>
        )}
      </div>

      <div className={styles.content}>
        {activeTab === 'stats' && stats && (
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Likes:</span>
              <span className={styles.statValue}>{stats.likes}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Dislikes:</span>
              <span className={styles.statValue}>{stats.dislikes}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Views:</span>
              <span className={styles.statValue}>{stats.views}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Watch Time:</span>
              <span className={styles.statValue}>{formatWatchTime(stats.watchTime)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Feedback Count:</span>
              <span className={styles.statValue}>{stats.feedback}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Engagement Score:</span>
              <span className={styles.statValue}>{formatScore(stats.score)}</span>
            </div>
            <div className={styles.scoreExplanation}>
              Score = Likes + Views + (Watch Time in Minutes)
            </div>
          </div>
        )}

        {activeTab === 'user' && userStats && (
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Likes Given:</span>
              <span className={styles.statValue}>{userStats.likes}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Dislikes Given:</span>
              <span className={styles.statValue}>{userStats.dislikes}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Your Watch Time:</span>
              <span className={styles.statValue}>{formatWatchTime(userStats.watchTime)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Feedback Given:</span>
              <span className={styles.statValue}>{userStats.feedback}</span>
            </div>
          </div>
        )}

        {activeTab === 'top' && (
          <div className={styles.topVideos}>
            <ul>
              {topVideos.map((video) => (
                <li key={video.tokenId}>
                  <div className={styles.videoTitle}>
                    Video ID: {video.tokenId.slice(0, 8)}...{video.tokenId.slice(-4)}
                  </div>
                  <div className={styles.videoScore}>
                    Engagement Score: {formatScore(video.score || 0)}
                  </div>
                  <div className={styles.videoStats}>
                    <div>Likes: {video.likes}</div>
                    <div>Dislikes: {video.dislikes}</div>
                    <div>Views: {video.views}</div>
                    <div>Watch Time: {formatWatchTime(video.watchTime)}</div>
                    <div>Feedback: {video.feedback}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlgoPopup;