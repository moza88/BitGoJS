import {
  CreateAccountParams,
  DelegateStakeParams,
  InitializeStakeParams,
  StakeInstruction,
  SystemInstruction,
  TransactionInstruction,
} from '@solana/web3.js';

import { TransactionType, NotSupported } from '@bitgo/sdk-core';
import {
  InstructionBuilderTypes,
  ValidInstructionTypesEnum,
  walletInitInstructionIndexes,
  ataInitInstructionIndexes,
} from './constants';
import {
  AtaInit,
  InstructionParams,
  WalletInit,
  Transfer,
  Nonce,
  Memo,
  StakingActivate,
  StakingDeactivate,
  StakingWithdraw,
  TokenTransfer,
} from './iface';
import { getInstructionType } from './utils';
import { decodeTransferCheckedInstruction } from './tokenEncodeDecode';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import assert from 'assert';
import { coins, SolCoin } from '@bitgo/statics';

/**
 * Construct instructions params from Solana instructions
 *
 * @param {TransactionType} type - the transaction type
 * @param {TransactionInstruction[]} instructions - solana instructions
 * @returns {InstructionParams[]} An array containing instruction params
 */
export function instructionParamsFactory(
  type: TransactionType,
  instructions: TransactionInstruction[]
): InstructionParams[] {
  switch (type) {
    case TransactionType.WalletInitialization:
      return parseWalletInitInstructions(instructions);
    case TransactionType.Send:
      return parseSendInstructions(instructions);
    case TransactionType.StakingActivate:
      return parseStakingActivateInstructions(instructions);
    case TransactionType.StakingDeactivate:
      return parseStakingDeactivateInstructions(instructions);
    case TransactionType.StakingWithdraw:
      return parseStakingWithdrawInstructions(instructions);
    case TransactionType.AssociatedTokenAccountInitialization:
      return parseAtaInitInstructions(instructions);
    default:
      throw new NotSupported('Invalid transaction, transaction type not supported: ' + type);
  }
}

/**
 * Parses Solana instructions to Wallet initialization tx instructions params
 *
 * @param {TransactionInstruction[]} instructions - containing create and initialize nonce solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for Wallet initialization tx
 */
function parseWalletInitInstructions(instructions: TransactionInstruction[]): Array<WalletInit | Memo> {
  const instructionData: Array<WalletInit | Memo> = [];
  const createInstruction = SystemInstruction.decodeCreateAccount(instructions[walletInitInstructionIndexes.Create]);
  const nonceInitInstruction = SystemInstruction.decodeNonceInitialize(
    instructions[walletInitInstructionIndexes.InitializeNonceAccount]
  );

  const walletInit: WalletInit = {
    type: InstructionBuilderTypes.CreateNonceAccount,
    params: {
      fromAddress: createInstruction.fromPubkey.toString(),
      nonceAddress: nonceInitInstruction.noncePubkey.toString(),
      authAddress: nonceInitInstruction.authorizedPubkey.toString(),
      amount: createInstruction.lamports.toString(),
    },
  };
  instructionData.push(walletInit);

  const memo = getMemo(instructions, walletInitInstructionIndexes);
  if (memo) {
    instructionData.push(memo);
  }

  return instructionData;
}

/**
 * Parses Solana instructions to Send tx instructions params
 * Only supports Memo, Transfer and Advance Nonce Solana instructions
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for Send tx
 */
function parseSendInstructions(instructions: TransactionInstruction[]): Array<Nonce | Memo | Transfer | TokenTransfer> {
  const instructionData: Array<Nonce | Memo | Transfer | TokenTransfer> = [];
  for (const instruction of instructions) {
    const type = getInstructionType(instruction);
    switch (type) {
      case ValidInstructionTypesEnum.Memo:
        const memo: Memo = { type: InstructionBuilderTypes.Memo, params: { memo: instruction.data.toString() } };
        instructionData.push(memo);
        break;
      case ValidInstructionTypesEnum.AdvanceNonceAccount:
        const advanceNonceInstruction = SystemInstruction.decodeNonceAdvance(instruction);
        const nonce: Nonce = {
          type: InstructionBuilderTypes.NonceAdvance,
          params: {
            walletNonceAddress: advanceNonceInstruction.noncePubkey.toString(),
            authWalletAddress: advanceNonceInstruction.authorizedPubkey.toString(),
          },
        };
        instructionData.push(nonce);
        break;
      case ValidInstructionTypesEnum.Transfer:
        const transferInstruction = SystemInstruction.decodeTransfer(instruction);
        const transfer: Transfer = {
          type: InstructionBuilderTypes.Transfer,
          params: {
            fromAddress: transferInstruction.fromPubkey.toString(),
            toAddress: transferInstruction.toPubkey.toString(),
            amount: transferInstruction.lamports.toString(),
          },
        };
        instructionData.push(transfer);
        break;
      case ValidInstructionTypesEnum.TokenTransfer:
        const tokenTransferInstruction = decodeTransferCheckedInstruction(instruction, TOKEN_PROGRAM_ID);
        const tokenName = findTokenName(tokenTransferInstruction.keys.mint.pubkey.toString());
        const tokenTransfer: TokenTransfer = {
          type: InstructionBuilderTypes.TokenTransfer,
          params: {
            fromAddress: tokenTransferInstruction.keys.owner.pubkey.toString(),
            toAddress: tokenTransferInstruction.keys.destination.pubkey.toString(),
            amount: tokenTransferInstruction.data.amount.toString(),
            tokenName,
            sourceAddress: tokenTransferInstruction.keys.source.pubkey.toString(),
          },
        };
        instructionData.push(tokenTransfer);
        break;
      default:
        throw new NotSupported(
          'Invalid transaction, instruction type not supported: ' + getInstructionType(instruction)
        );
    }
  }
  return instructionData;
}

