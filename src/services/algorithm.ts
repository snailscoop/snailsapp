import Gun from 'gun';

let gunInstance: Gun | null = null;

export const initializeAlgorithm = (instance: Gun) => {
  gunInstance = instance;
};

export const viewVideo = (tokenId: string) => {
  if (!gunInstance) return;
  gunInstance.get('snails-social').get(tokenId).get('views').put({ count: Date.now() });
};

export const likeVideo = (tokenId: string, userId: string) => {
  if (!gunInstance) return;
  gunInstance.get('snails-social').get(tokenId).get('likes').get(userId).put(true);
};

export const dislikeVideo = (tokenId: string, userId: string) => {
  if (!gunInstance) return;
  gunInstance.get('snails-social').get(tokenId).get('dislikes').get(userId).put(true);
};

export const submitFeedback = (tokenId: string, userId: string, feedback: string) => {
  if (!gunInstance) return;
  gunInstance.get('snails-social').get(tokenId).get('feedback').get(userId).put(feedback);
};

export const logWatchTime = (tokenId: string, userId: string, watchTimeSeconds: number) => {
  if (!gunInstance) return;
  gunInstance.get('snails-social').get(tokenId).get('watchTime').get(userId).put(watchTimeSeconds);
};

export const getViews = (tokenId: string): Promise<number> => {
  return new Promise((resolve) => {
    if (!gunInstance) return resolve(0);
    gunInstance.get('snails-social').get(tokenId).get('views').once((data: any) => {
      resolve(Object.keys(data || {}).length - 1);
    });
  });
};

export const getLikes = (tokenId: string, userId?: string): Promise<number> => {
  return new Promise((resolve) => {
    if (!gunInstance) return resolve(0);
    gunInstance.get('snails-social').get(tokenId).get('likes').once((data: any) => {
      if (userId) {
        resolve(data && data[userId] ? 1 : 0);
      } else {
        resolve(Object.keys(data || {}).length - 1);
      }
    });
  });
};

export const getDislikes = (tokenId: string, userId?: string): Promise<number> => {
  return new Promise((resolve) => {
    if (!gunInstance) return resolve(0);
    gunInstance.get('snails-social').get(tokenId).get('dislikes').once((data: any) => {
      if (userId) {
        resolve(data && data[userId] ? 1 : 0);
      } else {
        resolve(Object.keys(data || {}).length - 1);
      }
    });
  });
};

export const getFeedback = (tokenId: string, userId?: string): Promise<number> => {
  return new Promise((resolve) => {
    if (!gunInstance) return resolve(0);
    gunInstance.get('snails-social').get(tokenId).get('feedback').once((data: any) => {
      if (userId) {
        resolve(data && data[userId] ? 1 : 0);
      } else {
        resolve(Object.keys(data || {}).length - 1);
      }
    });
  });
};

export const getTotalWatchTime = (tokenId: string, userId?: string): Promise<number> => {
  return new Promise((resolve) => {
    if (!gunInstance) return resolve(0);
    gunInstance.get('snails-social').get(tokenId).get('watchTime').once((data: any) => {
      if (userId) {
        resolve(data && data[userId] ? data[userId] : 0);
      } else {
        const times = Object.values(data || {}).filter((t) => typeof t === 'number');
        resolve(times.reduce((sum, t) => sum + (t as number), 0));
      }
    });
  });
};

interface VideoStats {
  tokenId: string;
  likes: number;
  dislikes: number;
  views: number;
  watchTime: number;
  feedback: number;
  score?: number;
}

export const getTopVideos = async (): Promise<VideoStats[]> => {
  return new Promise((resolve) => {
    if (!gunInstance) return resolve([]);
    gunInstance.get('snails-social').once(async (data: any) => {
      if (!data) return resolve([]);
      const videos = await Promise.all(
        Object.keys(data)
          .filter(key => key !== '_')
          .map(async (tokenId) => ({
            tokenId,
            likes: await getLikes(tokenId),
            dislikes: await getDislikes(tokenId),
            views: await getViews(tokenId),
            watchTime: await getTotalWatchTime(tokenId),
            feedback: await getFeedback(tokenId)
          }))
      );
      const rankedVideos = videos
        .map((video) => ({
          ...video,
          score: video.likes + video.views + (video.watchTime / 60),
        }))
        .sort((a, b) => (b.score || 0) - (a.score || 0));
      resolve(rankedVideos);
    });
  });
}; 