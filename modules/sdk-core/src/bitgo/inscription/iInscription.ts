// Module not found. WHY?????
// import { PreparedInscriptionRevealData } from '@bitgo/utxo-ord';
// eslint-disable-next-line import/no-internal-modules
import { PreparedInscriptionRevealData } from '@bitgo/utxo-ord/dist/src/inscriptions';
import { Network } from '@bitgo/utxo-lib';

export interface TapScript {
  leafVersion: number;
  script: Buffer;
  controlBlock: Buffer;
}

export interface IInscription {
  prepareReveal(inscriptionData: Buffer, contentType: string, feeRate: number): Promise<PreparedInscriptionRevealData>;
  // privateKey: Buffer, tapLeafScript: TapLeafScript, commitAddress: string, commitTxnHash: string, vout: number, network: Network): Transaction<bigint>;

  signAndSend(
    walletPassphrase: string,
    tapLeafScript: TapScript,
    unsignedCommitTx: string,
    commitAddress,
    commitTxnHash: string,
    vout: number,
    unspents: any[]
  ): Promise<any>;
}