/**
 * Parses Solana instructions to create staking tx and delegate tx instructions params
 * Only supports Nonce, StakingActivate and Memo Solana instructions
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for staking activate tx
 */
function parseStakingActivateInstructions(
  instructions: TransactionInstruction[]
): Array<Nonce | StakingActivate | Memo> {
  const instructionData: Array<Nonce | StakingActivate | Memo> = [];
  const stakingInstructions = {} as StakingInstructions;
  for (const instruction of instructions) {
    const type = getInstructionType(instruction);
    switch (type) {
      case ValidInstructionTypesEnum.AdvanceNonceAccount:
        const advanceNonceInstruction = SystemInstruction.decodeNonceAdvance(instruction);
        const nonce: Nonce = {
          type: InstructionBuilderTypes.NonceAdvance,
          params: {
            walletNonceAddress: advanceNonceInstruction.noncePubkey.toString(),
            authWalletAddress: advanceNonceInstruction.authorizedPubkey.toString(),
          },
        };
        instructionData.push(nonce);
        break;

      case ValidInstructionTypesEnum.Memo:
        const memo: Memo = { type: InstructionBuilderTypes.Memo, params: { memo: instruction.data.toString() } };
        instructionData.push(memo);
        break;

      case ValidInstructionTypesEnum.Create:
        stakingInstructions.create = SystemInstruction.decodeCreateAccount(instruction);
        break;

      case ValidInstructionTypesEnum.StakingInitialize:
        stakingInstructions.initialize = StakeInstruction.decodeInitialize(instruction);
        break;

      case ValidInstructionTypesEnum.StakingDelegate:
        stakingInstructions.delegate = StakeInstruction.decodeDelegate(instruction);
        break;
    }
  }

  validateStakingInstructions(stakingInstructions);
  const stakingActivate: StakingActivate = {
    type: InstructionBuilderTypes.StakingActivate,
    params: {
      fromAddress: stakingInstructions.create?.fromPubkey.toString() || '',
      stakingAddress: stakingInstructions.initialize?.stakePubkey.toString() || '',
      amount: stakingInstructions.create?.lamports.toString() || '',
      validator: stakingInstructions.delegate?.votePubkey.toString() || '',
    },
  };
  instructionData.push(stakingActivate);

  return instructionData;
}

interface StakingInstructions {
  create?: CreateAccountParams;
  initialize?: InitializeStakeParams;
  delegate?: DelegateStakeParams;
}

function validateStakingInstructions(stakingInstructions: StakingInstructions) {
  if (!stakingInstructions.create) {
    throw new NotSupported('Invalid staking activate transaction, missing create stake account instruction');
  } else if (!stakingInstructions.initialize) {
    throw new NotSupported('Invalid staking activate transaction, missing initialize stake account instruction');
  } else if (!stakingInstructions.delegate) {
    throw new NotSupported('Invalid staking activate transaction, missing delegate instruction');
  }
}

/**
 * Parses Solana instructions to create deactivate tx instructions params
 * Only supports Nonce, StakingDeactivate, and Memo Solana instructions
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for staking deactivate tx
 */
function parseStakingDeactivateInstructions(
  instructions: TransactionInstruction[]
): Array<Nonce | StakingDeactivate | Memo> {
  const instructionData: Array<Nonce | StakingDeactivate | Memo> = [];
  for (const instruction of instructions) {
    const type = getInstructionType(instruction);
    switch (type) {
      case ValidInstructionTypesEnum.AdvanceNonceAccount:
        const advanceNonceInstruction = SystemInstruction.decodeNonceAdvance(instruction);
        const nonce: Nonce = {
          type: InstructionBuilderTypes.NonceAdvance,
          params: {
            walletNonceAddress: advanceNonceInstruction.noncePubkey.toString(),
            authWalletAddress: advanceNonceInstruction.authorizedPubkey.toString(),
          },
        };
        instructionData.push(nonce);
        break;

      case ValidInstructionTypesEnum.Memo:
        const memo: Memo = {
          type: InstructionBuilderTypes.Memo,
          params: { memo: instruction.data.toString() },
        };
        instructionData.push(memo);
        break;

      case ValidInstructionTypesEnum.StakingDeactivate:
        const deactivateInstruction = StakeInstruction.decodeDeactivate(instruction);
        const stakingDeactivate: StakingDeactivate = {
          type: InstructionBuilderTypes.StakingDeactivate,
          params: {
            fromAddress: deactivateInstruction.authorizedPubkey.toString(),
            stakingAddress: deactivateInstruction.stakePubkey.toString(),
          },
        };
        instructionData.push(stakingDeactivate);
        break;
    }
  }
  return instructionData;
}

