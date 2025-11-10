export type EmotionType = 'happy' | 'neutral' | 'sad' | 'angry' | 'surprised' | 'fearful' | 'disgust';

export type EngagementStatus = 'Attentive' | 'Distracted' | 'Drowsy';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EmotionData {
  emotion: EmotionType;
  confidence: number;
  engagement: EngagementStatus;
  timestamp: number;
  boundingBox?: BoundingBox;
}

export interface StudentData {
  id: string;
  name: string;
  currentEmotion: EmotionType;
  engagement: EngagementStatus;
  confidence: number;
  history: EmotionData[];
  boundingBox?: BoundingBox;
  lastSeen: number;
}

export const emotionToEngagement = (emotion: EmotionType): EngagementStatus => {
  if (emotion === 'happy' || emotion === 'neutral') return 'Attentive';
  if (emotion === 'sad' || emotion === 'angry' || emotion === 'disgust') return 'Distracted';
  return 'Drowsy'; // fearful, surprised
};

export const engagementColors = {
  Attentive: 'success',
  Distracted: 'warning',
  Drowsy: 'danger',
} as const;

export const emotionEmojis: Record<EmotionType, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  angry: '😠',
  surprised: '😲',
  fearful: '😨',
  disgust: '🤢',
};
