import * as bip32 from 'bip32';
import { ECPair, networks } from 'bitcoinjs-lib';
import * as nacl from 'tweetnacl';
import * as hex from '@stablelib/hex';
import * as bls from 'noble-bls12-381';
import stripHexPrefix from 'strip-hex-prefix';
import { ExtendedKeys } from '../baseCoin/iface';
import bs58 from 'bs58';

/**
 * @param {string} xpub - a base-58 encoded extended public key (BIP32)
 * @returns {string} the uncompressed public key in hexadecimal
 */
export function xpubToUncompressedPub(xpub: string): string {
  if (!isValidXpub(xpub)) {
    throw new Error('invalid xpub');
  }
  return ECPair.fromPublicKey(bip32.fromBase58(xpub, networks.bitcoin).publicKey, {
    compressed: false,
  }).publicKey.toString('hex');
}

/**
 * @param {string} xprv - base58-encoded extended private key (BIP32)
 * @returns {string} the hex-encoded raw private key
 */
export function xprvToRawPrv(xprv: string): string {
  if (!isValidXprv(xprv)) {
    throw new Error('invalid xprv');
  }

  const { privateKey } = bip32.fromBase58(xprv, networks.bitcoin);
  if (!privateKey) {
    throw new Error('invalid xprv');
  }
  return privateKey.toString('hex');
}

/**
 * @param {string} prv - Private key in hex format to get the extended keys for
 * @returns {ExtendedKeys} xprv and xpub in string format
 */
export function rawPrvToExtendedKeys(prv: string): ExtendedKeys {
  const hd = bip32.fromPrivateKey(Buffer.from(prv, 'hex'), Buffer.alloc(32));
  return {
    xprv: hd.toBase58(),
    xpub: hd.neutered().toBase58(),
  };
}

/**
 * Whether the input is a valid BIP32 xpub or not
 *
 * @param xpub
 */
export function isValidXpub(xpub: string): boolean {
  if (xpub.substr(0, 4) !== 'xpub') {
    // check for xpub formats we don't support, such as tpub
    return false;
  }
  try {
    bip32.fromBase58(xpub, networks.bitcoin);
  } catch (err) {
    return false;
  }
  // if HD generation didn't throw, it is a valid xpub
  return true;
}

/**
 * Whether the input is a valid BIP32 xprv or not
 *
 * @param xprv
 */
export function isValidXprv(xprv: string): boolean {
  if (xprv.substr(0, 4) !== 'xprv') {
    // check for xprv formats we don't support
    return false;
  }
  try {
    bip32.fromBase58(xprv, networks.bitcoin);
  } catch (err) {
    return false;
  }
  // if HD generation didn't throw, it is a valid xprv
  return true;
}

/**
 * Whether the input is a valid secp256k1 public key
 *
 * @param pub
 */
export function isValidPub(pub: string): boolean {
  try {
    ECPair.fromPublicKey(Buffer.from(pub, 'hex'));
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Whether the input is a valid secp256k1 private key
 *
 * @param prv
 */
export function isValidPrv(prv: string): boolean {
  try {
    ECPair.fromPrivateKey(Buffer.from(prv, 'hex'));
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Whether the input is a valid ed25519 private key
 *
 * @param {string} prv A hexadecimal private key to validate
 * @returns {boolean} Whether the input is a valid public key or not
 */
export function isValidEd25519Seed(prv: string): boolean {
  try {
    const decodedPrv = toUint8Array(prv);
    return decodedPrv.length === nacl.sign.seedLength;
  } catch (e) {
    return false;
  }
}

/**
 * Whether the input is a valid ed25519 private key
 *
 * @param {string} prv A hexadecimal private key to validate
 * @returns {boolean} Whether the input is a valid public key or not
 */
export function isValidEd25519SecretKey(prv: string): boolean {
  try {
    const decodedPrv = toUint8Array(prv);
    return decodedPrv.length === nacl.sign.secretKeyLength;
  } catch (e) {
    return false;
  }
}

/**
 * Whether the input is a valid ed25519 public key
 *
 * @param {string} pub A hexadecimal public key to validate
 * @returns {boolean} Whether the input is a valid public key or not
 */
export function isValidEd25519PublicKey(pub: string): boolean {
  try {
    const decodedPub = new Uint8Array(Buffer.from(pub, 'hex'));
    return decodedPub.length === nacl.sign.publicKeyLength;
  } catch (e) {
    return false;
  }
}

/**
 * Whether the input is a valid BLS private key
 *
 * @param {string} prv a private key to validate
 * @returns {boolean} Whether the input is a valid private key or not
 */
export function isValidBLSPrivateKey(prv: string): boolean {
  try {
    return bls.Fr.isValid(BigInt(prv));
  } catch (e) {
    return false;
  }
}

/**
 * Whether input is a valid BLS public key
 *
 * @param {string} pub the public key to validate
 * @returns {boolean} Whether input is a valid public key or not
 */
export function isValidBLSPublicKey(pub: string): boolean {
  try {
    bls.PointG1.fromCompressedHex(stripHexPrefix(pub)).assertValidity();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Returns an hex string of the given buffer
 *
 * @param {Buffer | Uint8Array} buffer - the buffer to be converted to hex
 * @returns {string} - the hex value
 */
export function toHex(buffer: Buffer | Uint8Array): string {
  return hex.encode(buffer, true);
}

/**
 * Returns an hex string of the given bigint
 *
 * @param {bigint} bigint - the bigint to be converted to hex
 * @returns {string} - the hex value
 */
export function bigIntToHex(bigint: bigint): string {
  const hex = bigint.toString(16);
  return '0x' + '0'.slice(0, hex.length % 2) + hex;
}

/**
 * Returns a BigInt value from hex
 *
 * @param {string} hex - hex value to be converted to bigint
 * @returns {bigint} - bigint representation of the hex value
 */
export function hexToBigInt(hex: string): bigint {
  // Strangely bigint.toString(16) gives a hex string without 0x
  // but it won't accept the same string without 0x to convert
  // to a bigint (BigInt(hex string)). So have to introduce this
  // check to convert to add 0x in case if hex string
  // doesn't have it.
  if (hex.slice(0, 2) === '0x') {
    return BigInt(hex);
  }
  return BigInt('0x' + hex);
}

/**
 * Check if base58 decoded string is equale to length
 *
 * @param {string} value - string to be checked
 * @param {number} length - expected decoded length
 * @return {boolean} if the string can decoded as base58 and match the expected length
 */

export function isBase58(value: string, length: number): boolean {
  try {
    return !!value && bs58.decode(value).length === length;
  } catch (e) {
    return false;
  }
}

/**
 * Returns a Uint8Array of the given hex string
 *
 * @param {string} str - the hex string to be converted
 * @returns {string} - the Uint8Array value
 */
export function toUint8Array(str: string): Uint8Array {
  return hex.decode(str);
}
