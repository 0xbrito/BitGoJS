import { TransactionExplanation as BaseTransactionExplanation, TransactionType } from '@bitgo/sdk-core';
import { Coin } from '@cosmjs/stargate';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
}

export interface MessageData {
  typeUrl: string;
  value: SendMessage | DelegateOrUndelegeteMessage | WithdrawDelegatorRewardsMessage;
}

export interface SendMessage {
  fromAddress: string;
  toAddress: string;
  amount: Coin[];
}

export interface DelegateOrUndelegeteMessage {
  delegatorAddress: string;
  validatorAddress: string;
  amount: Coin[];
}

export interface WithdrawDelegatorRewardsMessage {
  delegatorAddress: string;
  validatorAddress: string;
}

export interface FeeData {
  amount: Coin[];
  gasLimit: number;
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData extends AtomTransaction {
  id?: string;
}

export interface AtomTransaction {
  type: TransactionType;
  signerAddress: string;
  sequence: number;
  sendMessages: MessageData[];
  gasBudget: FeeData;
  accountNumber?: number;
  chainId?: string;
  publicKey?: string;
}
