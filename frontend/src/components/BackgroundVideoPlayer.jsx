import React, { useEffect, useRef, useState } from 'react';

/**
 * Robust Background Video Player for SmartChargeAI
 * 
 * Ensures 100% compliant and reliable autoplay across Chrome, Edge, Safari & Mobile:
 * 1. Sets video.defaultMuted = true and video.muted = true via DOM properties.
 * 2. Uses playsInline, loop, and autoPlay attributes.
 * 3. Catches and recovers from DOMException play() rejections.
 * 4. Renders full-bleed (absolute inset-0, w-full, h-full, object-cover).
 * 5. Provides error boundary and readyState tracking.
 */
export function BackgroundVideoPlayer({
  src = '/assets/flow.mp4',
  poster = '/assets/batman_be6.png',
  overlayClassName = 'bg-gradient-to-b from-dark-950/80 via-dark-950/70 to-dark-950',
  className = '',
  opacity = 'opacity-40',
  onReady = null
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle safe autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasError(false);
    setErrorMessage('');

    // CRITICAL: Browsers strictly enforce muted autoplay
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;

    const attemptPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if (onReady) onReady(true);
          })
          .catch((err) => {
            console.warn('Initial autoplay prevented, retrying muted...', err);
            // Ensure muted flag is re-applied and retry
            video.muted = true;
            video
              .play()
              .then(() => {
                setIsPlaying(true);
                if (onReady) onReady(true);
              })
              .catch((retryErr) => {
                console.error('Video autoplay failed:', retryErr);
                setHasError(true);
                setErrorMessage(retryErr.message);
              });
          });
      }
    };

    if (video.readyState >= 2) {
      attemptPlay();
    } else {
      video.addEventListener('loadeddata', attemptPlay, { once: true });
      video.addEventListener('canplay', attemptPlay, { once: true });
    }

    return () => {
      if (video) {
        video.removeEventListener('loadeddata', attemptPlay);
        video.removeEventListener('canplay', attemptPlay);
      }
    };
  }, [src, onReady]);

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 ${className}`}>
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`w-full h-full object-cover transition-opacity duration-700 ${opacity} ${
          isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        onError={(e) => {
          console.error(`Error loading video from path: ${src}`, e);
          setHasError(true);
          setErrorMessage('Video failed to load');
        }}
      />

      {/* Fallback Poster Image if video is loading or encounters error */}
      {(!isPlaying || hasError) && (
        <img
          src={poster}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover filter blur-[2px] ${opacity} scale-105`}
        />
      )}

      {/* Dark Ambient Gradient Overlay for Text Readability */}
      <div className={`absolute inset-0 ${overlayClassName}`}></div>
      <div className="absolute inset-0 bg-dark-950/30"></div>
    </div>
  );
}

