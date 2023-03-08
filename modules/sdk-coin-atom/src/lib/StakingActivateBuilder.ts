import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { delegateMsgTypeUrl } from './constants';
import { DelegateOrUndelegeteMessage } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';

export class StakingActivateBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  /** @inheritdoc */
  async buildImplementation(): Promise<Transaction> {
    this.transaction.atomTransaction = this.buildAtomTransaction();
    this.transaction.transactionType(this.transactionType);
    return this.transaction;
  }

  messages(delegateMessages: DelegateOrUndelegeteMessage[]): this {
    this._messages = delegateMessages.map((delegateMessage) => {
      this.validateDelegateOrUndelegateMessage(delegateMessage);
      return {
        typeUrl: delegateMsgTypeUrl,
        value: delegateMessage,
      };
    });
    return this;
  }
}
