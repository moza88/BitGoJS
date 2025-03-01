import { EnvironmentName, IRequestTracer, V1Network } from '@bitgo/sdk-core';
import { ECPair } from '@bitgo/utxo-lib';

export interface BitGoAPIOptions {
  accessToken?: string;
  authVersion?: 2 | 3;
  customBitcoinNetwork?: V1Network;
  customRootURI?: string;
  customSigningAddress?: string;
  clientId?: string;
  clientSecret?: string;
  env?: EnvironmentName;
  etherscanApiToken?: string;
  hmacVerification?: boolean;
  proxy?: string;
  refreshToken?: string;
  serverXpub?: string;
  stellarFederationServerUrl?: string;
  useProduction?: boolean;
  userAgent?: string;
  validate?: boolean;
}

export interface AccessTokenOptions {
  accessToken: string;
}

export interface PingOptions {
  reqId?: IRequestTracer;
}

export const supportedRequestMethods = ['get', 'post', 'put', 'del', 'patch'] as const;

export interface CalculateHmacSubjectOptions {
  urlPath: string;
  text: string;
  timestamp: number;
  method: typeof supportedRequestMethods[number];
  statusCode?: number;
}

export interface CalculateRequestHmacOptions {
  url: string;
  text: string;
  timestamp: number;
  token: string;
  method: typeof supportedRequestMethods[number];
}

export interface RequestHeaders {
  hmac: string;
  timestamp: number;
  tokenHash: string;
}

export interface CalculateRequestHeadersOptions {
  url: string;
  text: string;
  token: string;
  method: typeof supportedRequestMethods[number];
}

export interface VerifyResponseOptions extends CalculateRequestHeadersOptions {
  hmac: string;
  url: string;
  text: string;
  timestamp: number;
  method: typeof supportedRequestMethods[number];
  statusCode?: number;
}

export interface VerifyResponseInfo {
  isValid: boolean;
  expectedHmac: string;
  signatureSubject: string;
  isInResponseValidityWindow: boolean;
  verificationTime: number;
}

export interface AuthenticateOptions {
  username: string;
  password: string;
  otp?: string;
  trust?: number;
  forceSMS?: boolean;
  extensible?: boolean;
  forceV1Auth?: boolean;
}

export interface ProcessedAuthenticationOptions {
  email: string;
  password: string;
  forceSMS: boolean;
  otp?: string;
  trust?: number;
  extensible?: boolean;
  extensionAddress?: string;
  forceV1Auth?: boolean;
}

export interface User {
  username: string;
}

export interface BitGoJson {
  user?: User;
  token?: string;
  extensionKey?: string;
  ecdhXprv?: string;
}

export interface VerifyPasswordOptions {
  password?: string;
}

export interface TokenIssuanceResponse {
  derivationPath: string;
  encryptedToken: string;
  encryptedECDHXprv?: string;
}

export interface TokenIssuance {
  token: string;
  ecdhXprv?: string;
}

export interface AddAccessTokenOptions {
  label: string;
  otp?: string;
  duration?: number;
  ipRestrict?: string[];
  txValueLimit?: number;
  scope: string[];
}

export interface RemoveAccessTokenOptions {
  id?: string;
  label?: string;
}

export interface GetUserOptions {
  id: string;
}

export interface UnlockOptions {
  otp?: string;
  duration?: number;
}
export interface ExtendTokenOptions {
  duration?: string;
}

/**
 * @deprecated
 */
export interface DeprecatedVerifyAddressOptions {
  address?: string;
}

export interface SplitSecretOptions {
  seed: string;
  passwords: string[];
  m: number;
}

export interface SplitSecret {
  xpub: string;
  m: number;
  n: number;
  seedShares: any;
}

export interface ReconstituteSecretOptions {
  shards: string[];
  passwords: string[];
}

export interface ReconstitutedSecret {
  xpub: string;
  xprv: string;
  seed: string;
}

export interface VerifyShardsOptions {
  shards: string[];
  passwords: string[];
  m: number;
  xpub: string;
}

export interface GetEcdhSecretOptions {
  otherPubKeyHex: string;
  eckey: ECPair.ECPairInterface;
}

export interface ChangePasswordOptions {
  oldPassword: string;
  newPassword: string;
}

/**
 * @deprecated
 */
export interface EstimateFeeOptions {
  numBlocks?: number;
  maxFee?: number;
  inputs?: string[];
  txSize?: number;
  cpfpAware?: boolean;
}

/**
 * @deprecated
 */
export interface WebhookOptions {
  url: string;
  type: string;
}

export interface ListWebhookNotificationsOptions {
  prevId?: string;
  limit?: number;
}

export interface BitGoSimulateWebhookOptions {
  webhookId: string;
  blockId: string;
}

export interface AuthenticateWithAuthCodeOptions {
  authCode: string;
}

/**
 * @deprecated
 */
export interface VerifyPushTokenOptions {
  pushVerificationToken: string;
}

/**
 * @deprecated
 */
export interface RegisterPushTokenOptions {
  pushToken: unknown;
  operatingSystem: unknown;
}
