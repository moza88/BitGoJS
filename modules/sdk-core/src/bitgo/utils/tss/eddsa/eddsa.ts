/**
 * @prettier
 */
import * as bs58 from 'bs58';
import * as crypto from 'crypto';
import * as openpgp from 'openpgp';
import { Ed25519BIP32 } from '../../../../account-lib/mpc/hdTree';
import Eddsa from '../../../../account-lib/mpc/tss';
import { IRequestTracer } from '../../../../api';
import { AddKeychainOptions, Keychain, KeyType } from '../../../keychain';
import { encryptText, getBitgoGpgPubKey, createShareProof } from '../../opengpgUtils';
import {
  createUserSignShare,
  createUserToBitGoGShare,
  getBitgoToUserRShare,
  getTxRequest,
  offerUserToBitgoRShare,
  sendUserToBitgoGShare,
  SigningMaterial,
} from '../../../tss';
import { TxRequest } from '../baseTypes';
import { KeyShare, YShare } from './types';
import baseTSSUtils from '../baseTSSUtils';
import { KeychainsTriplet } from '../../../baseCoin';
/**
 * Utility functions for TSS work flows.
 */

export class EddsaUtils extends baseTSSUtils<KeyShare> {
  /**
   * Creates a Keychain containing the User's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's TSS key share
   * @param backupKeyShare - backup's TSS key share
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param passphrase - wallet passphrase used to encrypt user's signing materials
   * @param [originalPasscodeEncryptionCode] - optional encryption code needed for wallet password reset for hot wallets
   */
  async createUserKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    const MPC = await Eddsa.initialize();
    const bitgoKeyShares = bitgoKeychain.keyShares;
    if (!bitgoKeyShares) {
      throw new Error('Missing BitGo key shares');
    }

