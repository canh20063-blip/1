import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Film } from 'lucide-react';

interface SlideVideoPlayerProps {
  videoUrl: string;
  poster?: string;
  loop?: boolean;
  defaultMuted?: boolean;
  isBackground?: boolean;
  isThumbnail?: boolean;
  focalPoint?: 'top' | 'center' | 'bottom';
  focalY?: number;
  focalX?: number;
  zoom?: number;
  className?: string;
  overlayDarkness?: number;
}

export const SlideVideoPlayer: React.FC<SlideVideoPlayerProps> = ({
  videoUrl,
  poster,
  loop = true,
  defaultMuted = true,
  isBackground = false,
  isThumbnail = false,
  focalPoint = 'center',
  focalY,
  focalX,
  zoom = 100,
  className = '',
  overlayDarkness = 60,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(defaultMuted);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Autoplay when mounted
    video.muted = isMuted;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          // If browser restricts, ensure muted and retry
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => setIsPlaying(false));
        });
    }

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      if (!loop) {
        setIsPlaying(false);
        setProgress(0);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoUrl, loop, isMuted]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(console.error);
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const effectiveFocalY = focalY ?? (focalPoint === 'top' ? 10 : focalPoint === 'bottom' ? 90 : 50);
  const effectiveFocalX = focalX ?? 50;

  if (isThumbnail) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <video
          src={videoUrl}
          poster={poster}
          className="w-full h-full object-cover"
          style={{ objectPosition: `${effectiveFocalX}% ${effectiveFocalY}%` }}
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
        />
        <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[6px] font-mono text-amber-300 font-bold flex items-center gap-0.5">
          <Film className="w-2 h-2" />
          <span>MP4</span>
        </div>
      </div>
    );
  }

  // If used as Full-Bleed Slide Background
  if (isBackground) {
    return (
      <>
        {/* Background Media Container (z-0 behind text) */}
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-0 overflow-hidden select-none cursor-pointer group/videobg"
          title={isPlaying ? 'Нажмите, чтобы поставить видео на паузу' : 'Нажмите, чтобы воспроизвести видео'}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            poster={poster}
            loop={loop}
            muted={isMuted}
            autoPlay
            playsInline
            preload="metadata"
            className="w-full h-full object-cover transition-transform duration-300 pointer-events-none"
            style={{
              objectPosition: `${effectiveFocalX}% ${effectiveFocalY}%`,
              transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
              transformOrigin: `${effectiveFocalX}% ${effectiveFocalY}%`,
            }}
          />

          {/* Contrast Scrim Protection Overlay */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${overlayDarkness / 100})`,
              backgroundImage:
                'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.70) 100%)',
            }}
          />
        </div>

        {/* Minimal Non-Intrusive Sound Toggle (bottom right, above progress bar) */}
        <div className="absolute bottom-2.5 right-2.5 z-30 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-xs transition-colors cursor-pointer"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? (
              <VolumeX className="w-2.5 h-2.5 text-neutral-300" />
            ) : (
              <Volume2 className="w-2.5 h-2.5 text-amber-400" />
            )}
          </button>
        </div>

        {/* Bottom subtle progress line */}
        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-black/40 z-20 overflow-hidden pointer-events-none">
          <div
            className="h-full bg-amber-400 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </>
    );
  }

  // Framed Video Card Mode (Within layout blocks)
  return (
    <div
      onClick={togglePlay}
      className={`relative w-full overflow-hidden select-none cursor-pointer group/videocard bg-neutral-950 rounded-xl border border-neutral-700/80 shadow-md ${className}`}
      title={isPlaying ? 'Нажмите для паузы' : 'Нажмите для воспроизведения'}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        loop={loop}
        muted={isMuted}
        autoPlay
        playsInline
        preload="metadata"
        className="w-full h-full object-cover transition-transform duration-200"
        style={{
          objectPosition: `${effectiveFocalX}% ${effectiveFocalY}%`,
          transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
          transformOrigin: `${effectiveFocalX}% ${effectiveFocalY}%`,
        }}
      />

      {/* Subtle overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

      {/* Small play indicator when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30">
          <div className="w-10 h-10 rounded-full bg-neutral-900/90 border border-amber-400 text-amber-300 shadow-xl flex items-center justify-center backdrop-blur">
            <Play className="w-5 h-5 fill-amber-300 ml-0.5" />
          </div>
        </div>
      )}

      {/* Audio Control in top-right */}
      <div className="absolute top-1.5 right-1.5 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={toggleMute}
          className="p-1 rounded-md bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur transition-colors cursor-pointer"
          title={isMuted ? 'Включить звук' : 'Выключить звук'}
        >
          {isMuted ? (
            <VolumeX className="w-2.5 h-2.5 text-neutral-300" />
          ) : (
            <Volume2 className="w-2.5 h-2.5 text-amber-400" />
          )}
        </button>
      </div>

      {/* Bottom Slim Progress Bar */}
      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-black/40 z-20 overflow-hidden pointer-events-none">
        <div
          className="h-full bg-amber-400 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
