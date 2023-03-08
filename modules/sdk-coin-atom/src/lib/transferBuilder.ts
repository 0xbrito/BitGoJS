import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { sendMsgTypeUrl } from './constants';
import { SendMessage } from './iface';
import { TransactionBuilder } from './transactionBuilder';

export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  messages(sendMessages: SendMessage[]): this {
    this._messages = sendMessages.map((sendMessage) => {
      this.validateSendMessage(sendMessage);
      return {
        typeUrl: sendMsgTypeUrl,
        value: sendMessage,
      };
    });
    return this;
  }
}
