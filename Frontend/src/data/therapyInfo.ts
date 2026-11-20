/**
 * therapyInfo.ts - plain-language info about the three SmartHeal therapies (shown on the dashboard).
 */
import { IMAGES } from './images';
import type { Therapy } from './sampleStats';
import type { PhotoSource } from '../components/ui/PhotoCard';

export const THERAPY_INFO: Record<
  Therapy,
  { title: string; tagline: string; image: PhotoSource; how: string; helps: string[]; avoid: string[]; range: { label: string; value: string }[] }
> = {
  heat: {
    title: 'Heat Therapy',
    tagline: 'Relax tight muscles, boost blood flow',
    image: IMAGES.heat,
    how: 'Gentle warmth widens blood vessels, bringing more oxygen to the area and easing stiffness. Best for chronic aches and tight muscles - not for fresh injuries.',
    helps: ['Chronic muscle stiffness', 'Lower back and neck tension', 'Joint stiffness in the morning'],
    avoid: ['Fresh injuries with swelling (first 48 h)', 'Open wounds or burns', 'Reduced skin sensation (e.g. diabetic neuropathy)'],
    range: [
      { label: 'Temperature', value: '38 – 45 °C' },
      { label: 'Session', value: '10 – 20 min' },
    ],
  },
  vibration: {
    title: 'Vibration Therapy',
    tagline: 'Loosen knots, speed up recovery',
    image: IMAGES.vibration,
    how: 'Rapid gentle vibrations stimulate muscles and nerves, reducing soreness and helping muscles recover after activity.',
    helps: ['Post-workout soreness', 'Muscle knots and spasms', 'Improving local circulation'],
    avoid: ['Fractures or acute sprains', 'Blood clots or varicose veins in the area', 'During pregnancy over the abdomen'],
    range: [
      { label: 'Frequency', value: '20 – 60 Hz' },
      { label: 'Session', value: '5 – 15 min' },
    ],
  },
  tens: {
    title: 'TENS Therapy',
    tagline: 'Drug-free nerve pain relief',
    image: IMAGES.tens,
    how: 'Transcutaneous Electrical Nerve Stimulation sends small electrical pulses through the skin that block pain signals and trigger natural pain relief.',
    helps: ['Nerve pain and tingling', 'Chronic back or knee pain', 'Pain that limits movement'],
    avoid: ['Pacemakers or heart conditions', 'Over the head, neck front or eyes', 'Broken or irritated skin'],
    range: [
      { label: 'Intensity', value: '10 – 30 mA' },
      { label: 'Session', value: '15 – 30 min' },
    ],
  },
};

export const TIPS = [
  'Use **heat** for stiffness and **cold** for fresh swelling. When in doubt, ask your physiotherapist.',
  'Stay hydrated - muscles recover faster when you drink enough water through the day.',
  'Rate your pain *before* and *after* each session so you can see real progress over the week.',
  'Short, regular sessions beat one long session. Consistency is what builds recovery.',
  'Never use TENS while driving or sleeping, and keep pads away from the front of the neck.',
  'Gentle movement after therapy helps lock in the benefit - try a 5-minute walk or stretch.',
  'Sleep is when tissue repairs most. Aim for 7–9 hours on recovery days.',
];
