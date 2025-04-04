import React, { useRef, useState, useEffect } from 'react';
import styles from './CustomVideoPlayer.module.css';
import { VolumeIcon, VolumeMutedIcon, FullscreenIcon, ExitFullscreenIcon } from './Icons';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  isPreview?: boolean;
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ src, poster, isPreview = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [showPreview, setShowPreview] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
      setCurrentTime(formatTime(video.currentTime));
    };

    const handleLoadedMetadata = () => {
      setDuration(formatTime(video.duration));
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      setShowPreview(false);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
    setIsPlaying(false);
    setShowPreview(true);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const time = (percentage / 100) * videoRef.current.duration;
    
    videoRef.current.currentTime = time;
    setProgress(percentage);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, x / rect.width));
    
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted && volume === 0) {
      videoRef.current.volume = 1;
      setVolume(1);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  return (
    <div ref={containerRef} className={styles.videoContainer}>
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        poster={poster}
        onClick={togglePlay}
        playsInline
      />
      
      {showPreview && (
        <div className={styles.preview} onClick={togglePlay}>
          <img src="/images/SNAILS.StickerPePe.png" alt="Play" />
          <span className={styles.previewText}>Play</span>
        </div>
      )}

      {!isPreview && (
        <div className={styles.controls}>
          <button className={styles.playButton} onClick={togglePlay}>
            <img 
              src={isPlaying ? "/images/SNAILS.Explosive.png" : "/images/SNAILS.StickerPePe.png"} 
              alt={isPlaying ? "Stop" : "Play"} 
            />
          </button>

          <div className={styles.progressContainer} onClick={handleProgressClick}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          </div>

          <div className={styles.volumeContainer}>
            <button className={styles.volumeButton} onClick={toggleMute}>
              {isMuted ? <VolumeMutedIcon /> : <VolumeIcon />}
            </button>
            <div className={styles.volumeSlider} onClick={handleVolumeChange}>
              <div className={styles.volumeLevel} style={{ width: `${volume * 100}%` }} />
            </div>
          </div>

          <div className={styles.timestamp}>
            {currentTime} / {duration}
          </div>

          <button className={styles.fullscreenButton} onClick={toggleFullscreen}>
            {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomVideoPlayer; 