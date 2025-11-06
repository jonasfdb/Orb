// Orb - Several generator utilities for the bot
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

export function generateErrorID(): string {
  const timestamp = Math.floor(((Date.now() / 1000) / 60)).toString(32);
  const randomString = generateLowercaseString(5);
  const id = `err-${timestamp}-${randomString}`;

  return id;
}

export function generateOrbUUID(): string {
  const timestamp = Date.now().toString(32);
  const randomString = generateLowercaseString(12);
  const id = `orb-${timestamp}-${randomString}`;

  return id;
}

export function generateToken(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let token: string = '';

  if (length < 1) {
    console.error('Missing token length for generating new token!');
    return token;
  }

  for (var i = 0; i < length; i++) {
    token = token + chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export function generateUppercaseString(length: number): string {
  let rString: string = '';
  const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    rString += characters.charAt(randomIndex);
  }

  return rString;
}

export function generateLowercaseString(length: number): string {
  let rString: string = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    rString += characters.charAt(randomIndex);
  }

  return rString;
}
