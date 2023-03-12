import { PSBT_PROPRIETARY_IDENTIFIER, ProprietaryKeyValueData, UtxoPsbt, ProprietaryKeySubtype } from './UtxoPsbt';
import {
  checkPlainPublicKey,
  checkTapMerkleRoot,
  checkTxHash,
  checkXOnlyPublicKey,
  toXOnlyPublicKey,
} from './outputScripts';
import { BIP32Interface } from 'bip32';
import { ecc, musig } from '../noble_ecc';
import { Tuple } from './types';
import { calculateTapTweak, tapTweakPubkey } from '../taproot';
import { TapBip32Derivation } from 'bip174/src/lib/interfaces';
import { checkForInput } from 'bip174/src/lib/utils';
import { SessionKey } from '@brandonblack/musig';

/**
 *  Participant key value object.
 */
export interface PsbtMusig2ParticipantsKeyValueData {
  tapOutputKey: Buffer;
  tapInternalKey: Buffer;
  participantPubKeys: Tuple<Buffer>;
}

/**
 *  Nonce key value object.
 */
export interface PsbtMusig2PubNonceKeyValueData {
  participantPubKey: Buffer;
  tapOutputKey: Buffer;
  pubNonce: Buffer;
}

export interface PsbtMusig2PartialSigKeyValueData {
  participantPubKey: Buffer;
  tapOutputKey: Buffer;
  partialSig: Buffer;
}

/**
 * Psbt proprietary key val util function for participants pub keys. SubType is 0x01
 * Ref: https://gist.github.com/sanket1729/4b525c6049f4d9e034d27368c49f28a6
 * @return x-only tapOutputKey||tapInternalKey as sub keydata, plain sigining participant keys as valuedata
 */
export function encodePsbtMusig2ParticipantsKeyValData(
  participantsKeyValData: PsbtMusig2ParticipantsKeyValueData
): ProprietaryKeyValueData {
  const keydata = [participantsKeyValData.tapOutputKey, participantsKeyValData.tapInternalKey].map((pubkey) =>
    checkXOnlyPublicKey(pubkey)
  );
  const value = participantsKeyValData.participantPubKeys.map((pubkey) => checkPlainPublicKey(pubkey));
  const key = {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
    keydata: Buffer.concat(keydata),
  };
  return { key, value: Buffer.concat(value) };
}

/**
 * Psbt proprietary key val util function for pub nonce. SubType is 0x02
 * Ref: https://gist.github.com/sanket1729/4b525c6049f4d9e034d27368c49f28a6
 * @return plain-participantPubKey||x-only-tapOutputKey as sub keydata, 66 bytes of 2 pub nonces as valuedata
 */
export function encodePsbtMusig2PubNonceKeyValData(
  noncesKeyValueData: PsbtMusig2PubNonceKeyValueData
): ProprietaryKeyValueData {
  if (noncesKeyValueData.pubNonce.length !== 66) {
    throw new Error(`Invalid pubNonces length ${noncesKeyValueData.pubNonce.length}`);
  }
  const keydata = Buffer.concat([
    checkPlainPublicKey(noncesKeyValueData.participantPubKey),
    checkXOnlyPublicKey(noncesKeyValueData.tapOutputKey),
  ]);
  const key = {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
    keydata,
  };
  return { key, value: noncesKeyValueData.pubNonce };
}

export function encodePsbtMusig2PartialSigKeyKeyValData(
  partialSigKeyValueData: PsbtMusig2PartialSigKeyValueData
): ProprietaryKeyValueData {
  if (partialSigKeyValueData.partialSig.length !== 64) {
    throw new Error(`Invalid partialSig length ${partialSigKeyValueData.partialSig.length}`);
  }
  const keydata = Buffer.concat([
    checkPlainPublicKey(partialSigKeyValueData.participantPubKey),
    checkXOnlyPublicKey(partialSigKeyValueData.tapOutputKey),
  ]);
  const key = {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.MUSIG2_PARTIAL_SIGNATURE,
    keydata,
  };
  return { key, value: partialSigKeyValueData.partialSig };
}

/**
 * Decodes proprietary key value data for participant pub keys
 * @param kv
 */
export function decodePsbtMusig2ParticipantsKeyValData(
  kv: ProprietaryKeyValueData
): PsbtMusig2ParticipantsKeyValueData {
  if (
    kv.key.identifier !== PSBT_PROPRIETARY_IDENTIFIER ||
    kv.key.subtype !== ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS
  ) {
    throw new Error(`Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for participants pub keys`);
  }

  const key = kv.key.keydata;
  if (key.length !== 64) {
    throw new Error(`Invalid keydata size ${key.length} for participant pub keys`);
  }

  const value = kv.value;
  if (value.length !== 66) {
    throw new Error(`Invalid valuedata size ${value.length} for participant pub keys`);
  }
  const participantPubKeys: Tuple<Buffer> = [value.subarray(0, 33), value.subarray(33)];
  if (participantPubKeys[0].equals(participantPubKeys[1])) {
    throw new Error(`Duplicate participant pub keys found`);
  }

  return { tapOutputKey: key.subarray(0, 32), tapInternalKey: key.subarray(32), participantPubKeys };
}

