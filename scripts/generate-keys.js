#!/usr/bin/env node
/**
 * Generate an ES256 (P-256) keypair for signing access tokens.
 *
 * No external deps: uses Node.js built-in crypto.
 */
const { generateKeyPairSync } = require("crypto");

const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "prime256v1", // P-256
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

function toEnvMultiline(pem) {
  // Store as a single env var string with \n escapes.
  return pem.trim().replace(/\n/g, "\\n");
}

console.log("\nES256_PRIVATE_KEY=\"" + toEnvMultiline(privateKey) + "\"\n");
console.log("ES256_PUBLIC_KEY=\"" + toEnvMultiline(publicKey) + "\"\n");

console.log("Instructions:");
console.log("- ES256_PRIVATE_KEY signs access tokens (server only). NEVER commit it.");
console.log("- ES256_PUBLIC_KEY verifies access tokens (can be shared).");
console.log("- Add these to backoffice/.env.local (and placeholders to .env.local.example).");
console.log("");