    const bitGoToUserShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'user');
    if (!bitGoToUserShare) {
      throw new Error('Missing BitGo to User key share');
    }

    const bitGoToUserPrivateShare = await this.decryptPrivateShare(bitGoToUserShare.privateShare, userGpgKey);

    const bitgoToUser: YShare = {
      i: 1,
      j: 3,
      y: bitGoToUserShare.publicShare.slice(0, 64),
      u: bitGoToUserPrivateShare.slice(0, 64),
      chaincode: bitGoToUserPrivateShare.slice(64),
    };

    // TODO(BG-47170): use tss.createCombinedKey helper when signatures are supported
    const userCombined = MPC.keyCombine(userKeyShare.uShare, [backupKeyShare.yShares[1], bitgoToUser]);
    const commonKeychain = userCombined.pShare.y + userCombined.pShare.chaincode;
    if (commonKeychain !== bitgoKeychain.commonKeychain) {
      throw new Error('Failed to create user keychain - commonKeychains do not match.');
    }

    const userSigningMaterial: SigningMaterial = {
      uShare: userKeyShare.uShare,
      bitgoYShare: bitgoToUser,
      backupYShare: backupKeyShare.yShares[1],
    };

    const userKeychainParams: AddKeychainOptions = {
      source: 'user',
      keyType: 'tss' as KeyType,
      commonKeychain: bitgoKeychain.commonKeychain,
      encryptedPrv: this.bitgo.encrypt({ input: JSON.stringify(userSigningMaterial), password: passphrase }),
      originalPasscodeEncryptionCode,
    };

    return await this.baseCoin.keychains().add(userKeychainParams);
  }

  /**
   * Creates a Keychain containing the Backup party's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - User's TSS Keyshare
   * @param backupKeyShare - Backup's TSS Keyshare
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param passphrase - wallet passphrase used to encrypt user's signing materials
   */
  async createBackupKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string
  ): Promise<Keychain> {
    const MPC = await Eddsa.initialize();
    const bitgoKeyShares = bitgoKeychain.keyShares;
    if (!bitgoKeyShares) {
      throw new Error('Invalid bitgo keyshares');
    }

    const bitGoToBackupShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'backup');
    if (!bitGoToBackupShare) {
      throw new Error('Missing BitGo to User key share');
    }

    const bitGoToBackupPrivateShare = await this.decryptPrivateShare(bitGoToBackupShare.privateShare, userGpgKey);

    const bitgoToBackup: YShare = {
      i: 2,
      j: 3,
      y: bitGoToBackupShare.publicShare.slice(0, 64),
      u: bitGoToBackupPrivateShare.slice(0, 64),
      chaincode: bitGoToBackupPrivateShare.slice(64),
    };

    // TODO(BG-47170): use tss.createCombinedKey helper when signatures are supported
    const backupCombined = MPC.keyCombine(backupKeyShare.uShare, [userKeyShare.yShares[2], bitgoToBackup]);
    const commonKeychain = backupCombined.pShare.y + backupCombined.pShare.chaincode;
    if (commonKeychain !== bitgoKeychain.commonKeychain) {
      throw new Error('Failed to create backup keychain - commonKeychains do not match.');
    }

    const backupSigningMaterial: SigningMaterial = {
      uShare: backupKeyShare.uShare,
      bitgoYShare: bitgoToBackup,
      userYShare: userKeyShare.yShares[2],
    };
    const prv = JSON.stringify(backupSigningMaterial);

    return await this.baseCoin.keychains().createBackup({
      source: 'backup',
      keyType: 'tss',
      commonKeychain: bitgoKeychain.commonKeychain,
      prv: prv,
      encryptedPrv: this.bitgo.encrypt({ input: prv, password: passphrase }),
    });
  }

  /**
   * Creates a Keychain containing BitGo's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's TSS key share
   * @param backupKeyShare - backup's TSS key share
   */
  async createBitgoKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    enterprise?: string
  ): Promise<Keychain> {
    // TODO(BG-47170): use tss.encryptYShare helper when signatures are supported
    const userToBitgoPublicShare = Buffer.concat([
      Buffer.from(userKeyShare.uShare.y, 'hex'),
      Buffer.from(userKeyShare.uShare.chaincode, 'hex'),
    ]).toString('hex');
    const userToBitgoPrivateShare = Buffer.concat([
      Buffer.from(userKeyShare.yShares[3].u, 'hex'),
      Buffer.from(userKeyShare.yShares[3].chaincode, 'hex'),
    ]).toString('hex');
    const userToBitgoKeyShare = {
      publicShare: userToBitgoPublicShare,
      privateShare: userToBitgoPrivateShare,
      privateShareProof: await createShareProof(userGpgKey.privateKey, userToBitgoPrivateShare.slice(0, 64)),
    };

    const backupToBitgoPublicShare = Buffer.concat([
      Buffer.from(backupKeyShare.uShare.y, 'hex'),
      Buffer.from(backupKeyShare.uShare.chaincode, 'hex'),
    ]).toString('hex');
    const backupToBitgoPrivateShare = Buffer.concat([
      Buffer.from(backupKeyShare.yShares[3].u, 'hex'),
      Buffer.from(backupKeyShare.yShares[3].chaincode, 'hex'),
    ]).toString('hex');
    const backupToBitgoKeyShare = {
      publicShare: backupToBitgoPublicShare,
      privateShare: backupToBitgoPrivateShare,
      privateShareProof: await createShareProof(userGpgKey.privateKey, backupToBitgoPrivateShare.slice(0, 64)),
    };

    return await this.createBitgoKeychainInWP(
      userGpgKey,
      userToBitgoKeyShare,
      backupToBitgoKeyShare,
      'tss',
      enterprise
    );
  }

  /**
   * Creates User, Backup, and BitGo TSS Keychains.
   *
   * @param params.passphrase - passphrase used to encrypt signing materials created for User and Backup
   */
  async createKeychains(params: {
    passphrase: string;
    enterprise?: string;
    originalPasscodeEncryptionCode?: string;
  }): Promise<KeychainsTriplet> {
    const MPC = await Eddsa.initialize();
    const m = 2;
    const n = 3;

    const userKeyShare = MPC.keyShare(1, m, n);
    const backupKeyShare = MPC.keyShare(2, m, n);

    const randomHexString = crypto.randomBytes(12).toString('hex');

    // Allow generating secp256k1 key pairs
    openpgp.config.rejectCurves = new Set();
    const userGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: randomHexString,
          email: `user-${randomHexString}@${randomHexString}.com`,
        },
      ],
      curve: 'secp256k1',
    });

    const bitgoKeychain = await this.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare, params.enterprise);
    const userKeychainPromise = this.createUserKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase,
      params.originalPasscodeEncryptionCode
    );
    const backupKeychainPromise = this.createBackupKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase
    );
    const [userKeychain, backupKeychain] = await Promise.all([userKeychainPromise, backupKeychainPromise]);

    // create wallet
    const keychains = {
      userKeychain,
      backupKeychain,
      bitgoKeychain,
    };

    return keychains;
  }

  /**
   * Signs the transaction associated to the transaction request.
   *
   * @param txRequest - transaction request object or id
   * @param prv - decrypted private key
   * @param reqId - request id
   * @returns {Promise<TxRequest>} fully signed TxRequest object
   */
  async signTxRequest(params: {
    txRequest: string | TxRequest;
    prv: string;
    reqId: IRequestTracer;
  }): Promise<TxRequest> {
    let txRequestResolved: TxRequest;
    let txRequestId: string;

    const { txRequest, prv } = params;

    if (typeof txRequest === 'string') {
      txRequestResolved = await getTxRequest(this.bitgo, this.wallet.id(), txRequest);
      txRequestId = txRequestResolved.txRequestId;
    } else {
      txRequestResolved = txRequest;
      txRequestId = txRequest.txRequestId;
    }

    const hdTree = await Ed25519BIP32.initialize();
    const MPC = await Eddsa.initialize(hdTree);

    const userSigningMaterial: SigningMaterial = JSON.parse(prv);
    if (!userSigningMaterial.backupYShare) {
      throw new Error('Invalid user key - missing backupYShare');
    }

    const unsignedTx =
      txRequestResolved.apiVersion === 'full'
        ? txRequestResolved.transactions[0].unsignedTx
        : txRequestResolved.unsignedTxs[0];

    const signingKey = MPC.keyDerive(
      userSigningMaterial.uShare,
      [userSigningMaterial.bitgoYShare, userSigningMaterial.backupYShare],
      unsignedTx.derivationPath
    );

    const signablePayload = Buffer.from(unsignedTx.signableHex, 'hex');

    const userSignShare = await createUserSignShare(signablePayload, signingKey.pShare);

    const signerShare = signingKey.yShares[3].u + signingKey.yShares[3].chaincode;
    const bitgoGpgKey = await getBitgoGpgPubKey(this.bitgo);
    const encryptedSignerShare = await encryptText(signerShare, bitgoGpgKey);

    await offerUserToBitgoRShare(this.bitgo, this.wallet.id(), txRequestId, userSignShare, encryptedSignerShare);

    const bitgoToUserRShare = await getBitgoToUserRShare(this.bitgo, this.wallet.id(), txRequestId);

    const userToBitGoGShare = await createUserToBitGoGShare(
      userSignShare,
      bitgoToUserRShare,
      userSigningMaterial.backupYShare,
      userSigningMaterial.bitgoYShare,
      signablePayload
    );

    await sendUserToBitgoGShare(this.bitgo, this.wallet.id(), txRequestId, userToBitGoGShare);

    return await getTxRequest(this.bitgo, this.wallet.id(), txRequestId);
  }

  /**
   * Get the commonPub portion of the commonKeychain.
   *
   * @param {String} commonKeychain
   * @returns {string}
   */
  static getPublicKeyFromCommonKeychain(commonKeychain: string): string {
    if (commonKeychain.length !== 128) {
      throw new Error(`Invalid commonKeychain length, expected 128, got ${commonKeychain.length}`);
    }
    const commonPubHexStr = commonKeychain.slice(0, 64);
    return bs58.encode(Buffer.from(commonPubHexStr, 'hex'));
  }
}
/**
 * @deprecated - use EddsaUtils
 */
export const TssUtils = EddsaUtils;
