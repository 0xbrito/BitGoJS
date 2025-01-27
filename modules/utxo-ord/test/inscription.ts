import * as assert from 'assert';
import { inscriptions } from '../src';
import { address, networks, ECPair } from '@bitgo/utxo-lib';

describe('inscriptions', () => {
  const contentType = 'text/plain';
  const pubKey = 'af455f4989d122e9185f8c351dbaecd13adca3eef8a9d38ef8ffed6867e342e3';
  const pubKeyBuffer = Buffer.from(pubKey, 'hex');

  describe('Inscription Output Script', () => {
    function testInscriptionScript(inscriptionData: Buffer, expectedScriptHex: string, expectedAddress: string) {
      const outputScript = inscriptions.createOutputScriptForInscription(pubKeyBuffer, contentType, inscriptionData);
      assert.strictEqual(outputScript.toString('hex'), expectedScriptHex);
      assert.strictEqual(address.fromOutputScript(outputScript, networks.testnet), expectedAddress);
    }

    it('should generate an inscription address', () => {
      const inscriptionData = Buffer.from('Never Gonna Give You Up', 'ascii');

      testInscriptionScript(
        inscriptionData,
        '5120e0db418d51573f593389816568e86f96b65cf474712d085b1b0461645639f2fb',
        'tb1purd5rr232ul4jvufs9jk36r0j6m9ear5wyksskcmq3skg43e7tasdjpqs4'
      );
    });

    it('should generate an inscription address when data length is > 520', () => {
      const inscriptionData = Buffer.from('Never Gonna Let You Down'.repeat(100), 'ascii');

      testInscriptionScript(
        inscriptionData,
        '51205cc628635e0d8fd0aab0547cc23c0a9e90f47c0c8b3348b0d394a62d2b8b63fb',
        'tb1ptnrzsc67pk8ap24s237vy0q2n6g0glqv3ve53vxnjjnz62utv0as70jae4'
      );
    });
  });

  describe('Inscription Reveal Data', () => {
    it('should sign reveal transaction and validate reveal size', () => {
      const ecPair = ECPair.makeRandom();
      const inscriptionData = Buffer.from('And Desert You', 'ascii');
      const { revealTransactionVSize, tapLeafScript, address } = inscriptions.createInscriptionRevealData(
        ecPair.publicKey,
        contentType,
        inscriptionData,
        networks.testnet
      );

      const randomHash = '96b2376fb0ccfdbcc9472489ca3ec75df1487b08a0ea8d9d82c55da19d8cceea';
      const fullySignedRevealTransaction = inscriptions.signRevealTransaction(
        ecPair.privateKey as Buffer,
        tapLeafScript,
        address,
        randomHash,
        2,
        networks.testnet
      );
      const actualVirtualSize = fullySignedRevealTransaction.virtualSize();

      assert.strictEqual(revealTransactionVSize, actualVirtualSize);
    });
  });
});
