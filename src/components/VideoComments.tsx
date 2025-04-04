import React, { useState, useEffect } from 'react';
import { useGun } from '../contexts/GunContext';
import styles from './VideoComments.module.css';

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: number;
}

interface VideoCommentsProps {
  videoId: string;
}

const VideoComments: React.FC<VideoCommentsProps> = ({ videoId }) => {
  const { gun, user } = useGun();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!gun) return;

    const commentsNode = gun.get('comments').get(videoId);
    
    // Subscribe to comments
    commentsNode.map().on((data, key) => {
      if (data && key !== '_') {
        setComments(prev => {
          const newComments = [...prev];
          const index = newComments.findIndex(c => c.id === key);
          if (index === -1) {
            newComments.push({ ...data, id: key });
          } else {
            newComments[index] = { ...data, id: key };
          }
          return newComments.sort((a, b) => b.timestamp - a.timestamp);
        });
      }
    });

    setIsLoading(false);

    return () => {
      commentsNode.off();
    };
  }, [gun, videoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gun || !user || !newComment.trim()) return;

    try {
      const comment = {
        text: newComment.trim(),
        author: user.is?.alias || 'Anonymous',
        timestamp: Date.now()
      };

      const commentsNode = gun.get('comments').get(videoId);
      await commentsNode.set(comment);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading comments...</div>;
  }

  return (
    <div className={styles.commentsContainer}>
      <h3>Comments</h3>
      <form onSubmit={handleSubmit} className={styles.commentForm}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className={styles.commentInput}
        />
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={!newComment.trim()}
        >
          Post Comment
        </button>
      </form>
      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <p className={styles.noComments}>No comments yet. Be the first to comment!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className={styles.comment}>
              <div className={styles.commentHeader}>
                <span className={styles.author}>{comment.author}</span>
                <span className={styles.timestamp}>
                  {new Date(comment.timestamp).toLocaleString()}
                </span>
              </div>
              <p className={styles.text}>{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VideoComments; 