/**
 * Parses Solana instructions to create staking  withdraw tx instructions params
 * Only supports Nonce, StakingWithdraw, and Memo Solana instructions
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for staking withdraw tx
 */
function parseStakingWithdrawInstructions(
  instructions: TransactionInstruction[]
): Array<Nonce | StakingWithdraw | Memo> {
  const instructionData: Array<Nonce | StakingWithdraw | Memo> = [];
  for (const instruction of instructions) {
    const type = getInstructionType(instruction);
    switch (type) {
      case ValidInstructionTypesEnum.AdvanceNonceAccount:
        const advanceNonceInstruction = SystemInstruction.decodeNonceAdvance(instruction);
        const nonce: Nonce = {
          type: InstructionBuilderTypes.NonceAdvance,
          params: {
            walletNonceAddress: advanceNonceInstruction.noncePubkey.toString(),
            authWalletAddress: advanceNonceInstruction.authorizedPubkey.toString(),
          },
        };
        instructionData.push(nonce);
        break;

      case ValidInstructionTypesEnum.Memo:
        const memo: Memo = {
          type: InstructionBuilderTypes.Memo,
          params: { memo: instruction.data.toString() },
        };
        instructionData.push(memo);
        break;

      case ValidInstructionTypesEnum.StakingWithdraw:
        const withdrawInstruction = StakeInstruction.decodeWithdraw(instruction);
        const stakingWithdraw: StakingWithdraw = {
          type: InstructionBuilderTypes.StakingWithdraw,
          params: {
            fromAddress: withdrawInstruction.authorizedPubkey.toString(),
            stakingAddress: withdrawInstruction.stakePubkey.toString(),
            amount: withdrawInstruction.lamports.toString(),
          },
        };
        instructionData.push(stakingWithdraw);
        break;
    }
  }

  return instructionData;
}

/**
 * Get the memo object from instructions if it exists
 *
 * @param {TransactionInstruction[]} instructions - the array of supported Solana instructions to be parsed
 * @param {Record<string, number>} instructionIndexes - the instructions indexes of the current transaction
 * @returns {Memo | undefined} - memo object or undefined
 */
function getMemo(instructions: TransactionInstruction[], instructionIndexes: Record<string, number>): Memo | undefined {
  const instructionsLength = Object.keys(instructionIndexes).length;
  if (instructions.length === instructionsLength && instructions[instructionIndexes.Memo]) {
    return {
      type: InstructionBuilderTypes.Memo,
      params: { memo: instructions[instructionIndexes.Memo].data.toString() },
    };
  }
}

const ataInitInstructionKeysIndexes = {
  PayerAddress: 0,
  ATAAddress: 1,
  OwnerAddress: 2,
  MintAddress: 3,
};

/**
 * Parses Solana instructions to initialize associated token account tx instructions params
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for Send tx
 */
function parseAtaInitInstructions(instructions: TransactionInstruction[]): Array<AtaInit | Memo> {
  const instructionData: Array<AtaInit | Memo> = [];
  const ataInitInstruction = instructions[ataInitInstructionIndexes.InitializeAssociatedTokenAccount];

  const mintAddress = ataInitInstruction.keys[ataInitInstructionKeysIndexes.MintAddress].pubkey.toString();
  const tokenName = findTokenName(mintAddress);

  const ataInit: AtaInit = {
    type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
    params: {
      mintAddress,
      ataAddress: ataInitInstruction.keys[ataInitInstructionKeysIndexes.ATAAddress].pubkey.toString(),
      ownerAddress: ataInitInstruction.keys[ataInitInstructionKeysIndexes.OwnerAddress].pubkey.toString(),
      payerAddress: ataInitInstruction.keys[ataInitInstructionKeysIndexes.PayerAddress].pubkey.toString(),
      tokenName,
    },
  };
  instructionData.push(ataInit);

  if (instructions.length === 2 && instructions[ataInitInstructionIndexes.Memo]) {
    const memo: Memo = {
      type: InstructionBuilderTypes.Memo,
      params: { memo: instructions[ataInitInstructionIndexes.Memo].data.toString() },
    };
    instructionData.push(memo);
  }
  return instructionData;
}

function findTokenName(mintAddress: string): string {
  let token: string | undefined;

  coins.forEach((value, key) => {
    if (value instanceof SolCoin && value.tokenAddress === mintAddress) {
      token = value.name;
    }
  });

  assert(token);

  return token;
}
