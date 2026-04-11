/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Surah, SurahDetail, Ayah } from '../types';

const BASE_URL = 'https://api.alquran.cloud/v1';

export const quranService = {
  async getSurahs(): Promise<Surah[]> {
    const response = await fetch(`${BASE_URL}/surah`);
    const data = await response.json();
    return data.data;
  },

  async getSurahDetail(number: number, edition: string = 'quran-uthmani'): Promise<SurahDetail> {
    const response = await fetch(`${BASE_URL}/surah/${number}/${edition}`);
    const data = await response.json();
    return data.data;
  },

  async getSurahWithTranslation(number: number, translationEdition: string = 'en.sahih'): Promise<SurahDetail> {
    const [arabicResponse, translationResponse] = await Promise.all([
      fetch(`${BASE_URL}/surah/${number}/quran-uthmani`),
      fetch(`${BASE_URL}/surah/${number}/${translationEdition}`)
    ]);

    const arabicData = await arabicResponse.json();
    const translationData = await translationResponse.json();

    const surah = arabicData.data;
    surah.ayahs = surah.ayahs.map((ayah: any, index: number) => ({
      ...ayah,
      translation: translationData.data.ayahs[index].text
    }));

    return surah;
  },

  async getSurahWithAudio(number: number, audioEdition: string = 'ar.alafasy'): Promise<SurahDetail> {
    const response = await fetch(`${BASE_URL}/surah/${number}/${audioEdition}`);
    const data = await response.json();
    return data.data;
  },

  // Helper to get Malayalam audio URL per ayah
  getMalayalamAudioUrl(surah: number, ayah: number): string {
    return `https://lalithasaram.net/audio/qtaud/transl/${surah}_${ayah}.ogg`;
  },

  async getAyahsRange(
    surahNumber: number, 
    start: number, 
    end: number, 
    editions: string[] = ['quran-uthmani', 'en.sahih', 'ml.abdulhameed']
  ): Promise<Ayah[]> {
    const editionsStr = editions.join(',');
    const response = await fetch(`${BASE_URL}/surah/${surahNumber}/editions/${editionsStr}`);
    const data = await response.json();

    // The API returns an array of surah objects for each edition
    const surahs = data.data;
    const baseAyahs = surahs[0].ayahs.slice(start - 1, end);

    return baseAyahs.map((ayah: any, index: number) => {
      const result: any = { ...ayah };
      // Add translations from other editions
      surahs.slice(1).forEach((editionSurah: any) => {
        const editionAyah = editionSurah.ayahs[start - 1 + index];
        if (editionSurah.edition.language === 'ml') {
          result.malayalamTranslation = editionAyah.text;
        } else if (editionSurah.edition.language === 'en') {
          result.translation = editionAyah.text;
        }
      });
      // Ensure surah and ayah numbers are set for the audio URL
      const surahNum = result.surahNumber || surahNumber;
      const ayahNum = result.numberInSurah || result.number || (start + index);
      result.malayalamAudioUrl = undefined;
      result._malayalamAudioUrlCheck = this.getMalayalamAudioUrl(surahNum, ayahNum);
      result._malayalamAudioSurah = surahNum;
      result._malayalamAudioAyah = ayahNum;
      return result;
    });
  },

  // Helper to check if Malayalam audio exists for a given surah and ayah
  async fetchMalayalamAudioUrl(surah: number, ayah: number): Promise<string | null> {
    const url = this.getMalayalamAudioUrl(surah, ayah);
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        return url;
      }
      return null;
    } catch {
      return null;
    }
	},

  async search(query: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/search/${query}/all/en.sahih`);
    const data = await response.json();
    return data.data;
  }
};
