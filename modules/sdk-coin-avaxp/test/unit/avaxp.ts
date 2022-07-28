import * as AvaxpLib from '../../src/lib';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { AvaxP, TavaxP } from '../../src/';
import { randomBytes } from 'crypto';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';
import * as testData from '../resources/avaxp';
import { Utils as KeyPairUtils } from '../../src/lib/utils';
import { KeyPair } from '../../src/lib/keyPair';
import { Buffer as BufferAvax } from 'avalanche';
import * as _ from 'lodash';

import { HalfSignedAccountTransaction, TransactionType } from '@bitgo/sdk-core';

describe('Avaxp', function () {
  const coinName = 'avaxp';
  const tcoinName = 't' + coinName;
  let bitgo: TestBitGoAPI;
  let basecoin;
  let newTxPrebuild;
  let newTxParams;

  const txPrebuild = {
    txHex: testData.ADDVALIDATOR_SAMPLES.unsignedTxHex,
    txInfo: {},
  };

  const txParams = {
    recipients: [
      {
        address: testData.ADDVALIDATOR_SAMPLES.nodeID,
        amount: testData.ADDVALIDATOR_SAMPLES.minValidatorStake,
      },
    ],
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister(coinName, AvaxP.createInstance);
    bitgo.safeRegister(tcoinName, TavaxP.createInstance);
    basecoin = bitgo.coin(tcoinName);
    newTxPrebuild = () => {
      return _.cloneDeep(txPrebuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin(tcoinName);
    localBasecoin.should.be.an.instanceof(TavaxP);

    localBasecoin = bitgo.coin(coinName);
    localBasecoin.should.be.an.instanceof(AvaxP);
  });

  it('should return ' + tcoinName, function () {
    basecoin.getChain().should.equal(tcoinName);
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet Avalanche P-Chain');
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
    });

    it('should generate a keypair from a seed', function () {
      const seedText = testData.SEED_ACCOUNT.seed;
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);
      keyPair.pub.should.equal(testData.SEED_ACCOUNT.publicKey);
      keyPair.prv.should.equal(testData.SEED_ACCOUNT.privateKey);
    });

    it('should validate a public key', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });

    it('should validate a private key', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPrv(keyPair.prv).should.equal(true);
    });
  });

  describe('Sign Transaction', () => {
    const factory = new AvaxpLib.TransactionBuilderFactory(coins.get(tcoinName));

    it('build and sign a transaction in regular mode', async () => {
      const recoveryMode = false;
      const txBuilder = new AvaxpLib.TransactionBuilderFactory(coins.get(tcoinName))
        .getValidatorBuilder()
        .threshold(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.threshold)
        .locktime(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.locktime)
        .recoverMode(recoveryMode)
        .fromPubKey(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.bitgoAddresses)
        .startTime(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.startTime)
        .endTime(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.endTime)
        .stakeAmount(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.stakeAmount)
        .delegationFeeRate(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.delegationFeeRate)
        .nodeID(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.nodeId)
        .memo(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.memo)
        .utxos(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.utxos);
      const tx = await txBuilder.build();

      let txHex = tx.toBroadcastFormat();
      txHex.should.equal(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.unsignedRawTxNonRecovery);

      const privateKey = recoveryMode
        ? testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.backupPrivateKey
        : testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.userPrivateKey;

      const params = {
        txPrebuild: {
          txHex: tx.toBroadcastFormat(),
        },
        prv: privateKey,
      };

      const halfSignedTransaction = await basecoin.signTransaction(params);
      txHex = (halfSignedTransaction as HalfSignedAccountTransaction)?.halfSigned?.txHex;
      txHex.should.equal(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.halfSignedRawTxNonRecovery);
    });
    it('build and sign a transaction in recovery mode', async () => {
      const recoveryMode = true;
      const txBuilder = new AvaxpLib.TransactionBuilderFactory(coins.get(tcoinName))
        .getValidatorBuilder()
        .threshold(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.threshold)
        .locktime(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.locktime)
        .recoverMode(recoveryMode)
        .fromPubKey(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.bitgoAddresses)
        .startTime(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.startTime)
        .endTime(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.endTime)
        .stakeAmount(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.stakeAmount)
        .delegationFeeRate(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.delegationFeeRate)
        .nodeID(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.nodeId)
        .memo(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.memo)
        .utxos(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.utxos);
      const tx = await txBuilder.build();

      let txHex = tx.toBroadcastFormat();
      txHex.should.equal(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.unsignedRawtxRecovery);

      const privateKey = recoveryMode
        ? testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.backupPrivateKey
        : testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.userPrivateKey;

      const params = {
        txPrebuild: {
          txHex: tx.toBroadcastFormat(),
        },
        prv: privateKey,
      };

      const halfSignedTransaction = await basecoin.signTransaction(params);
      txHex = (halfSignedTransaction as HalfSignedAccountTransaction)?.halfSigned?.txHex;
      txHex.should.equal(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.halfSignedRawTxRecovery);
    });

    it('should be rejected if invalid key', async () => {
      const invalidPrivateKey = 'AAAAA';
      const builder = factory.from(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);

      const tx = await builder.build();
      const params = {
        txPrebuild: {
          txHex: tx.toBroadcastFormat(),
        },
        prv: invalidPrivateKey,
      };

      await basecoin.signTransaction(params).should.be.rejected();
    });
    it('should return the same mainnet address', () => {
      const utils = new KeyPairUtils();
      const xprv = testData.SEED_ACCOUNT.xPrivateKey;
      const kp1 = new KeyPair({ prv: xprv });
      const addressBuffer1 = kp1.getAddressBuffer();
      const address1 = utils.addressToString('avax', 'P', BufferAvax.from(addressBuffer1));

      const kp2 = new KeyPair({ prv: xprv });
      const addressBuffer2 = kp2.getAddressSafeBuffer();
      const address2 = utils.addressToString('avax', 'P', BufferAvax.from(addressBuffer2));

      const kp3 = new KeyPair({ prv: xprv });
      const address3 = kp3.getAvaxPAddress('avax');

      address1.should.equal(address2);
      address1.should.equal(address3);
    });
    it('should return the same testnet address', () => {
      const utils = new KeyPairUtils();
      const xprv = testData.SEED_ACCOUNT.xPrivateKey;
      const kp1 = new KeyPair({ prv: xprv });
      const addressBuffer1 = kp1.getAddressBuffer();
      const address1 = utils.addressToString('fuji', 'P', BufferAvax.from(addressBuffer1));

      const kp2 = new KeyPair({ prv: xprv });
      const addressBuffer2 = kp2.getAddressSafeBuffer();
      const address2 = utils.addressToString('fuji', 'P', BufferAvax.from(addressBuffer2));

      const kp3 = new KeyPair({ prv: xprv });
      const address3 = kp3.getAvaxPAddress('fuji');

      address1.should.equal(address2);
      address1.should.equal(address3);
    });
    it('should not be the same address from same key', () => {
      const utils = new KeyPairUtils();
      const kp1 = new KeyPair({ prv: testData.ACCOUNT_1.privkey });
      const addressBuffer1 = kp1.getAddressBuffer();
      const address1 = utils.addressToString('avax', 'P', BufferAvax.from(addressBuffer1));

      const kp2 = new KeyPair({ prv: testData.ACCOUNT_1.privkey });
      const addressBuffer2 = kp2.getAddressSafeBuffer();
      const address2 = utils.addressToString('fuji', 'P', BufferAvax.from(addressBuffer2));

      address1.should.not.equal(address2);
    });
    it('should not be the same address from different keys', () => {
      const utils = new KeyPairUtils();
      const kp1 = new KeyPair({ prv: testData.ACCOUNT_1.privkey });
      const addressBuffer1 = kp1.getAddressBuffer();
      const address1 = utils.addressToString('avax', 'P', BufferAvax.from(addressBuffer1));

      const kp2 = new KeyPair({ prv: testData.ACCOUNT_3.privkey });
      const addressBuffer2 = kp2.getAddressSafeBuffer();
      const address2 = utils.addressToString('avax', 'P', BufferAvax.from(addressBuffer2));

      address1.should.not.equal(address2);
    });
  });

  describe('Sign Message', () => {
    it('should be performed', async () => {
      const keyPairToSign = new AvaxpLib.KeyPair();
      const prvKey = keyPairToSign.getPrivateKey();
      const keyPair = keyPairToSign.getKeys();
      const messageToSign = Buffer.from(randomBytes(32));
      const signature = await basecoin.signMessage(keyPair, messageToSign.toString('hex'));

      const verify = AvaxpLib.Utils.verifySignature(basecoin._staticsCoin.network, messageToSign, signature, prvKey!);
      verify.should.be.true();
    });

    it('should fail with missing private key', async () => {
      const keyPair = new AvaxpLib.KeyPair({
        pub: testData.SEED_ACCOUNT.publicKeyCb58,
      }).getKeys();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      await basecoin.signMessage(keyPair, messageToSign).should.be.rejectedWith('Invalid key pair options');
    });
  });

  describe('Explain Transaction', () => {
    it('should explain a half signed AddValidator transaction', async () => {
      const txExplain = await basecoin.explainTransaction({
        halfSigned: { txHex: testData.ADDVALIDATOR_SAMPLES.halfsigntxHex },
      });
      txExplain.outputAmount.should.equal(testData.ADDVALIDATOR_SAMPLES.minValidatorStake);
      txExplain.type.should.equal(TransactionType.addValidator);
      txExplain.outputs[0].address.should.equal(testData.ADDVALIDATOR_SAMPLES.nodeID);
      txExplain.changeOutputs[0].address.split(',').length.should.equal(3);
      txExplain.memo.should.equal(testData.ADDVALIDATOR_SAMPLES.memo);
    });

    it('should explain a signed AddValidator transaction', async () => {
      const txExplain = await basecoin.explainTransaction({ txHex: testData.ADDVALIDATOR_SAMPLES.fullsigntxHex });
      txExplain.outputAmount.should.equal(testData.ADDVALIDATOR_SAMPLES.minValidatorStake);
      txExplain.type.should.equal(TransactionType.addValidator);
      txExplain.outputs[0].address.should.equal(testData.ADDVALIDATOR_SAMPLES.nodeID);
      txExplain.changeOutputs[0].address.split(',').length.should.equal(3);
      txExplain.memo.should.equal(testData.ADDVALIDATOR_SAMPLES.memo);
    });

    it('should fail when a tx is not passed as parameter', async () => {
      await basecoin.explainTransaction({}).should.be.rejectedWith('missing transaction hex');
    });
  });

  describe('Verify Transaction', () => {
    it('should succeed to verify unsigned transaction', async () => {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
      isTransactionVerified.should.equal(true);
    });
    it('should succeed to verify signed transaction', async () => {
      const txPrebuild = {
        txHex: testData.ADDVALIDATOR_SAMPLES.fullsigntxHex,
        txInfo: {},
      };
      const txParams = newTxParams();
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
      isTransactionVerified.should.equal(true);
    });
    it('should fail verify transactions when have different recipients', async () => {
      const txPrebuild = newTxPrebuild();
      const txParams = {
        recipients: [
          {
            address: 'NodeID-EZ38CcWHoSyoEfAkDN9zaieJ5Yq64Yepy',
            amount: testData.ADDVALIDATOR_SAMPLES.minValidatorStake,
          },
        ],
      };
      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });
    it('should verify when input `recipients` is absent', async function () {
      const txParams = newTxParams();
      txParams.recipients = undefined;
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild });
      validTransaction.should.equal(true);
    });
    it('should succeed to verify transactions when recipients has extra data', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.data = 'data';

      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild });
      validTransaction.should.equal(true);
    });
  });

  describe('Validation', function () {
    it('should validate address', function () {
      const validAddress = 'P-fuji15jamwukfqkwhe8z26tjqxejtjd3jk9vj4kmxwa';
      basecoin.isValidAddress(validAddress).should.be.true();
    });

    it('should fail to validate invalid address', function () {
      const invalidAddresses = ['asdadsaaf', 'fuji15jamwukfqkwhe8z26tjqxejtjd3jk9vj4kmxwa'];

      for (const address of invalidAddresses) {
        basecoin.isValidAddress(address).should.be.false();
      }
    });
  });
});
