/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  audio?: string;
  audioSecondary?: string[];
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
  translation?: string;
  malayalamTranslation?: string;
  surahNumber?: number;
}

export interface SurahDetail extends Surah {
  ayahs: Ayah[];
  edition?: {
    identifier: string;
    language: string;
    name: string;
    englishName: string;
    format: string;
    type: string;
  };
}

export interface Bookmark {
  id: string;
  uid: string;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  timestamp: number;
}

export interface LastRead {
  uid: string;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  timestamp: number;
}

export interface MemorizationPreset {
  id: string;
  uid: string;
  title: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  repeatCount: number;
  playMeaning: boolean;
  settings: PlaybackSettings;
  timestamp: number;
}

export interface PlaybackSettings {
  delayBetweenAyahs: number; // in seconds
  delayBetweenCycles: number; // in seconds
  playbackSpeed: number;
  reciter: string;
}

export interface Slider {
  min: number;
  max: number;
  step: number;
  value: number;
}
