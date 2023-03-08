import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { withdrawDelegatorRewardMsgTypeUrl } from './constants';
import { WithdrawDelegatorRewardsMessage } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';

export class StakingWithdrawRewardsBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingWithdraw;
  }

  /** @inheritdoc */
  async buildImplementation(): Promise<Transaction> {
    this.transaction.atomTransaction = this.buildAtomTransaction();
    this.transaction.transactionType(this.transactionType);
    return this.transaction;
  }

  messages(withdrawRewardsMessages: WithdrawDelegatorRewardsMessage[]): this {
    this._messages = withdrawRewardsMessages.map((withdrawRewardsMessage) => {
      this.validateWithdrawRewardsMessage(withdrawRewardsMessage);
      return {
        typeUrl: withdrawDelegatorRewardMsgTypeUrl,
        value: withdrawRewardsMessage,
      };
    });
    return this;
  }
}
