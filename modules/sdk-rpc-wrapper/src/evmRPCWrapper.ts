import { EVMRPCRequest, EVMRPCResult, EVMRPCTransactionOptions } from './types';
import {
  Wallet,
  WalletSignMessageOptions,
  WalletSignTypedDataOptions,
  SignTypedDataVersion,
  SendManyOptions,
} from '@bitgo/sdk-core';
import { hexStringToNumber } from '@bitgo/sdk-coin-eth';

export class EvmRPCWrapper {
  private wallet: Wallet;

  constructor(wallet: Wallet) {
    if (!wallet.baseCoin.isEVM()) {
      throw new Error(`${wallet.coin()} is not an EVM coin.`);
    }
    this.wallet = wallet;
  }

  /**
   * Handles RPC call from an EVM provider and invokes the appropriate BitGo SDK wallet method.
   *
   * @evmrpcRequest request
   * @evmrpcRequest walletPassphrase
   */
  async handleRPCCall(request: EVMRPCRequest, walletPassphrase: string): Promise<EVMRPCResult> {
    const { method, id, jsonrpc, params } = request;
    let result;

    switch (method) {
      case 'personal_sign':
        const walletSignMessageOptions: WalletSignMessageOptions = {
          message: {
            messageRaw: params[0],
          },
          walletPassphrase,
        };
        result = await this.wallet.signMessage(walletSignMessageOptions);
        break;
      case 'eth_signTypedData':
        const walletSignTypedDataOptions: WalletSignTypedDataOptions = {
          walletPassphrase,
          typedData: {
            typedDataRaw: params[0],
            version: SignTypedDataVersion.V4,
          },
        };
        result = await this.wallet.signTypedData(walletSignTypedDataOptions);
        break;

      case 'eth_sendTransaction':
        result = await this.sendTransaction(params[0] as unknown as EVMRPCTransactionOptions);
        break;
      default:
        throw new Error(`method '${method}' not yet implemented`);
    }

    return {
      id,
      jsonrpc,
      result,
    };
  }

  private async sendTransaction(options: EVMRPCTransactionOptions): Promise<any> {
    const { to: address, data, gasPrice: gasPriceHex, gasLimit: gasLimitHex, value: amount } = options;

    const sendManyOptions: SendManyOptions = {
      recipients: [
        {
          address,
          amount,
          data,
        },
      ],
      gasPrice: hexStringToNumber(gasPriceHex),
      gasLimit: hexStringToNumber(gasLimitHex),
    };
    return await this.wallet.sendMany(sendManyOptions);
  }
}
