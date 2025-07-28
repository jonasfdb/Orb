// Orb - Several generator utilities for the bot
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

export function generate_error_id(): string {
  const timestamp = Math.floor(((Date.now() / 1000) / 60)).toString(32);
  const randomString = generate_random_string(5);
  const error_id = `err-${timestamp}-${randomString}`;

  return error_id;
}

export function generate_orb_id(): string {
  const timestamp = Date.now().toString(32);
  const randomString = generate_random_string(12);
  const orb_id = `orb-${timestamp}-${randomString}`;

  return orb_id;
}

export function generate_token(length: number): string {
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

export function generate_captcha_string(length: number): string {
  let r_string: string = '';
  const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    r_string += characters.charAt(randomIndex);
  }

  return r_string;
}

export function generate_random_string(length: number): string {
  let r_string: string = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    r_string += characters.charAt(randomIndex);
  }

  return r_string;
}