export function decodePsbtMusig2NonceKeyValData(kv: ProprietaryKeyValueData): PsbtMusig2PubNonceKeyValueData {
  if (kv.key.identifier !== PSBT_PROPRIETARY_IDENTIFIER || kv.key.subtype !== ProprietaryKeySubtype.MUSIG2_PUB_NONCE) {
    throw new Error(`Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for nonce`);
  }

  const key = kv.key.keydata;
  if (key.length !== 64) {
    throw new Error(`Invalid keydata size ${key.length} for nonce`);
  }

  const value = kv.value;
  if (value.length !== 66) {
    throw new Error(`Invalid valuedata size ${value.length} for nonce`);
  }

  return { participantPubKey: key.subarray(0, 32), tapOutputKey: key.subarray(32), pubNonce: value };
}

export function createTapInternalKey(plainPubKeys: Buffer[]): Buffer {
  return Buffer.from(musig.getXOnlyPubkey(musig.keyAgg(musig.keySort(plainPubKeys))));
}

export function createTapOutputKey(internalPubKey: Buffer, tapTreeRoot: Buffer): Buffer {
  return Buffer.from(
    tapTweakPubkey(ecc, toXOnlyPublicKey(internalPubKey), checkTapMerkleRoot(tapTreeRoot)).xOnlyPubkey
  );
}

export function createAggregateNonce(pubNonces: Tuple<Buffer>): Buffer {
  return Buffer.from(musig.nonceAgg(pubNonces));
}

export function createTapTweak(tapInternalKey: Buffer, tapMerkleRoot: Buffer): Buffer {
  return Buffer.from(calculateTapTweak(toXOnlyPublicKey(tapInternalKey), checkTapMerkleRoot(tapMerkleRoot)));
}

export function createMusig2SigningSession(
  aggNonce: Buffer,
  hash: Buffer,
  publicKeys: Tuple<Buffer>,
  tweak: Buffer
): SessionKey {
  return musig.startSigningSession(aggNonce, checkTxHash(hash), publicKeys, { tweak, xOnly: true });
}

export function musig2PartialSign(privateKey: Buffer, publicNonce: Buffer, sessionKey: SessionKey): Buffer {
  checkTxHash(Buffer.from(sessionKey.msg));
  return Buffer.from(
    musig.partialSign({
      secretKey: privateKey,
      publicNonce,
      sessionKey,
    })
  );
}

export function parsePsbtMusig2ParticipantsKeyValData(
  psbt: UtxoPsbt,
  inputIndex: number
): PsbtMusig2ParticipantsKeyValueData | undefined {
  const participantsKeyVals = psbt.getProprietaryKeyVals(inputIndex, {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
  });

  if (!participantsKeyVals.length) {
    return undefined;
  }

  if (participantsKeyVals.length > 1) {
    throw new Error(`Found ${participantsKeyVals.length} matching participant key value instead of 1`);
  }

  return decodePsbtMusig2ParticipantsKeyValData(participantsKeyVals[0]);
}

export function parsePsbtMusig2NoncesKeyValData(
  psbt: UtxoPsbt,
  inputIndex: number
): PsbtMusig2PubNonceKeyValueData[] | undefined {
  const nonceKeyVals = psbt.getProprietaryKeyVals(inputIndex, {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
  });

  if (!nonceKeyVals.length) {
    return undefined;
  }

  if (nonceKeyVals.length > 2) {
    throw new Error(`Found ${nonceKeyVals.length} matching nonce key value instead of 1 or 2`);
  }

  return nonceKeyVals.map((kv) => decodePsbtMusig2NonceKeyValData(kv));
}

export function validatePsbtMusig2ParticipantsKeyValData(
  participantKeyValData: PsbtMusig2ParticipantsKeyValueData,
  tapInternalKey: Buffer,
  tapMerkleRoot: Buffer
): void {
  checkXOnlyPublicKey(tapInternalKey);
  checkTapMerkleRoot(tapMerkleRoot);

  const participantPubKeys = participantKeyValData.participantPubKeys;

  const internalKey = createTapInternalKey(participantPubKeys);
  if (!internalKey.equals(participantKeyValData.tapInternalKey)) {
    throw new Error('Invalid participants keydata tapInternalKey');
  }

  const outputKey = createTapOutputKey(internalKey, tapMerkleRoot);
  if (!outputKey.equals(participantKeyValData.tapOutputKey)) {
    throw new Error('Invalid participants keydata tapOutputKey');
  }

  if (!internalKey.equals(tapInternalKey)) {
    throw new Error('tapInternalKey and aggregated participant pub keys does not match');
  }
}

