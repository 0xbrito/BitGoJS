import assert from 'assert';
import { IInscription, TapScript } from './iInscription';
import { BitGoBase } from '../bitgoBase';
import { IWallet } from '../wallet';
// eslint-disable-next-line import/no-internal-modules
import {
  createInscriptionRevealData,
  PreparedInscriptionRevealData,
  signRevealTransaction,
} from '@bitgo/utxo-ord/dist/src/inscriptions';
import { Network, networks } from '@bitgo/utxo-lib';
import { KeyIndices } from '../keychain';
import { xprvToRawPrv } from '../../account-lib';
import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';

export class Inscription implements IInscription {
  private readonly bitgo: BitGoBase;
  private readonly wallet: IWallet;

  constructor(bitgo: BitGoBase, wallet: IWallet) {
    this.bitgo = bitgo;
    this.wallet = wallet;
  }

  async prepareReveal(
    inscriptionData: Buffer,
    contentType: string,
    feeRate: number
  ): Promise<PreparedInscriptionRevealData> {
    const user = await this.wallet.baseCoin.keychains().get({ id: this.wallet.keyIds()[KeyIndices.USER] });
    assert(user.pub);
    const pubkey = Buffer.from(user.pub);
    const network = (this.bitgo.coin(this.wallet.coin()) as unknown as AbstractUtxoCoin).network;

    return createInscriptionRevealData(pubkey, contentType, inscriptionData, network);
  }

  /**
   *
   * @param walletPassphrase
   * @param tapLeafScript
   * @param unsignedCommitTx
   * @param commitAddress
   * @param commitTxnHash
   * @param vout
   * @param unspents
   */
  async signAndSend(
    walletPassphrase: string,
    tapLeafScript: TapScript,
    unsignedCommitTx: string,
    commitAddress: string,
    commitTxnHash: string,
    vout: number,
    unspents: any[]
  ): Promise<any> {
    const userKeychain = await this.wallet.baseCoin.keychains().get({ id: this.wallet.keyIds()[KeyIndices.USER] });

    const xprv = await this.wallet.getUserPrv({ keychain: userKeychain, walletPassphrase });
    const prv = xprvToRawPrv(xprv);
    const network = (this.bitgo.coin(this.wallet.coin()) as unknown as AbstractUtxoCoin).network;

    const halfSignedCommitTransaction = this.wallet.signTransaction({
      txPrebuild: {
        txHex: unsignedCommitTx,
        txInfo: { unspents },
      },
    });
    console.log('halfSignedCommitTransaction ' + JSON.stringify(halfSignedCommitTransaction));

    const fullySignedRevealTransaction = await signRevealTransaction(
      Buffer.from(prv, 'hex'),
      tapLeafScript,
      commitAddress,
      commitTxnHash,
      vout,
      network
    );
    console.log('fullySignedRevealTransaction ' + JSON.stringify(fullySignedRevealTransaction));

    // TODO: submit the transactions
    // this.wallet.submitTransaction();
  }
}
