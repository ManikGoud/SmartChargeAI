/// <reference types="vite/client" />

declare interface Window {
  gm_authFailure?: () => void;
  google?: any;
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element | null, opts?: any);
      panTo(latLng: any): void;
      setZoom(zoom: number): void;
    }
    class Marker {
      constructor(opts?: any);
      addListener(event: string, handler: Function): void;
      setMap(map: Map | null): void;
    }
    class InfoWindow {
      constructor(opts?: any);
      setContent(content: string | Element): void;
      open(opts?: any): void;
    }
    class Size {
      constructor(width: number, height: number);
    }
    class Point {
      constructor(x: number, y: number);
    }
  }
}

