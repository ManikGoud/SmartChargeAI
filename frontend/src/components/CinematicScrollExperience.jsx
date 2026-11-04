import React from 'react';
import { SmartChargeCinematicScroll } from './SmartChargeCinematicScroll';

export { SmartChargeCinematicScroll };

/**
 * CinematicScrollExperience
 * Primary entry point for the SmartChargeAI 4-scene, 800-frame scroll-driven animation.
 * Powered by GSAP ScrollTrigger, HTML5 Canvas, and the GreenIQ automotive luxury aesthetic.
 */
export function CinematicScrollExperience({ setCurrentPage, onSearch }) {
  return (
    <SmartChargeCinematicScroll 
      setCurrentPage={setCurrentPage} 
      onSearch={onSearch} 
    />
  );
}

export default CinematicScrollExperience;
