/** Input validation helpers */

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function doPasswordsMatch(password: string, confirm: string): boolean {
  return password === confirm;
}

export function isValidAge(age: number): boolean {
  return age >= 13 && age <= 120;
}

export function isValidWeight(weight: number): boolean {
  return weight >= 30 && weight <= 300;
}

export function isValidHeight(height: number): boolean {
  return height >= 100 && height <= 250;
}

export function isValidIntensity(intensity: number): boolean {
  return intensity >= 1 && intensity <= 10;
}

export function isValidDuration(duration: number): boolean {
  return duration >= 10 && duration <= 60;
}