export function validatePsbtMusig2NoncesKeyValData(
  noncesKeyValData: Tuple<PsbtMusig2PubNonceKeyValueData>,
  participantKeyValData: PsbtMusig2ParticipantsKeyValueData
): void {
  checkXOnlyPublicKey(participantKeyValData.tapOutputKey);
  participantKeyValData.participantPubKeys.forEach((kv) => checkPlainPublicKey(kv));
  if (participantKeyValData.participantPubKeys[0].equals(participantKeyValData.participantPubKeys[1])) {
    throw new Error(`Duplicate participant pub keys found`);
  }

  noncesKeyValData.forEach((nonceKv) => {
    if (
      !nonceKv.participantPubKey.equals(participantKeyValData.participantPubKeys[0]) ||
      !nonceKv.participantPubKey.equals(participantKeyValData.participantPubKeys[1])
    ) {
      throw new Error('Invalid nonce keydata participant pub key');
    }

    if (nonceKv.tapOutputKey.equals(participantKeyValData.tapOutputKey)) {
      throw new Error('Invalid nonce keydata tapOutputKey');
    }
  });
}

function deriveWalletKey(tapBip32Derivations: TapBip32Derivation[], rootWalletKey: BIP32Interface): BIP32Interface {
  const myDerivations = tapBip32Derivations.filter((bipDv) => {
    return bipDv.masterFingerprint.equals(rootWalletKey.fingerprint);
  });

  if (!myDerivations.length) {
    throw new Error('Need one tapBip32Derivation masterFingerprint to match the rootWalletKey fingerprint');
  }

  const myDerivation = myDerivations.filter((bipDv) => {
    const publicKey = rootWalletKey.derivePath(bipDv.path).publicKey;
    return bipDv.pubkey.equals(toXOnlyPublicKey(publicKey));
  });

  if (myDerivation.length !== 1) {
    throw new Error('root wallet key should derive one tapBip32Derivation');
  }
  return rootWalletKey.derivePath(myDerivation[0].path);
}

function getMusig2NonceKeyValueData(
  psbt: UtxoPsbt,
  inputIndex: number,
  rootWalletKey: BIP32Interface,
  sessionId?: Buffer
): ProprietaryKeyValueData | undefined {
  const input = checkForInput(psbt.data.inputs, inputIndex);
  if (!input.tapInternalKey) {
    return;
  }
  if (!input.tapMerkleRoot) {
    throw new Error('tapMerkleRoot is required to create nonce');
  }
  if (!input.tapBip32Derivation?.length) {
    throw new Error('tapBip32Derivation is required to create nonce');
  }
  const participantsKeyValData = parsePsbtMusig2ParticipantsKeyValData(psbt, inputIndex);
  if (!participantsKeyValData) {
    throw new Error(`Found 0 matching participant key value instead of 1`);
  }
  validatePsbtMusig2ParticipantsKeyValData(participantsKeyValData, input.tapInternalKey, input.tapMerkleRoot);
  const { tapOutputKey, participantPubKeys } = participantsKeyValData;
  const derivedWalletKey = deriveWalletKey(input.tapBip32Derivation, rootWalletKey);
  const participantPubKey = participantPubKeys.find((pubKey) => pubKey.equals(derivedWalletKey.publicKey));

  if (!Buffer.isBuffer(participantPubKey)) {
    throw new Error('participant plain pub key should match one tapBip32Derivation plain pub key');
  }

  const { hash } = psbt.getTaprootHashForSigChecked(inputIndex);

  const nonceGenArgs = {
    sessionId,
    publicKey: participantPubKey,
    xOnlyPublicKey: tapOutputKey,
    msg: hash,
    secretKey: derivedWalletKey.privateKey,
  };

  const pubNonces = Buffer.from(musig.nonceGen(nonceGenArgs));

  return encodePsbtMusig2PubNonceKeyValData({
    participantPubKey,
    tapOutputKey,
    pubNonce: pubNonces,
  });
}

/**
 * Generates and sets Musig2 nonces to p2trMusig2 key path spending inputs.
 * tapInternalkey, tapMerkleRoot, tapBip32Derivation for rootWalletKey are required per p2trMusig2 key path input.
 * Also participant keys are required from psbt proprietary key values.
 * Ref: https://gist.github.com/sanket1729/4b525c6049f4d9e034d27368c49f28a6
 * @param psbt
 * @param rootWalletKey
 * @param sessionId If provided it must either be a counter unique to this secret key,
 * (converted to an array of 32 bytes), or 32 uniformly random bytes.
 */
export function setMusig2Nonces(psbt: UtxoPsbt, rootWalletKey: BIP32Interface, sessionId?: Buffer): void {
  if (rootWalletKey.isNeutered()) {
    throw new Error('private key is required to generate nonce');
  }
  if (Buffer.isBuffer(sessionId) && sessionId.length !== 32) {
    throw new Error(`Invalid sessionId size ${sessionId.length}`);
  }
  psbt.data.inputs.forEach((input, inputIndex) => {
    const nonceKeyValueData = getMusig2NonceKeyValueData(psbt, inputIndex, rootWalletKey, sessionId);
    if (nonceKeyValueData) {
      psbt.addProprietaryKeyValToInput(inputIndex, nonceKeyValueData);
    }
  });
}
