import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Coin } from '@cosmjs/stargate';
import assert from 'assert';
import BigNumber from 'bignumber.js';

import { validDenoms } from './constants';
import {
  AtomTransaction,
  DelegateOrUndelegeteMessage,
  FeeData,
  MessageData,
  SendMessage,
  WithdrawDelegatorRewardsMessage,
} from './iface';
import { Transaction } from './transaction';
import utils from './utils';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  private _signatures: Signature[] = [];

  protected _signerAddress: string;
  protected _sequence: number;
  protected _messages: MessageData[];
  protected _gasBudget: FeeData;
  private _accountNumber?: number;
  private _chainId?: string;
  private _publicKey?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  // get and set region
  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push({ publicKey, signature });
    this.transaction.addSignature(publicKey, signature);
  }

  /**
   * Sets the signerAddress of this transaction.
   * This account will be responsible for paying transaction fees.
   *
   * @param {string} signerAddress the account that is sending this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  signerAddress(signerAddress: string): this {
    if (!utils.isValidAddress(signerAddress)) {
      throw new Error('transactionBuilder: sender isValidAddress check failed :' + signerAddress);
    }
    this._signerAddress = signerAddress;
    return this;
  }

  /**
   * Sets gas budget of this transaction
   * Gas budget consist of fee amount and gas limit. Division feeAmount/gasLimit represents
   * the gas-fee and it should be more than minimum required gas-fee to process the transaction
   *
   * @param {FeeData} gasBudget
   * @returns {TransactionBuilder} this transaction builder
   */
  gasBudget(gasBudget: FeeData): this {
    this.validateGasBudget(gasBudget);
    this._gasBudget = gasBudget;
    return this;
  }

  /**
   * Sets sequence of this transaction.
   *
   * @param {number} sequence - sequence data for tx signer
   * @returns {TransactionBuilder} This transaction builder
   */
  sequence(sequence: number): this {
    this.validateSequence(sequence);
    this._sequence = sequence;
    return this;
  }

  /**
   * Sets messages to the transaction body. Message type will be different based on the transaction type
   * - For @see TransactionType.StakingActivate required type is @see DelegateOrUndelegeteMessage
   * - For @see TransactionType.StakingDeactivate required type is @see DelegateOrUndelegeteMessage
   * - For @see TransactionType.Send required type is @see SendMessage
   * - For @see TransactionType.StakingWithdraw required type is @see WithdrawDelegatorRewardsMessage
   * @param {(SendMessage | DelegateOrUndelegeteMessage | WithdrawDelegatorRewardsMessage)[]} messages
   * @returns {TransactionBuilder} This transaction builder
   */
  abstract messages(messages: (SendMessage | DelegateOrUndelegeteMessage | WithdrawDelegatorRewardsMessage)[]): this;

  publicKey(publicKey: string | undefined): this {
    this._publicKey = publicKey;
    return this;
  }

  accountNumber(accountNumber: number | undefined): this {
    this._accountNumber = accountNumber;
    return this;
  }

  chainId(chainId: string | undefined): this {
    this._chainId = chainId;
    return this;
  }
  /**
   * Initialize the transaction builder fields using the decoded transaction data
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this._transaction = tx;
    const txData = tx.toJson();
    this.gasBudget(txData.gasBudget);
    this.signerAddress(txData.signerAddress);
    this.messages(
      txData.sendMessages.map((message) => {
        return message.value;
      })
    );
    this.gasBudget(txData.gasBudget);
    this.sequence(txData.sequence);
    this.publicKey(txData.publicKey);
    this.accountNumber(txData.accountNumber);
    this.chainId(txData.chainId);
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    this.validateRawTransaction(rawTransaction);
    const tx = Transaction.fromRawTransaction(rawTransaction, this._coinConfig);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.atomTransaction = this.buildAtomTransaction();
    this.transaction.transactionType(this.transactionType);
    return this.transaction;
  }

  protected buildAtomTransaction(): AtomTransaction {
    assert(this._signerAddress, new BuildTransactionError('signerAddress is required before building'));
    assert(this._sequence >= 0, new BuildTransactionError('sequence is required before building'));
    assert(this._messages, new BuildTransactionError('sendMessages are required before building'));
    assert(this._gasBudget, new BuildTransactionError('gasPrice is required before building'));
    assert(this._publicKey, new BuildTransactionError('publicKey is required before building'));

    return {
      type: this.transactionType,
      signerAddress: this._signerAddress,
      sequence: this._sequence,
      sendMessages: this._messages,
      gasBudget: this._gasBudget,
      publicKey: this._publicKey,
      accountNumber: this._accountNumber,
      chainId: this._chainId,
    };
  }

  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('transactionBuilder: address isValidAddress check failed: ' + address.address);
    }
  }

  validateAmountData(amountArray: Coin[]): void {
    amountArray.forEach((coinAmount) => {
      const amount = BigNumber(coinAmount.amount);
      if (amount.isLessThanOrEqualTo(0)) {
        throw new BuildTransactionError('transactionBuilder: validateAmountData Invalid amount: ' + amount);
      }
      if (!validDenoms.find((denom) => denom === coinAmount.denom)) {
        throw new BuildTransactionError('transactionBuilder: validateAmountData Invalid denom: ' + coinAmount.denom);
      }
    });
  }

  validateGasBudget(gasBudget: FeeData): void {
    if (gasBudget.gasLimit <= 0) {
      throw new BuildTransactionError('Invalid gas limit ' + gasBudget.gasLimit);
    }
    this.validateAmountData(gasBudget.amount);
  }

  validateMessageData(messageData: MessageData): void {
    if (!messageData) {
      throw new BuildTransactionError(`Invalid MessageData: undefined`);
    }
    if (!messageData.typeUrl || !utils.getTransactionTypeFromTypeUrl(messageData.typeUrl)) {
      throw new BuildTransactionError(`Invalid MessageData typeurl: ` + messageData.typeUrl);
    }
    const type = utils.getTransactionTypeFromTypeUrl(messageData.typeUrl);
    if (type === TransactionType.Send) {
      const value = messageData.value as SendMessage;
      if (value.toAddress) {
        throw new BuildTransactionError(`Invalid MessageData value.toAddress: ` + value.toAddress);
      }
      if (value.fromAddress) {
        throw new BuildTransactionError(`Invalid MessageData value.fromAddress: ` + value.fromAddress);
      }
    } else if (
      type === TransactionType.StakingActivate ||
      type === TransactionType.StakingDeactivate ||
      type === TransactionType.StakingWithdraw
    ) {
      const value = messageData.value as DelegateOrUndelegeteMessage;
      if (value.validatorAddress) {
        throw new BuildTransactionError(`Invalid MessageData value.validatorAddress: ` + value.validatorAddress);
      }
      if (value.delegatorAddress) {
        throw new BuildTransactionError(`Invalid MessageData value.delegatorAddress: ` + value.delegatorAddress);
      }
    } else {
      throw new BuildTransactionError(`Invalid MessageData TypeUrl is not supported: ` + messageData.typeUrl);
    }
    if (type !== TransactionType.StakingWithdraw) {
      this.validateAmountData((messageData.value as SendMessage | DelegateOrUndelegeteMessage).amount);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    utils.validateRawTransaction(rawTransaction);
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    if (!transaction.atomTransaction) {
      return;
    }
    this.validateTransactionFields();
  }

  /**
   * Validates all fields are defined
   */
  private validateTransactionFields(): void {
    if (this._signerAddress === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing signerAddress');
    }
    if (this._sequence === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing sequence');
    }
    if (this._messages === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing sendMessages');
    }
    if (this._gasBudget === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing gas budget data');
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  protected validateDelegateOrUndelegateMessage(delegateMessage: DelegateOrUndelegeteMessage) {
    if (!delegateMessage.validatorAddress || !utils.isValidValidatorAddress(delegateMessage.validatorAddress)) {
      throw new BuildTransactionError(
        `Invalid DelegateOrUndelegeteMessage validatorAddress: ` + delegateMessage.validatorAddress
      );
    }
    if (!delegateMessage.delegatorAddress || !utils.isValidAddress(delegateMessage.delegatorAddress)) {
      throw new BuildTransactionError(
        `Invalid DelegateOrUndelegeteMessage delegatorAddress: ` + delegateMessage.delegatorAddress
      );
    }
    this.validateAmountData(delegateMessage.amount);
  }

  protected validateWithdrawRewardsMessage(withdrawRewardsMessage: WithdrawDelegatorRewardsMessage) {
    if (
      !withdrawRewardsMessage.validatorAddress ||
      !utils.isValidValidatorAddress(withdrawRewardsMessage.validatorAddress)
    ) {
      throw new BuildTransactionError(
        `Invalid WithdrawDelegatorRewardsMessage validatorAddress: ` + withdrawRewardsMessage.validatorAddress
      );
    }
    if (!withdrawRewardsMessage.delegatorAddress || !utils.isValidAddress(withdrawRewardsMessage.delegatorAddress)) {
      throw new BuildTransactionError(
        `Invalid WithdrawDelegatorRewardsMessage delegatorAddress: ` + withdrawRewardsMessage.delegatorAddress
      );
    }
  }

  protected validateSendMessage(sendMessage: SendMessage) {
    if (!sendMessage.toAddress || !utils.isValidAddress(sendMessage.toAddress)) {
      throw new BuildTransactionError(`Invalid SendMessage toAddress: ` + sendMessage.toAddress);
    }
    if (!sendMessage.fromAddress || !utils.isValidAddress(sendMessage.fromAddress)) {
      throw new BuildTransactionError(`Invalid SendMessage fromAddress: ` + sendMessage.fromAddress);
    }
    this.validateAmountData(sendMessage.amount);
  }

  private validateSequence(sequence: number) {
    if (sequence < 0) {
      throw new BuildTransactionError('Invalid sequence: less than zero');
    }
  }
}
