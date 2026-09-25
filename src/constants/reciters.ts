/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  style: string;
  bitrate?: string;
}

export const QURAN_RECITERS: Reciter[] = [
  {
    id: 'ar.alafasy',
    name: 'Mishary Rashid Alafasy',
    arabicName: 'مشاري بن راشد العفاسي',
    style: 'Murattal',
    bitrate: '128kbps'
  },
  {
    id: 'ar.abdulbasitmurattal',
    name: 'AbdulBaset AbdulSamad',
    arabicName: 'عبد الباسط عبد الصمد',
    style: 'Murattal',
    bitrate: '192kbps'
  },
  {
    id: 'ar.abdurrahmaansudais',
    name: 'Abdur-Rahman As-Sudais',
    arabicName: 'عبد الرحمن السديس',
    style: 'Murattal',
    bitrate: '192kbps'
  },
  {
    id: 'ar.saoodshuraym',
    name: "Sa'ud Ash-Shuraym",
    arabicName: 'سعود الشريم',
    style: 'Murattal',
    bitrate: '128kbps'
  },
  {
    id: 'ar.mahermuaiqly',
    name: 'Maher Al-Muaiqly',
    arabicName: 'ماهر المعيقلي',
    style: 'Murattal',
    bitrate: '128kbps'
  },
  {
    id: 'ar.minshawi',
    name: 'Mohamed Siddiq Al-Minshawi',
    arabicName: 'محمد صديق المنشاوي',
    style: 'Murattal',
    bitrate: '128kbps'
  },
  {
    id: 'ar.husary',
    name: 'Mahmoud Khalil Al-Husary',
    arabicName: 'محمود خليل الحصري',
    style: 'Murattal',
    bitrate: '128kbps'
  },
  {
    id: 'ar.hudhaify',
    name: 'Ali Al-Hudhaify',
    arabicName: 'علي بن عبد الرحمن الحذيفي',
    style: 'Murattal',
    bitrate: '128kbps'
  },
  {
    id: 'ar.ahmedajamy',
    name: 'Ahmed Al-Ajamy',
    arabicName: 'أحمد بن علي العجمي',
    style: 'Murattal',
    bitrate: '128kbps'
  },
  {
    id: 'ar.abdullahbasfar',
    name: 'Abdullah Basfar',
    arabicName: 'عبد الله بصفر',
    style: 'Murattal',
    bitrate: '192kbps'
  },
  {
    id: 'ar.aymanswoid',
    name: 'Ayman Sowaid',
    arabicName: 'أيمن سويد',
    style: 'Tajweed Mastery',
    bitrate: '128kbps'
  },
  {
    id: 'ar.hanirifai',
    name: 'Hani Ar-Rifai',
    arabicName: 'هاني الرفاعي',
    style: 'Murattal',
    bitrate: '192kbps'
  }
];

export const DEFAULT_RECITER_ID = 'ar.alafasy';

export const getReciterById = (id: string): Reciter => {
  return QURAN_RECITERS.find(r => r.id === id) || QURAN_RECITERS[0];
};
