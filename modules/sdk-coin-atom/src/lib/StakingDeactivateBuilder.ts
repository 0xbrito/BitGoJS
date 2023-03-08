import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { undelegateMsgTypeUrl } from './constants';
import { DelegateOrUndelegeteMessage } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';

export class StakingDeactivateBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingDeactivate;
  }

  /** @inheritdoc */
  async buildImplementation(): Promise<Transaction> {
    this.transaction.atomTransaction = this.buildAtomTransaction();
    this.transaction.transactionType(this.transactionType);
    return this.transaction;
  }

  messages(undelegateMessages: DelegateOrUndelegeteMessage[]): this {
    this._messages = undelegateMessages.map((undelegateMessage) => {
      this.validateDelegateOrUndelegateMessage(undelegateMessage);
      return {
        typeUrl: undelegateMsgTypeUrl,
        value: undelegateMessage,
      };
    });
    return this;
  }
}
