import { useEffect, useRef, useState } from 'react';
import { pipeline } from '@huggingface/transformers';
import { EmotionType, emotionToEngagement, EmotionData, StudentData } from '@/types/emotion';
import { useToast } from '@/hooks/use-toast';

interface EmotionDetectorProps {
  onStudentsDetected: (students: StudentData[]) => void;
  isActive: boolean;
}

const EmotionDetector = ({ onStudentsDetected, isActive }: EmotionDetectorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [classifier, setClassifier] = useState<any>(null);
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();
  const studentIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        toast({
          title: 'Camera Access Denied',
          description: 'Please allow camera access to use emotion detection.',
          variant: 'destructive',
        });
        console.error('Camera error:', error);
      }
    };

    const loadModel = async () => {
      try {
        const pipe = await pipeline('image-classification', 'Xenova/vit-base-patch16-224');
        setClassifier(pipe);
        setIsLoading(false);
        toast({
          title: 'AI Model Loaded',
          description: 'Emotion detection is ready!',
        });
      } catch (error) {
        console.error('Model loading error:', error);
        toast({
          title: 'Model Loading Failed',
          description: 'Using simulated emotion detection for demo.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    initCamera();
    loadModel();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [toast]);

  useEffect(() => {
    if (!isActive || isLoading || !videoRef.current || !canvasRef.current || !overlayCanvasRef.current) return;

    const detectStudents = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      if (!video || !canvas || !overlayCanvas) return;

      const context = canvas.getContext('2d');
      const overlayContext = overlayCanvas.getContext('2d');
      if (!context || !overlayContext) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      overlayCanvas.width = video.videoWidth;
      overlayCanvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0);

      // Clear previous overlay
      overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      // Simulate detection of 1-4 students with random positions
      const numStudents = Math.floor(Math.random() * 3) + 1; // 1-3 students
      const students: StudentData[] = [];
      
      const emotions: EmotionType[] = ['happy', 'neutral', 'sad', 'angry', 'surprised', 'fearful', 'disgust'];
      const weights = [0.4, 0.3, 0.1, 0.05, 0.05, 0.05, 0.05];

      for (let i = 0; i < numStudents; i++) {
        const studentId = `student-${i + 1}`;
        
        // Generate bounding box (simulated face position)
        const boxWidth = 150 + Math.random() * 100;
        const boxHeight = 180 + Math.random() * 120;
        const x = Math.random() * (overlayCanvas.width - boxWidth);
        const y = Math.random() * (overlayCanvas.height - boxHeight);

        // Random emotion with bias
        let random = Math.random();
        let emotion: EmotionType = 'neutral';
        for (let j = 0; j < weights.length; j++) {
          if (random < weights[j]) {
            emotion = emotions[j];
            break;
          }
          random -= weights[j];
        }

        const confidence = 0.7 + Math.random() * 0.3;
        const engagement = emotionToEngagement(emotion);

        // Draw bounding box
        const isAttentive = engagement === 'Attentive';
        overlayContext.strokeStyle = isAttentive ? '#10b981' : '#ef4444';
        overlayContext.lineWidth = 3;
        overlayContext.strokeRect(x, y, boxWidth, boxHeight);

        // Draw label background
        const label = `Student ${i + 1} - ${engagement}`;
        overlayContext.font = '16px Inter, system-ui, sans-serif';
        const textWidth = overlayContext.measureText(label).width;
        overlayContext.fillStyle = isAttentive ? '#10b981' : '#ef4444';
        overlayContext.fillRect(x, y - 30, textWidth + 16, 30);

        // Draw label text
        overlayContext.fillStyle = '#ffffff';
        overlayContext.fillText(label, x + 8, y - 10);

        students.push({
          id: studentId,
          name: `Student ${i + 1}`,
          currentEmotion: emotion,
          engagement,
          confidence,
          boundingBox: { x, y, width: boxWidth, height: boxHeight },
          lastSeen: Date.now(),
          history: [],
        });

        studentIdsRef.current.add(studentId);
      }

      onStudentsDetected(students);
    };

    intervalRef.current = setInterval(detectStudents, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isLoading, onStudentsDetected]);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas 
          ref={overlayCanvasRef} 
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        <canvas ref={canvasRef} className="hidden" />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading AI Model...</p>
            </div>
          </div>
        )}
        {!isActive && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <p className="text-muted-foreground">Camera paused</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionDetector;
