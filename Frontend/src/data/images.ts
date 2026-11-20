/**
 * images.ts - app photos. Our own images are bundled from src/assets/images (load instantly, work offline);
 * the rest are black & white athletic photos from Unsplash (free to use, unsplash.com/license).
 * `sat=-100` asks Unsplash's image server for a black & white version.
 */
const unsplash = (id: string, w = 1000) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75&sat=-100`;

export const IMAGES = {
  welcome: unsplash('1710736460914-4a7f22d736c4', 1200), // man kneeling on a basketball court (portrait)
  hero: require('../assets/images/Person_with_ITT.jpg') as number, // athlete wearing the SmartHeal ITT device
  marathon: unsplash('1461897104016-0b3b00cc81ee'), // marathon
  runner: unsplash('1548971876-8d85566cb404'), // runner in an alley
  shoe: unsplash('1770430725086-8b677d6f25a8'), // runner's leg and shoe
  gym: unsplash('1649068610862-ed43a08442cf'), // gym
  lifting: unsplash('1567598508481-65985588e295'), // dumbbell training
  heat: unsplash('1540205895360-4ad4cffb3aa8'), // hands-on back therapy
  vibration: unsplash('1519824145371-296894a0daa9'), // massage
  tens: unsplash('1772122028843-9139d23af4fb'), // therapist using a device
};