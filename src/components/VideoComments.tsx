import React, { useState, useEffect } from 'react';
import { useGun } from '../contexts/GunContext';
import { useWallet } from '../contexts/WalletContext';
import Gun from 'gun';
import styles from './VideoComments.module.css';

interface Comment {
  id: string;
  text: string;
  author: string;
  authorAddress: string;
  timestamp: number;
  signature: string;
  pubKey: string;
}

interface AckType {
  err?: string;
  ok?: number;
}

interface GunUserData {
  name: string;
}

interface VideoCommentsProps {
  videoId: string;
}

const VideoComments: React.FC<VideoCommentsProps> = ({ videoId }) => {
  const { gun, authenticateUser } = useGun();
  const { address } = useWallet();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!gun) return;

    const commentsNode = gun.get('comments').get(videoId);
    
    // Subscribe to comments
    (commentsNode as any).map().on((data: Comment, key: string) => {
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

        // Fetch username for the comment author
        if (data.authorAddress) {
          gun.get('users').get(data.authorAddress).on((userData: GunUserData) => {
            if (userData?.name) {
              setUsernames(prev => ({
                ...prev,
                [data.authorAddress]: userData.name
              }));
            }
          });
        }
      }
    });

    setIsLoading(false);

    return () => {
      (commentsNode as any).off();
    };
  }, [gun, videoId]);

  const postComment = async () => {
    if (!gun || !address || !newComment.trim() || !window.keplr) return;
    setIsPosting(true);
    setPostError(null);

    try {
      // Get permit for comment
      const chainId = "stargaze-1";
      const message = `Post comment: ${newComment}`;
      const signature = await window.keplr.signArbitrary(chainId, address, message);
      
      // Authenticate user with Gun
      await authenticateUser(address, signature.signature);
      
      // Post the comment
      const comment = {
        text: newComment.trim(),
        author: address,
        timestamp: Date.now(),
        signature: signature.signature,
        pubKey: signature.pub_key.value
      };

      await new Promise<void>((resolve, reject) => {
        (gun.get('comments').get(videoId) as any).set(comment, (ack: AckType) => {
          if (ack.err) {
            reject(new Error(ack.err));
          } else {
            resolve();
          }
        });
      });

      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      setPostError(error instanceof Error ? error.message : 'Failed to post comment');
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading comments...</div>;
  }

  return (
    <div className={styles.commentsContainer}>
      <div className={styles.commentForm}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          disabled={isPosting}
        />
        <button 
          onClick={postComment} 
          disabled={isPosting || !newComment.trim()}
          className={styles.postButton}
        >
          {isPosting ? 'Posting...' : 'Post Comment'}
        </button>
        {postError && <div className={styles.error}>{postError}</div>}
      </div>
      <div className={styles.commentsList}>
        {comments.map(comment => (
          <div key={comment.id} className={styles.comment}>
            <div className={styles.commentHeader}>
              <span className={styles.author}>
                {usernames[comment.authorAddress] || `${comment.author.slice(0, 6)}...${comment.author.slice(-4)}`}
              </span>
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