/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MediaSessionMetadataOptions {
  title: string;
  artist: string;
  album?: string;
  artwork?: MediaImage[];
}

export interface MediaSessionActionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
  onSeekBackward?: (offsetSeconds?: number) => void;
  onSeekForward?: (offsetSeconds?: number) => void;
  onSeekTo?: (seekTime: number, fastSeek?: boolean) => void;
  onStop?: () => void;
}

// Generate SVG data URI icon for artwork
const QURAN_ARTWORK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="128" fill="%230f766e"/><circle cx="256" cy="256" r="180" fill="%23115e59" stroke="%23f59e0b" stroke-width="8"/><path d="M160 170 C190 150, 240 150, 256 180 C272 150, 322 150, 352 170 L352 330 C322 310, 272 310, 256 340 C240 310, 190 310, 160 330 Z" fill="%23f8fafc" stroke="%23f59e0b" stroke-width="6"/><line x1="256" y1="180" x2="256" y2="340" stroke="%230f766e" stroke-width="4"/><circle cx="256" cy="256" r="28" fill="%23f59e0b"/><text x="256" y="420" font-family="sans-serif" font-size="28" font-weight="bold" fill="%23ffffff" text-anchor="middle">القرآن الكريم</text></svg>`;

export const DEFAULT_MEDIA_ARTWORK: MediaImage[] = [
  { src: QURAN_ARTWORK_SVG, sizes: '96x96', type: 'image/svg+xml' },
  { src: QURAN_ARTWORK_SVG, sizes: '128x128', type: 'image/svg+xml' },
  { src: QURAN_ARTWORK_SVG, sizes: '192x192', type: 'image/svg+xml' },
  { src: QURAN_ARTWORK_SVG, sizes: '256x256', type: 'image/svg+xml' },
  { src: QURAN_ARTWORK_SVG, sizes: '384x384', type: 'image/svg+xml' },
  { src: QURAN_ARTWORK_SVG, sizes: '512x512', type: 'image/svg+xml' }
];

export const mediaSessionManager = {
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
  },

  updateMetadata(options: MediaSessionMetadataOptions): void {
    if (!this.isSupported()) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: options.title,
        artist: options.artist,
        album: options.album || 'Al-Quran Al-Kareem',
        artwork: options.artwork || DEFAULT_MEDIA_ARTWORK
      });
    } catch (err) {
      console.warn('Failed to set MediaSession metadata:', err);
    }
  },

  updatePlaybackState(state: 'playing' | 'paused' | 'none'): void {
    if (!this.isSupported()) return;

    try {
      navigator.mediaSession.playbackState = state;
    } catch (err) {
      console.warn('Failed to set MediaSession playbackState:', err);
    }
  },

  updatePositionState(details: { duration: number; playbackRate?: number; position: number }): void {
    if (!this.isSupported() || !('setPositionState' in navigator.mediaSession)) return;

    try {
      if (
        details.duration > 0 &&
        details.position >= 0 &&
        details.position <= details.duration &&
        !isNaN(details.duration) &&
        !isNaN(details.position)
      ) {
        navigator.mediaSession.setPositionState({
          duration: details.duration,
          playbackRate: details.playbackRate || 1.0,
          position: Math.min(details.position, details.duration)
        });
      }
    } catch (err) {
      // Ignore transient position state errors
    }
  },

  setActionHandlers(handlers: MediaSessionActionHandlers): void {
    if (!this.isSupported()) return;

    const actionMap: [MediaSessionAction, ((details: MediaSessionActionDetails) => void) | undefined][] = [
      ['play', handlers.onPlay ? () => handlers.onPlay!() : undefined],
      ['pause', handlers.onPause ? () => handlers.onPause!() : undefined],
      ['previoustrack', handlers.onPreviousTrack ? () => handlers.onPreviousTrack!() : undefined],
      ['nexttrack', handlers.onNextTrack ? () => handlers.onNextTrack!() : undefined],
      [
        'seekbackward',
        handlers.onSeekBackward
          ? (details) => handlers.onSeekBackward!(details.seekOffset || 5)
          : undefined
      ],
      [
        'seekforward',
        handlers.onSeekForward
          ? (details) => handlers.onSeekForward!(details.seekOffset || 5)
          : undefined
      ],
      [
        'seekto',
        handlers.onSeekTo
          ? (details) => {
              if (details.seekTime !== undefined) {
                handlers.onSeekTo!(details.seekTime, details.fastSeek);
              }
            }
          : undefined
      ],
      ['stop', handlers.onStop ? () => handlers.onStop!() : undefined]
    ];

    for (const [action, handler] of actionMap) {
      try {
        if (handler) {
          navigator.mediaSession.setActionHandler(action, handler);
        } else {
          navigator.mediaSession.setActionHandler(action, null);
        }
      } catch (err) {
        // Some browsers don't support all actions (e.g. seekto on older Safari)
      }
    }
  },

  clear(): void {
    if (!this.isSupported()) return;

    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      const actions: MediaSessionAction[] = [
        'play',
        'pause',
        'previoustrack',
        'nexttrack',
        'seekbackward',
        'seekforward',
        'seekto',
        'stop'
      ];
      for (const action of actions) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      }
    } catch (err) {
      console.warn('Failed to clear MediaSession:', err);
    }
  }
};
