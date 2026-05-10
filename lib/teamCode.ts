import { randomInt } from "crypto";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateTeamCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CHARSET[randomInt(0, CHARSET.length)];
  }
  return code;
}

export function normalizeTeamCode(code: string) {
  return code.trim().toUpperCase();
}

