/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getReciterById, DEFAULT_RECITER_ID } from '../constants/reciters';

export interface AyahAudioSources {
  primary: string;
  fallback: string;
  malayalamTranslation?: string;
  englishTranslation?: string;
  urduTranslation?: string;
}

// EveryAyah folder names matching our reciter identifiers
const EVERY_AYAH_RECITER_MAP: Record<string, string> = {
  'ar.alafasy': 'Alafasy_128kbps',
  'ar.abdulbasitmurattal': 'Abdul_Basit_Murattal_192kbps',
  'ar.abdurrahmaansudais': 'Abdurrahmaan_As-Sudais_192kbps',
  'ar.saoodshuraym': 'Saood_ash-Shuraym_128kbps',
  'ar.mahermuaiqly': 'MaherAlMuaiqly128kbps',
  'ar.minshawi': 'Minshawy_Murattal_128kbps',
  'ar.husary': 'Husary_128kbps',
  'ar.hudhaify': 'Hudhaify_128kbps',
  'ar.ahmedajamy': 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net',
  'ar.abdullahbasfar': 'Abdullah_Basfar_192kbps',
  'ar.aymanswoid': 'Ayman_Sowaid_64kbps',
  'ar.hanirifai': 'Hani_Rifai_192kbps'
};

// MP3Quran server mappings for full continuous Surah MP3 streams
const MP3_QURAN_SERVER_MAP: Record<string, string> = {
  'ar.alafasy': 'https://server8.mp3quran.net/afs',
  'ar.abdulbasitmurattal': 'https://server7.mp3quran.net/basit',
  'ar.abdurrahmaansudais': 'https://server11.mp3quran.net/sds',
  'ar.saoodshuraym': 'https://server7.mp3quran.net/shur',
  'ar.mahermuaiqly': 'https://server12.mp3quran.net/maher',
  'ar.minshawi': 'https://server10.mp3quran.net/minsh',
  'ar.husary': 'https://server13.mp3quran.net/husr',
  'ar.hudhaify': 'https://server9.mp3quran.net/hthfi',
  'ar.ahmedajamy': 'https://server10.mp3quran.net/ajm',
  'ar.abdullahbasfar': 'https://server6.mp3quran.net/bsfr',
  'ar.hanirifai': 'https://server8.mp3quran.net/rifai'
};

export const quranAudioService = {
  /**
   * Get primary CDN audio URL for a specific Ayah by global number (1..6236)
   */
  getAyahAudioUrl(globalAyahNumber: number, reciterId: string = DEFAULT_RECITER_ID, bitrate: string = '128'): string {
    const reciter = getReciterById(reciterId);
    return `https://cdn.islamic.network/quran/audio/${bitrate}/${reciter.id}/${globalAyahNumber}.mp3`;
  },

  /**
   * Get secondary fallback CDN audio URL (EveryAyah mirror)
   */
  getEveryAyahAudioUrl(surahNumber: number, ayahNumberInSurah: number, reciterId: string = DEFAULT_RECITER_ID): string {
    const folder = EVERY_AYAH_RECITER_MAP[reciterId] || 'Alafasy_128kbps';
    const s = String(surahNumber).padStart(3, '0');
    const a = String(ayahNumberInSurah).padStart(3, '0');
    return `https://everyayah.com/data/${folder}/${s}${a}.mp3`;
  },

  /**
   * Get translation audio URLs
   */
  getMalayalamAudioUrl(surahNumber: number, ayahNumberInSurah: number): string {
    const s = String(surahNumber).padStart(3, '0');
    const a = String(ayahNumberInSurah).padStart(3, '0');
    return `https://lalithasaram.net/audio/qtaud/transl/${s}_${a}.ogg`;
  },

  getEnglishAudioUrl(globalAyahNumber: number): string {
    return `https://cdn.islamic.network/quran/audio/128/en.walk/${globalAyahNumber}.mp3`;
  },

  getUrduAudioUrl(globalAyahNumber: number): string {
    return `https://cdn.islamic.network/quran/audio/128/ur.khan/${globalAyahNumber}.mp3`;
  },

  /**
   * Get all audio sources with fallbacks for an Ayah
   */
  getAyahAudioSources(surahNumber: number, ayahNumberInSurah: number, globalAyahNumber: number, reciterId: string = DEFAULT_RECITER_ID): AyahAudioSources {
    return {
      primary: this.getAyahAudioUrl(globalAyahNumber, reciterId),
      fallback: this.getEveryAyahAudioUrl(surahNumber, ayahNumberInSurah, reciterId),
      malayalamTranslation: this.getMalayalamAudioUrl(surahNumber, ayahNumberInSurah),
      englishTranslation: this.getEnglishAudioUrl(globalAyahNumber),
      urduTranslation: this.getUrduAudioUrl(globalAyahNumber)
    };
  },

  /**
   * Get full uninterrupted continuous Surah MP3 stream URL
   */
  getFullSurahStreamUrl(surahNumber: number, reciterId: string = DEFAULT_RECITER_ID): string {
    const s = String(surahNumber).padStart(3, '0');
    const server = MP3_QURAN_SERVER_MAP[reciterId] || 'https://server8.mp3quran.net/afs';
    return `${server}/${s}.mp3`;
  },

  /**
   * Preload upcoming audio files in the background to ensure gapless playback
   */
  preloadAudio(urls: string[]): void {
    if (typeof window === 'undefined') return;
    urls.slice(0, 3).forEach(url => {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = url;
      } catch {}
    });
  }
};
