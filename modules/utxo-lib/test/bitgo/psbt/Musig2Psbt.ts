import * as assert from 'assert';

import { getInternalChainCode, PSBT_PROPRIETARY_IDENTIFIER, scriptTypeForChain } from '../../../src/bitgo';

import { getDefaultWalletKeys } from '../../../src/testutil';
import {
  createTapInternalKey,
  createTapOutputKey,
  decodePsbtMusig2ParticipantsKeyValData,
  setMusig2Nonces,
} from '../../../src/bitgo/Musig2';
import { scriptTypes2Of3 } from '../../../src/bitgo/outputScripts';
import {
  constructPsbt,
  getUnspents,
  validateNoncesKeyVals,
  validateParticipantsKeyVals,
  validatePsbtP2trMusig2Input,
  validatePsbtP2trMusig2Output,
} from './PsbtMusig2Util';

describe('p2trMusig2 PSBT Test Suite', function () {
  const rootWalletKeys = getDefaultWalletKeys();
  const outputType = 'p2trMusig2';
  const CHANGE_INDEX = 100;

  describe('p2trMusig2 key path', function () {
    it(`psbt creation and nonce generation success`, function () {
      const unspents = getUnspents(scriptTypes2Of3.map((t) => t));
      const psbt = constructPsbt(unspents, 'user', 'bitgo', outputType);
      setMusig2Nonces(psbt, rootWalletKeys.user);
      setMusig2Nonces(psbt, rootWalletKeys.bitgo, Buffer.allocUnsafe(32));
      unspents.forEach((unspent, index) => {
        if (scriptTypeForChain(unspent.chain) !== 'p2trMusig2') {
          assert.strictEqual(psbt.getProprietaryKeyVals(index).length, 0);
          return;
        }
        validatePsbtP2trMusig2Input(psbt, index, unspent, 'keyPath');
        validatePsbtP2trMusig2Output(psbt, 0);
        validateParticipantsKeyVals(psbt, index, unspent);
        validateNoncesKeyVals(psbt, index, unspent);
      });
    });

    it(`nonce generation is skipped if tapInternalKey doesn't match participant pub keys agg`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      psbt.data.inputs[0].tapInternalKey = Buffer.allocUnsafe(32);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === 'tapInternalKey and aggregated participant pub keys does not match'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if sessionId size is invalid`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user, Buffer.allocUnsafe(33)),
        (e) => e.message === 'Invalid sessionId size 33'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonces generation fails if private key is missing`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user.neutered()),
        (e) => e.message === 'private key is required to generate nonce'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonces generation fails if tapBip32Derivation is missing`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      psbt.data.inputs[0].tapBip32Derivation = [];
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === 'tapBip32Derivation is required to create nonce'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if participant pub keys is missing`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      psbt.data.inputs[0].unknownKeyVals = [];
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === 'Found 0 matching participant key value instead of 1'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 0);
    });

    it(`nonce generation fails if participant pub keys keydata size is invalid`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);
      keyVals[0].key.keydata = Buffer.concat([keyVals[0].key.keydata, Buffer.from('dummy')]);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `Invalid keydata size ${keyVals[0].key.keydata.length} for participant pub keys`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if participant keydata tapOutputKey in invalid`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);
      keyVals[0].key.keydata = Buffer.concat([Buffer.allocUnsafe(32), keyVals[0].key.keydata.subarray(32)]);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `Invalid participants keydata tapOutputKey`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if participant keydata tapInternalKey in invalid`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);
      keyVals[0].key.keydata = Buffer.concat([keyVals[0].key.keydata.subarray(0, 32), Buffer.allocUnsafe(32)]);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `Invalid participants keydata tapInternalKey`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if tapInternalKey and aggregated participant pub keys don't match`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);

      const walletKeys = rootWalletKeys.deriveForChainAndIndex(getInternalChainCode('p2trMusig2'), 1);
      const tapInternalKey = createTapInternalKey([walletKeys.user.publicKey, walletKeys.bitgo.publicKey]);
      const tapOutputKey = createTapOutputKey(tapInternalKey, psbt.data.inputs[0].tapMerkleRoot!);

      keyVals[0].key.keydata = Buffer.concat([tapOutputKey, tapInternalKey]);
      keyVals[0].value = Buffer.concat([walletKeys.user.publicKey, walletKeys.bitgo.publicKey]);

      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `tapInternalKey and aggregated participant pub keys does not match`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if keydata size of participant pub keys is invalid`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);
      keyVals[0].key.keydata = Buffer.allocUnsafe(65);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `Invalid keydata size 65 for participant pub keys`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if valuedata size of participant pub keys is invalid`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);
      keyVals[0].value = Buffer.allocUnsafe(67);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `Invalid valuedata size 67 for participant pub keys`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if duplicate participant pub keys found`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);
      keyVals[0].value = Buffer.concat([keyVals[0].value.subarray(33), keyVals[0].value.subarray(33)]);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `Duplicate participant pub keys found`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonces generation fails if no fingerprint match`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      psbt.data.inputs[0].tapBip32Derivation?.forEach((bv) => (bv.masterFingerprint = Buffer.allocUnsafe(4)));
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === 'Need one tapBip32Derivation masterFingerprint to match the rootWalletKey fingerprint'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonces generation fails if rootWalletKey doesn't derive one tapBip32`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const walletKeys = rootWalletKeys.deriveForChainAndIndex(getInternalChainCode('p2trMusig2'), CHANGE_INDEX);
      psbt.data.inputs[0].tapBip32Derivation?.forEach((bv) => {
        bv.path = walletKeys.paths[2];
      });
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === 'root wallet key should derive one tapBip32Derivation'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if derived wallet key does not match any participant key`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);

      const walletKeys = rootWalletKeys.deriveForChainAndIndex(getInternalChainCode('p2trMusig2'), 1);
      const tapInternalKey = createTapInternalKey([walletKeys.user.publicKey, walletKeys.bitgo.publicKey]);
      psbt.data.inputs[0].tapInternalKey = tapInternalKey;

      keyVals[0].value = Buffer.concat([walletKeys.user.publicKey, walletKeys.bitgo.publicKey]);
      const tapOutputKey = createTapOutputKey(tapInternalKey, psbt.data.inputs[0].tapMerkleRoot!);
      keyVals[0].key.keydata = Buffer.concat([tapOutputKey, tapInternalKey]);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);

      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `participant plain pub key should match one tapBip32Derivation plain pub key`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });
  });

  describe('p2trMusig2 script path', function () {
    it(`psbt creation success and musig2 nonce generation skips`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      let psbt = constructPsbt(unspents, 'user', 'backup', outputType);
      setMusig2Nonces(psbt, rootWalletKeys.user);
      setMusig2Nonces(psbt, rootWalletKeys.backup);
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 0);
      validatePsbtP2trMusig2Input(psbt, 0, unspents[0], 'scriptPath');
      validatePsbtP2trMusig2Output(psbt, 0);

      psbt = constructPsbt(unspents, 'bitgo', 'backup', outputType);
      setMusig2Nonces(psbt, rootWalletKeys.bitgo);
      setMusig2Nonces(psbt, rootWalletKeys.backup);
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 0);
      validatePsbtP2trMusig2Input(psbt, 0, unspents[0], 'scriptPath');
      validatePsbtP2trMusig2Output(psbt, 0);
    });
  });

  describe('Psbt musig2 util functions', function () {
    it(`getTaprootHashForSigChecked throws error if used for p2tr* input types`, function () {
      const unspents = getUnspents(scriptTypes2Of3.map((t) => t));
      const psbt = constructPsbt(unspents, 'user', 'bitgo', outputType);
      unspents.forEach((unspent, index) => {
        const scryptType = scriptTypeForChain(unspent.chain);
        if (scryptType === 'p2trMusig2' || scryptType === 'p2tr') {
          return;
        }
        assert.throws(
          () => psbt.getTaprootHashForSigChecked(index),
          (e) => e.message === `${index} input is not a taproot type to take taproot tx hash`
        );
      });
    });

    it(`decodePsbtMusig2ParticipantsKeyValData fails if invalid subtype or identifier is passed`, function () {
      const kv = {
        key: {
          identifier: 'dummy',
          subtype: 0x05,
          keydata: Buffer.allocUnsafe(1),
        },
        value: Buffer.allocUnsafe(1),
      };

      assert.throws(
        () => decodePsbtMusig2ParticipantsKeyValData(kv),
        (e) =>
          e.message === `Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for participants pub keys`
      );

      kv.key.identifier = PSBT_PROPRIETARY_IDENTIFIER;
      assert.throws(
        () => decodePsbtMusig2ParticipantsKeyValData(kv),
        (e) =>
          e.message === `Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for participants pub keys`
      );
    });
  });
});
