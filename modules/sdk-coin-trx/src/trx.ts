/**
 * @prettier
 */
import * as bip32 from 'bip32';
import * as secp256k1 from 'secp256k1';
import { randomBytes } from 'crypto';
import { CoinFamily, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { networks } from '@bitgo/utxo-lib';
import * as request from 'superagent';
import {
  BaseCoin,
  BitGoBase,
  common,
  getBip32Keys,
  getIsKrsRecovery,
  getIsUnsignedSweep,
  KeyPair,
  MethodNotImplementedError,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  TransactionExplanation,
  TransactionFee,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionRecipient as Recipient,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { Interface, Utils, WrappedBuilder } from './lib';
import { getBuilder } from './lib/builder';

export const MINIMUM_TRON_MSIG_TRANSACTION_FEE = 1e6;

export interface TronSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TxInfo {
  recipients: Recipient[];
  from: string;
  txid: string;
}

export interface TronTransactionExplanation extends TransactionExplanation {
  expiration: number;
  timestamp: number;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
  txInfo: TxInfo;
  feeInfo: TransactionFee;
}

export interface ExplainTransactionOptions {
  txHex?: string; // txHex is poorly named here; it is just a wrapped JSON object
  halfSigned?: {
    txHex: string; // txHex is poorly named here; it is just a wrapped JSON object
  };
  feeInfo: TransactionFee;
}

export interface RecoveryOptions {
  userKey: string; // Box A
  backupKey: string; // Box B
  bitgoKey: string; // Box C - this is bitgo's xpub and will be used to derive their root address
  recoveryDestination: string; // base58 address
  krsProvider?: string;
  walletPassphrase?: string;
}

export interface RecoveryTransaction {
  tx: TransactionPrebuild;
  recoveryAmount: number;
}

export enum NodeTypes {
  Full,
  Solidity,
}

/**
 * This structure is not a complete model of the AccountResponse from a node.
 */
export interface AccountResponse {
  address: string;
  balance: number;
  owner_permission: {
    keys: [Interface.PermissionKey];
  };
  active_permission: [{ keys: [Interface.PermissionKey] }];
}

export class Trx extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  getChain() {
    return this._staticsCoin.name;
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName() {
    return this._staticsCoin.fullName;
  }

  getBaseFactor() {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /** @inheritdoc */
  transactionDataAllowed() {
    return true;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Trx(bitgo, staticsCoin);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /**
   * Checks if this is a valid base58 or hex address
   * @param address
   */
  isValidAddress(address: string): boolean {
    if (!address) {
      return false;
    }
    return this.isValidHexAddress(address) || Utils.isBase58Address(address);
  }

  /**
   * Checks if this is a valid hex address
   * @param address hex address
   */
  isValidHexAddress(address: string): boolean {
    return address.length === 42 && /^(0x)?([0-9a-f]{2})+$/i.test(address);
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    // TODO: move this and address creation logic to account-lib
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256 bit chain code, both of which must be
      // random. 512 bits is therefore the maximum entropy and gives us maximum security against cracking.
      seed = randomBytes(512 / 8);
    }
    const hd = bip32.fromSeed(seed);
    return {
      pub: hd.neutered().toBase58(),
      prv: hd.toBase58(),
    };
  }

  isValidXpub(xpub: string): boolean {
    try {
      return bip32.fromBase58(xpub).isNeutered();
    } catch (e) {
      return false;
    }
  }

  isValidPub(pub: string): boolean {
    if (this.isValidXpub(pub)) {
      // xpubs can be converted into regular pubs, so technically it is a valid pub
      return true;
    }
    return new RegExp('^04[a-zA-Z0-9]{128}$').test(pub);
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  isWalletAddress(params: VerifyAddressOptions): boolean {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param params.wallet.addressVersion {String} this is the version of the Algorand multisig address generation format
   * @returns Bluebird<SignedTransaction>
   */
  async signTransaction(params: TronSignTransactionOptions): Promise<SignedTransaction> {
    const txBuilder = getBuilder(this.getChain()).from(params.txPrebuild.txHex);
    txBuilder.sign({ key: params.prv });
    const transaction = await txBuilder.build();
    const response = {
      txHex: JSON.stringify(transaction.toJson()),
    };
    if (transaction.toJson().signature.length >= 2) {
      return response;
    }
    // Half signed transaction
    return {
      halfSigned: response,
    };
  }

  /**
   * Return boolean indicating whether input is valid seed for the coin
   *
   * @param prv - the prv to be checked
   */
  isValidXprv(prv: string): boolean {
    try {
      return !bip32.fromBase58(prv).isNeutered();
    } catch {
      return false;
    }
  }

  /**
   * Convert a message to string in hexadecimal format.
   *
   * @param message {Buffer|String} message to sign
   * @return the message as a hexadecimal string
   */
  toHexString(message: string | Buffer): string {
    if (typeof message === 'string') {
      return Buffer.from(message).toString('hex');
    } else if (Buffer.isBuffer(message)) {
      return message.toString('hex');
    } else {
      throw new Error('Invalid messaged passed to signMessage');
    }
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const toSign = this.toHexString(message);

    let prv: string | undefined = key.prv;
    if (this.isValidXprv(prv)) {
      prv = bip32.fromBase58(prv).privateKey?.toString('hex');
    }

    if (!prv) {
      throw new Error('no privateKey');
    }
    let sig = Utils.signString(toSign, prv, true);

    // remove the preceding 0x
    sig = sig.replace(/^0x/, '');

    return Buffer.from(sig, 'hex');
  }

  /**
   * Converts an xpub to a uncompressed pub
   * @param xpub
   */
  xpubToUncompressedPub(xpub: string): string {
    if (!this.isValidXpub(xpub)) {
      throw new Error('invalid xpub');
    }

    const publicKey = bip32.fromBase58(xpub, networks.bitcoin).publicKey;
    return Buffer.from(secp256k1.publicKeyConvert(publicKey, false /* compressed */)).toString('hex');
  }

  /**
   * Modify prebuild before sending it to the server.
   * @param buildParams The whitelisted parameters for this prebuild
   */
  async getExtraPrebuildParams(buildParams: any): Promise<any> {
    if (buildParams.recipients[0].data && buildParams.feeLimit) {
      buildParams.recipients[0].feeLimit = buildParams.feeLimit;
    }
  }

  pubToHexAddress(pub: string): string {
    const byteArrayAddr = Utils.getByteArrayFromHexAddress(pub);
    const rawAddress = Utils.getRawAddressFromPubKey(byteArrayAddr);
    return Utils.getHexAddressFromByteArray(rawAddress);
  }

  xprvToCompressedPrv(xprv: string): string {
    if (!this.isValidXprv(xprv)) {
      throw new Error('invalid xprv');
    }

    const hdNode = bip32.fromBase58(xprv, networks.bitcoin);
    if (!hdNode.privateKey) {
      throw new Error('no privateKey');
    }
    return hdNode.privateKey.toString('hex');
  }

  /**
   * Make a query to Trongrid for information such as balance, token balance, solidity calls
   * @param query {Object} key-value pairs of parameters to append after /api
   * @returns {Object} response from Trongrid
   */
  private async recoveryPost(query: { path: string; jsonObj: any; node: NodeTypes }): Promise<any> {
    let nodeUri = '';
    switch (query.node) {
      case NodeTypes.Full:
        nodeUri = common.Environments[this.bitgo.getEnv()].tronNodes.full;
        break;
      case NodeTypes.Solidity:
        nodeUri = common.Environments[this.bitgo.getEnv()].tronNodes.solidity;
        break;
      default:
        throw new Error('node type not found');
    }

    const response = await request
      .post(nodeUri + query.path)
      .type('json')
      .send(query.jsonObj);

    if (!response.ok) {
      throw new Error('could not reach Tron node');
    }

    // unfortunately, it doesn't look like most TRON nodes return valid json as body
    return JSON.parse(response.text);
  }

  /**
   * Query our explorer for the balance of an address
   * @param address {String} the address encoded in hex
   * @returns {BigNumber} address balance
   */
  private async getAccountFromNode(address: string): Promise<AccountResponse> {
    return await this.recoveryPost({
      path: '/walletsolidity/getaccount',
      jsonObj: { address },
      node: NodeTypes.Solidity,
    });
  }

  /**
   * Retrieves our build transaction from a node.
   * @param toAddr hex-encoded address
   * @param fromAddr hex-encoded address
   * @param amount
   */
  private async getBuildTransaction(
    toAddr: string,
    fromAddr: string,
    amount: number
  ): Promise<Interface.TransactionReceipt> {
    // our addresses should be base58, we'll have to encode to hex
    return await this.recoveryPost({
      path: '/wallet/createtransaction',
      jsonObj: {
        to_address: toAddr,
        owner_address: fromAddr,
        amount,
      },
      node: NodeTypes.Full,
    });
  }

  /**
   * Throws an error if any keys in the ownerKeys collection don't match the keys array we pass
   * @param ownerKeys
   * @param keys
   */
  checkPermissions(ownerKeys: { address: string; weight: number }[], keys: string[]) {
    keys = keys.map((k) => k.toUpperCase());

    ownerKeys.map((key) => {
      const hexKey = key.address.toUpperCase();
      if (!keys.includes(hexKey)) {
        throw new Error(`pub address ${hexKey} not found in account`);
      }

      if (key.weight !== 1) {
        throw new Error('owner permission is invalid for this structure');
      }
    });
  }

  /**
   * Builds a funds recovery transaction without BitGo.
   * We need to do three queries during this:
   * 1) Node query - how much money is in the account
   * 2) Build transaction - build our transaction for the amount
   * 3) Send signed build - send our signed build to a public node
   * @param params
   */
  async recover(params: RecoveryOptions): Promise<RecoveryTransaction> {
    const isKrsRecovery = getIsKrsRecovery(params);
    const isUnsignedSweep = getIsUnsignedSweep(params);

    if (!this.isValidAddress(params.recoveryDestination)) {
      throw new Error('Invalid destination address!');
    }

    // get our user, backup keys
    const keys = getBip32Keys(this.bitgo, params, { requireBitGoXpub: false });

    // we need to decode our bitgoKey to a base58 address
    const bitgoHexAddr = this.pubToHexAddress(this.xpubToUncompressedPub(params.bitgoKey));
    const recoveryAddressHex = Utils.getHexAddressFromBase58Address(params.recoveryDestination);

    // call the node to get our account balance
    const account = await this.getAccountFromNode(bitgoHexAddr);
    const recoveryAmount = account.balance;

    const userXPub = keys[0].neutered().toBase58();
    const userXPrv = keys[0].toBase58();
    const backupXPub = keys[1].neutered().toBase58();

    // construct the tx -
    // there's an assumption here being made about fees: for a wallet that hasn't been used in awhile, the implication is
    // it has maximum bandwidth. thus, a recovery should cost the minimum amount (1e6 sun or 1 Tron)
    if (MINIMUM_TRON_MSIG_TRANSACTION_FEE > recoveryAmount) {
      throw new Error('Amount of funds to recover wouldnt be able to fund a send');
    }
    const recoveryAmountMinusFees = recoveryAmount - MINIMUM_TRON_MSIG_TRANSACTION_FEE;
    const buildTx = await this.getBuildTransaction(recoveryAddressHex, bitgoHexAddr, recoveryAmountMinusFees);

    const keyHexAddresses = [
      this.pubToHexAddress(this.xpubToUncompressedPub(userXPub)),
      this.pubToHexAddress(this.xpubToUncompressedPub(backupXPub)),
      bitgoHexAddr,
    ];

    // run checks to ensure this is a valid tx - permissions match our signer keys
    this.checkPermissions(account.owner_permission.keys, keyHexAddresses);
    this.checkPermissions(account.active_permission[0].keys, keyHexAddresses);

    // construct our tx
    const txBuilder = (getBuilder(this.getChain()) as WrappedBuilder).from(buildTx);

    // this tx should be enough to drop into a node
    if (isUnsignedSweep) {
      return {
        tx: (await txBuilder.build()).toJson(),
        recoveryAmount: recoveryAmountMinusFees,
      };
    }

    const userPrv = this.xprvToCompressedPrv(userXPrv);

    txBuilder.sign({ key: userPrv });

    // krs recoveries don't get signed
    if (!isKrsRecovery) {
      const backupXPrv = keys[1].toBase58();
      const backupPrv = this.xprvToCompressedPrv(backupXPrv);

      txBuilder.sign({ key: backupPrv });
    }

    return {
      tx: (await txBuilder.build()).toJson(),
      recoveryAmount: recoveryAmountMinusFees,
    };
  }

  /**
   * Explain a Tron transaction from txHex
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TronTransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }
    const txBuilder = getBuilder(this.getChain()).from(txHex);
    const tx = await txBuilder.build();
    const outputs = [
      {
        amount: tx.outputs[0].value.toString(),
        address: tx.outputs[0].address, // Should turn it into a readable format, aka base58
      },
    ];

    const displayOrder = [
      'id',
      'outputAmount',
      'changeAmount',
      'outputs',
      'changeOutputs',
      'fee',
      'timestamp',
      'expiration',
    ];

    return {
      displayOrder,
      id: tx.id,
      outputs,
      outputAmount: outputs[0].amount,
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account base does not make change
      fee: params.feeInfo,
      timestamp: tx.validFrom,
      expiration: tx.validTo,
    };
  }
}
