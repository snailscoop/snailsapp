import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useGun } from '../contexts/GunContext';
import { signUsernamePermit, signCommentPermit } from '../utils/wallet';
import styles from './VideoComments.module.css';

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: number;
  permit?: {
    params: {
      permit_name: string;
      chain_id: string;
      allowed_tokens: string[];
    };
    signature: string;
  };
}

interface VideoCommentsProps {
  videoId: string;
}

const VideoComments: React.FC<VideoCommentsProps> = ({ videoId }) => {
  const { address } = useWallet();
  const { gun, authenticateUser, isAuthenticated } = useGun();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gun || !videoId) return;

    // Subscribe to comments for this video
    const commentsRef = gun.get('videos').get(videoId).get('comments');
    commentsRef.map().on((data, key) => {
      if (!data) return;
      
      setComments(prevComments => {
        const existingComment = prevComments.find(c => c.id === key);
        if (existingComment) {
          return prevComments.map(c => 
            c.id === key ? { ...c, ...data } : c
          );
        }
        return [...prevComments, { id: key, ...data }];
      });
    });

    return () => {
      commentsRef.map().off();
    };
  }, [gun, videoId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gun || !address || !videoId || !newComment.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Get permit for comment
      const permit = await signCommentPermit(videoId, newComment, address);

      // Authenticate with Gun using the permit
      await authenticateUser(address, permit);

      if (!isAuthenticated) {
        throw new Error('Failed to authenticate with Gun');
      }

      // Save comment
      const commentsRef = gun.get('videos').get(videoId).get('comments');
      const commentId = Date.now().toString();
      
      await new Promise<void>((resolve, reject) => {
        commentsRef.get(commentId).put({
          text: newComment.trim(),
          author: address,
          timestamp: Date.now()
        }, (ack) => {
          if (ack.err) reject(new Error(ack.err));
          else resolve();
        });
      });

      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      setError(error instanceof Error ? error.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.commentsContainer}>
      <h3>Comments</h3>
      <form onSubmit={handleSubmitComment} className={styles.commentForm}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting || !newComment.trim()}>
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.commentsList}>
        {comments.map((comment, index) => (
          <div key={index} className={styles.comment}>
            <div className={styles.commentHeader}>
              <span className={styles.author}>{comment.author}</span>
              <span className={styles.timestamp}>
                {new Date(comment.timestamp).toLocaleString()}
              </span>
            </div>
            <div className={styles.commentText}>{comment.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoComments; 