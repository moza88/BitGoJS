import { AvalancheNetwork, BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import {
  BaseCoin,
  BitGoBase,
  KeyPair,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  SignedTransaction,
  ParseTransactionOptions,
  MethodNotImplementedError,
  BaseTransaction,
  InvalidTransactionError,
  FeeEstimateOptions,
  SigningError,
} from '@bitgo/sdk-core';
import * as AvaxpLib from './lib';
import { AvaxpSignTransactionOptions, TransactionFee, ExplainTransactionOptions } from './iface';
import _ from 'lodash';
import { BN, BinTools } from 'avalanche';

export class AvaxP extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new AvaxP(bitgo, staticsCoin);
  }

  getChain(): string {
    return this._staticsCoin.name;
  }
  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }
  getFullName(): string {
    return this._staticsCoin.fullName;
  }
  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  supportsStaking(): boolean {
    return true;
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    let totalAmount = new BN(0);
    const coinConfig = coins.get(this.getChain());
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }
    const transactionBuilder = new AvaxpLib.TransactionBuilderFactory(coinConfig).from(rawTx);
    const transaction = await transactionBuilder.build();
    const explainedTx = transaction.explainTransaction();

    if (txParams.recipients !== undefined) {
      const filteredRecipients = txParams.recipients?.map((recipient) => _.pick(recipient, ['address', 'amount']));
      const filteredOutputs = explainedTx.outputs.map((output: { address: string; amount: string; memo: string }) =>
        _.pick(output, ['address', 'amount'])
      );

      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      for (const recipients of txParams.recipients) {
        totalAmount = totalAmount.add(new BN(recipients.amount));
      }
      if (!totalAmount.eq(new BN(explainedTx.outputAmount))) {
        throw new Error('Tx total amount does not match with expected total amount field');
      }
    }
    return true;
  }

  verifyAddress(params: VerifyAddressOptions): boolean {
    const bintools = BinTools.getInstance();
    const address = bintools.parseAddress(params.address, 'P');
    return address !== undefined;
  }

  /**
   * Check if address is valid, then make sure it matches the root address.
   *
   * @param {VerifyAddressOptions} params address and rootAddress to verify
   */
  isWalletAddress(params: VerifyAddressOptions): boolean {
    return true;
  }
  /**
   * Generate Avaxp key pair
   *
   * @param {Buffer} seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new AvaxpLib.KeyPair({ seed }) : new AvaxpLib.KeyPair();
    const keys = keyPair.getKeys();

    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }

    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {string} pub the prv to be checked
   * @returns is it valid?
   */
  isValidPub(pub: string): boolean {
    try {
      new AvaxpLib.KeyPair({ pub });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param {string} prv the prv to be checked
   * @returns is it valid?
   */
  isValidPrv(prv: string): boolean {
    try {
      new AvaxpLib.KeyPair({ prv });
      return true;
    } catch (e) {
      return false;
    }
  }

  isValidAddress(address: string): boolean {
    return AvaxpLib.Utils.isValidAddress(address);
  }

  /**
   * Signs Avaxp transaction
   */
  async signTransaction(params: AvaxpSignTransactionOptions): Promise<SignedTransaction> {
    // deserialize raw transaction (note: fromAddress has onchain order)
    const txBuilder = this.getBuilder().from(params.txPrebuild.txHex);
    const key = params.prv;

    // push the keypair to signer array
    txBuilder.sign({ key });

    // build the transaction
    const transaction: BaseTransaction = await txBuilder.build();
    if (!transaction) {
      throw new InvalidTransactionError('Error while trying to build transaction');
    }
    return transaction.signature.length >= 2
      ? { txHex: transaction.toBroadcastFormat() }
      : { halfSigned: { txHex: transaction.toBroadcastFormat() } };
  }

  async feeEstimate(params: FeeEstimateOptions): Promise<TransactionFee> {
    // staking transactions are fee-less
    return { fee: '0' };
  }

  parseTransaction(params: ParseTransactionOptions): Promise<ParseTransactionOptions> {
    throw new MethodNotImplementedError('parseTransaction method not implemented');
  }

  /**
   * Explain a Avaxp transaction from txHex
   * @param params
   * @param callback
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<AvaxpLib.TransactionExplanation> {
    const txHex = params.txHex ?? params?.halfSigned?.txHex;
    if (!txHex) {
      throw new Error('missing transaction hex');
    }
    try {
      const txBuilder = this.getBuilder().from(txHex);
      const tx = await txBuilder.build();
      return tx.explainTransaction();
    } catch (e) {
      throw new Error(`Invalid transaction: ${e.message}`);
    }
  }

  recoverySignature(message: Buffer, signature: Buffer): Buffer {
    return AvaxpLib.Utils.recoverySignature(this._staticsCoin.network as AvalancheNetwork, message, signature);
  }

  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const prv = new AvaxpLib.KeyPair(key).getPrivateKey();
    if (!prv) {
      throw new SigningError('Invalid key pair options');
    }
    if (typeof message === 'string') {
      message = Buffer.from(message, 'hex');
    }
    return AvaxpLib.Utils.createSignature(this._staticsCoin.network as AvalancheNetwork, message, prv);
  }

  private getBuilder(): AvaxpLib.TransactionBuilderFactory {
    return new AvaxpLib.TransactionBuilderFactory(coins.get(this.getChain()));
  }
}
