import * as assert from 'assert';
import {
  InscriptionOutputs,
  createPsbtForSingleInscriptionPassingTransaction,
  createPsbtFromOutputLayout,
  findOutputLayoutForWalletUnspents,
  WalletInputBuilder,
} from '../src/psbt';
import { isSatPoint, OutputLayout, toParameters } from '../src';
import { bitgo, networks, testutil } from '@bitgo/utxo-lib';

function assertValidPsbt(
  psbt: bitgo.UtxoPsbt,
  s: bitgo.WalletUnspentSigner<bitgo.RootWalletKeys>,
  expectedOutputs: number,
  expectedFee: bigint
) {
  psbt.signAllInputsHD(s.signer);
  psbt.signAllInputsHD(s.cosigner);
  psbt.finalizeAllInputs();
  assert.strictEqual(psbt.txOutputs.length, expectedOutputs);
  assert.strictEqual(psbt.getFee(), expectedFee);
}

describe('OutputLayout to PSBT conversion', function () {
  const network = networks.bitcoin;
  const walletKeys = testutil.getDefaultWalletKeys();
  const signer = bitgo.WalletUnspentSigner.from(walletKeys, walletKeys.user, walletKeys.bitgo);
  const inscriptionRecipient = bitgo.outputScripts.createOutputScript2of3(
    walletKeys.deriveForChainAndIndex(0, 0).publicKeys,
    'p2sh'
  ).scriptPubKey;
  const walletUnspent = testutil.mockWalletUnspent(network, BigInt(20_000), { keys: walletKeys });
  const inputBuilder: WalletInputBuilder = {
    walletKeys,
    signer: 'user',
    cosigner: 'bitgo',
  };
  const outputs: InscriptionOutputs = {
    changeOutputs: [
      { chain: 40, index: 0 },
      { chain: 40, index: 1 },
    ],
    inscriptionRecipient,
  };

  function testInscriptionTxWithLayout(layout: OutputLayout, expectedOutputs: number) {
    assertValidPsbt(
      createPsbtFromOutputLayout(network, inputBuilder, [walletUnspent], outputs, layout),
      signer,
      expectedOutputs,
      layout.feeOutput
    );
  }

  it('can convert zero-padding layout to psbt', function () {
    testInscriptionTxWithLayout(toParameters(BigInt(0), BigInt(19_800), BigInt(0), BigInt(200)), 1);
  });

  it('can convert start-padding layout to psbt', function () {
    testInscriptionTxWithLayout(toParameters(BigInt(1_000), BigInt(18_800), BigInt(0), BigInt(200)), 2);
  });

  it('can convert end-padding layout to psbt', function () {
    testInscriptionTxWithLayout(toParameters(BigInt(0), BigInt(18_800), BigInt(1_000), BigInt(200)), 2);
  });

  it('can convert double-padding layout to psbt', function () {
    testInscriptionTxWithLayout(toParameters(BigInt(1_000), BigInt(17_800), BigInt(1_000), BigInt(200)), 3);
  });

  it('finds layout with WalletUnspent with SatRange', function () {
    const satPoint = walletUnspent.id + ':0';
    assert(isSatPoint(satPoint));
    const layout = findOutputLayoutForWalletUnspents([walletUnspent], satPoint, outputs, {
      feeRateSatKB: 1000,
    });
    assert.deepStrictEqual(layout, {
      firstChangeOutput: BigInt(0),
      inscriptionOutput: BigInt(19659),
      secondChangeOutput: BigInt(0),
      feeOutput: BigInt(341),
    });
    const psbt = createPsbtFromOutputLayout(network, inputBuilder, [walletUnspent], outputs, layout);
    assertValidPsbt(psbt, signer, 1, BigInt(341));
    const psbt1 = createPsbtForSingleInscriptionPassingTransaction(
      network,
      inputBuilder,
      [walletUnspent],
      satPoint,
      outputs,
      {
        feeRateSatKB: 1000,
      }
    );
    assertValidPsbt(psbt1, signer, 1, BigInt(341));
    assert.strictEqual(
      psbt.extractTransaction().toBuffer().toString('hex'),
      psbt1.extractTransaction().toBuffer().toString('hex')
    );
  });
});
