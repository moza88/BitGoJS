import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  TransactionType,
  BuildTransactionError,
  BaseTransaction,
} from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { BN, Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import { DecodedUtxoObj } from './iface';
import { AddDelegatorTx, Tx } from 'avalanche/dist/apis/platformvm';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  public _signer: KeyPair[] = [];
  protected recoverSigner = false;

  /**
   * When using recovery key must be set here
   * TODO: STLX-17317 recovery key signing
   * @param recoverSigner
   */
  public recoverMode(recoverSigner = true): this {
    this.recoverSigner = recoverSigner;
    return this;
  }

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  threshold(value: number): this {
    this.validateThreshold(value);
    this._transaction._threshold = value;
    return this;
  }

  locktime(value: string | number): this {
    this.validateLocktime(new BN(value));
    this._transaction._locktime = new BN(value);
    return this;
  }

  fromPubKey(senderPubKey: string | string[]): this {
    const pubKeys = senderPubKey instanceof Array ? senderPubKey : [senderPubKey];
    this._transaction._fromAddresses = pubKeys.map(utils.parseAddress);
    return this;
  }

  rewardAddresses(address: string | string[]): this {
    const rewardAddresses = address instanceof Array ? address : [address];
    this._transaction._rewardAddresses = rewardAddresses.map(utils.parseAddress);
    return this;
  }

  utxos(value: DecodedUtxoObj[]): this {
    this.validateUtxos(value);
    this._transaction._utxos = value;
    return this;
  }
  /**
   *
   * @param value Optional Buffer for the memo
   * @returns value Buffer for the memo
   * set using Buffer.from("message")
   */
  memo(value: string): this {
    this._transaction._memo = utils.stringToBuffer(value);
    return this;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Tx): this {
    const baseTx = tx.getUnsignedTx().getTransaction();
    if (
      baseTx.getNetworkID() !== this._transaction._networkID ||
      !baseTx.getBlockchainID().equals(this._transaction._blockchainID)
    ) {
      throw new Error('Network or blockchain is not equals');
    }
    this._transaction._memo = baseTx.getMemo();

    // good assumption: addresses that unlock the outputs, will also be used to sign the transaction
    // so pick the first utxo as the from address
    const utxo = baseTx.getOuts()[0];

    if (!utxo.getAssetID().equals(this._transaction._assetId)) {
      throw new Error('AssetID are not equals');
    }
    const secpOut = utxo.getOutput();
    this._transaction._locktime = secpOut.getLocktime();
    this._transaction._threshold = secpOut.getThreshold();
    this._transaction._fromAddresses = secpOut.getAddresses();
    this._transaction._rewardAddresses = (baseTx as AddDelegatorTx).getRewardOwners().getOutput().getAddresses();
    this._transaction.setTransaction(tx);
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new Tx();
    tx.fromBuffer(BufferAvax.from(rawTransaction, 'hex'));
    this.initBuilder(tx);
    return this.transaction;
  }

  get hasSigner(): boolean {
    return this._signer !== undefined && this._signer.length > 0;
  }
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.buildAvaxpTransaction();
    this.transaction.setTransactionType(this.transactionType);
    if (this.hasSigner) {
      this._signer.forEach((keyPair) => this.transaction.sign(keyPair));
    }
    return this.transaction;
  }

  /**
   * Builds the avaxp transaction. transaction field is changed.
   */
  protected abstract buildAvaxpTransaction(): void;

  // region Getters and Setters
  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  protected signImplementation({ key }: BaseKey): BaseTransaction {
    this._signer.push(new KeyPair({ prv: key }));
    return this.transaction;
  }

  protected abstract get transactionType(): TransactionType;

  // endregion

  // region Validators

  /**
   * Validates the threshold
   * @param threshold
   */
  validateThreshold(threshold: number): void {
    if (!threshold || threshold !== 2) {
      throw new BuildTransactionError('Invalid transaction: threshold must be set to 2');
    }
  }

  /**
   * Validates locktime
   * @param locktime
   */
  validateLocktime(locktime: BN): void {
    if (!locktime || locktime.lt(new BN(0))) {
      throw new BuildTransactionError('Invalid transaction: locktime must be 0 or higher');
    }
  }

  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address');
    }
  }

  /** @inheritdoc */
  validateKey({ key }: BaseKey): void {
    if (!new KeyPair({ prv: key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   * It overrides abstract method from BaseTransactionBuilder
   *
   * @param rawTransaction Transaction in any format
   */
  validateRawTransaction(rawTransaction: string): void {
    utils.validateRawTransaction(rawTransaction);
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    // throw new NotImplementedError('validateTransaction not implemented');
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  validateUtxos(values: DecodedUtxoObj[]): void {
    if (values.length === 0) {
      throw new BuildTransactionError("Utxos can't be empty array");
    }
    values.forEach(this.validateUtxo);
  }

  validateUtxo(value: DecodedUtxoObj): void {
    ['outputID', 'amount', 'txid', 'outputidx'].forEach((field) => {
      if (!value.hasOwnProperty(field)) throw new BuildTransactionError(`Utxos required ${field}`);
    });
  }

  // endregion
}
