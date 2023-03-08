import { BaseUtils, NotImplementedError, ParseTransactionError, Signature, TransactionType } from '@bitgo/sdk-core';
import { encodeSecp256k1Pubkey, encodeSecp256k1Signature } from '@cosmjs/amino';
import { fromBase64, fromHex, toHex } from '@cosmjs/encoding';
import {
  DecodedTxRaw,
  decodePubkey,
  decodeTxRaw,
  EncodeObject,
  encodePubkey,
  makeAuthInfoBytes,
  makeSignDoc,
  Registry,
} from '@cosmjs/proto-signing';
import { Coin, defaultRegistryTypes } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';
import { SignDoc, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Any } from 'cosmjs-types/google/protobuf/any';

import * as constants from './constants';
import { AtomTransaction, FeeData, MessageData } from './iface';
import { KeyPair } from './keyPair';

export class Utils implements BaseUtils {
  private registry = new Registry([...defaultRegistryTypes]);

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return this.validateBlake2b(hash);
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    try {
      new KeyPair({ prv: key });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    try {
      new KeyPair({ pub: key });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new NotImplementedError('isValidSignature not implemented');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return this.validateBlake2b(txId);
  }

  /**
   * Checks if transaction hash is in valid black2b format
   */
  validateBlake2b(hash: string): boolean {
    if (hash?.length !== 64) {
      return false;
    }
    return hash.match(/^[a-zA-Z0-9]+$/) !== null;
  }
  /**
   * Checks if raw transaction can be deserialized
   *
   * @param {string} rawTransaction - transaction in base64 string format
   * @returns {boolean} - the validation result
   */
  private isValidRawTransaction(rawTransaction: string): boolean {
    try {
      const decodedTx: DecodedTxRaw = this.getDecodedTxFromRawBase64(rawTransaction);
      if (decodedTx) {
        if (!decodedTx.body) {
          return false;
        }
        if (!decodedTx.body.messages || !decodedTx.body.messages.length) {
          return false;
        }
        if (!decodedTx.authInfo) {
          return false;
        }
        if (!decodedTx.authInfo.fee) {
          return false;
        }
        if (!decodedTx.authInfo.signerInfos || !decodedTx.authInfo.signerInfos.length) {
          return false;
        }
        if (!decodedTx.authInfo.signerInfos[0].publicKey) {
          return false;
        }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param {string} rawTransaction - Transaction in base64 string  format
   */
  validateRawTransaction(rawTransaction: string | undefined): void {
    if (!rawTransaction) {
      throw new ParseTransactionError('Invalid raw transaction: Undefined');
    }
    if (!this.isValidRawTransaction(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  /**
   * Validates if the address matches with regex @see accountAddressRegex
   *
   * @param {string} address
   * @returns {boolean} - the validation result
   */
  isValidAddress(address: string): boolean {
    return constants.accountAddressRegex.test(address);
  }

  /**
   * Validates if the address matches with regex @see accountAddressRegex
   *
   * @param {string} address
   * @returns {boolean} - the validation result
   */
  isValidValidatorAddress(address: string): boolean {
    return constants.validatorAddressRegex.test(address);
  }

  /**
   * Validates whether amounts are in range
   *
   * @param {number[]} amounts - the amounts to validate
   * @returns {boolean} - the validation result
   */
  isValidAmounts(amounts: number[]): boolean {
    for (const amount of amounts) {
      if (!this.isValidAmount(amount)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validates whether amount is in range
   * @param {number} amount
   * @returns {boolean} the validation result
   */
  isValidAmount(amount: number): boolean {
    const bigNumberAmount = new BigNumber(amount);
    if (!bigNumberAmount.isInteger() || bigNumberAmount.isLessThanOrEqualTo(0)) {
      return false;
    }
    return true;
  }

  /**
   * Decodes raw tx data into messages, signing info, and fee data
   * @param {string} txHex - raw base64 tx
   * @returns {DecodedTxRaw} Decoded transaction
   */
  getDecodedTxFromRawBase64(txRaw: string): DecodedTxRaw {
    return decodeTxRaw(fromBase64(txRaw));
  }

  /**
   * Returns the array of messages in the body of the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {EncodeObject[]} messages along with type url
   */
  private getEncodedMessagesFromDecodedTx(decodedTx: DecodedTxRaw): EncodeObject[] {
    return decodedTx.body.messages;
  }

  /**
   * Pulls the sequence number from a DecodedTxRaw AuthInfo property
   * @param {DecodedTxRaw} decodedTx
   * @returns {number} sequence
   */
  getSequenceFromDecodedTx(decodedTx: DecodedTxRaw): number {
    return Number(decodedTx.authInfo.signerInfos[0].sequence);
  }

  /**
   * Pulls the typeUrl from the encoded message of a DecodedTxRaw
   * @param {DecodedTxRaw} decodedTx
   * @returns {string} cosmos proto type url
   */
  getTypeUrlFromDecodedTx(decodedTx: DecodedTxRaw): string {
    const encodedMessage = this.getEncodedMessagesFromDecodedTx(decodedTx)[0];
    return encodedMessage.typeUrl;
  }

  /**
   * Returns the fee data from the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {FeeData} fee data
   */
  getGasBudgetFromDecodedTx(decodedTx: DecodedTxRaw): FeeData {
    return {
      amount: decodedTx.authInfo.fee?.amount as Coin[],
      gasLimit: Number(decodedTx.authInfo.fee?.gasLimit),
    };
  }

  /**
   * Returns the publicKey from the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {string | undefined} publicKey in hex format if it exists, undefined otherwise
   */
  getPublicKeyFromDecodedTx(decodedTx: DecodedTxRaw): string | undefined {
    const publicKeyUInt8Array = decodedTx.authInfo.signerInfos?.[0].publicKey?.value;
    if (publicKeyUInt8Array) {
      return toHex(fromBase64(decodePubkey(decodedTx.authInfo.signerInfos?.[0].publicKey)?.value));
    }
    return undefined;
  }

  /**
   * Returns the array of MessageData[] from the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {MessageData[]} Send transaction message data
   */
  getSendMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message);
      return {
        value: {
          fromAddress: value.fromAddress,
          toAddress: value.toAddress,
          amount: value.amount,
        },
        typeUrl: message.typeUrl,
      };
    });
  }

  /**
   * Returns the array of MessageData[] from the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {MessageData[]} Delegate of undelegate transaction message data
   */
  getDelegateOrUndelegateMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message);
      return {
        value: {
          delegatorAddress: value.delegatorAddress,
          validatorAddress: value.validatorAddress,
          amount: value.amount,
        },
        typeUrl: message.typeUrl,
      };
    });
  }

  /**
   * Returns the array of MessageData[] from the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {MessageData[]} Delegate of undelegate transaction message data
   */
  getWithdrawDelegatorRewardsMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message);
      return {
        value: {
          delegatorAddress: value.delegatorAddress,
          validatorAddress: value.validatorAddress,
        },
        typeUrl: message.typeUrl,
      };
    });
  }

  /**
   * Determines bitgo transaction type based on cosmos proto type url
   * @param {string} typeUrl
   * @returns {TransactionType | undefined} TransactionType if url is supported else undefined
   */
  getTransactionTypeFromTypeUrl(typeUrl: string): TransactionType | undefined {
    switch (typeUrl) {
      case constants.sendMsgTypeUrl:
        return TransactionType.Send;
      case constants.delegateMsgTypeUrl:
        return TransactionType.StakingActivate;
      case constants.undelegateMsgTypeUrl:
        return TransactionType.StakingDeactivate;
      case constants.withdrawDelegatorRewardMsgTypeUrl:
        return TransactionType.StakingWithdraw;
      default:
        return undefined;
    }
  }

  /**
   * Creates a sign doc from an atom transaction @see AtomTransaction
   * @Precondition atomTransaction.accountNumber and atomTransaction.chainId must be defined
   * @param {AtomTransaction} atomTransaction
   * @returns {SignDoc} sign doc
   */
  createSignDocFromAtomTransaction(atomTransaction: AtomTransaction): SignDoc {
    if (!atomTransaction.accountNumber) {
      throw new Error('accountNumber is required to create a sign doc');
    }
    if (!atomTransaction.chainId) {
      throw new Error('chainId is required to create a sign doc');
    }
    const txRaw = this.createTxRawFromAtomTransaction(atomTransaction);
    return makeSignDoc(txRaw.bodyBytes, txRaw.authInfoBytes, atomTransaction.chainId, atomTransaction.accountNumber);
  }

  /**
   * Creates a txRaw from an atom transaction @see AtomTransaction
   * @Precondition atomTransaction.publicKey must be defined
   * @param {AtomTransaction} atomTransaction
   * @returns {TxRaw} Unsigned raw transaction
   */
  createTxRawFromAtomTransaction(atomTransaction: AtomTransaction): TxRaw {
    if (!atomTransaction.publicKey) {
      throw new Error('publicKey is required to create a txRaw');
    }
    const encodedPublicKey: Any = encodePubkey(encodeSecp256k1Pubkey(fromHex(atomTransaction.publicKey)));
    const txBodyValue = {
      messages: atomTransaction.sendMessages as unknown as Any[],
    };
    const txBodyBytes = this.registry.encodeTxBody(txBodyValue);
    const sequence = atomTransaction.sequence;
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey: encodedPublicKey, sequence }],
      atomTransaction.gasBudget.amount,
      atomTransaction.gasBudget.gasLimit,
      undefined,
      undefined,
      undefined
    );
    return TxRaw.fromPartial({
      bodyBytes: txBodyBytes,
      authInfoBytes: authInfoBytes,
    });
  }

  /**
   * Encodes a signature into a txRaw
   * @param {Uint8Array} secp256k1 signature
   * @param {TxRaw} Unsigned raw transaction
   * @returns {TxRaw} Signed raw transaction
   */
  createSignedTxRaw(signature: Signature, tx: { bodyBytes: Uint8Array; authInfoBytes: Uint8Array }): TxRaw {
    const stdSignature = encodeSecp256k1Signature(fromHex(signature.publicKey.pub), signature.signature);
    return TxRaw.fromPartial({
      bodyBytes: tx.bodyBytes,
      authInfoBytes: tx.authInfoBytes,
      signatures: [fromBase64(stdSignature.signature)],
    });
  }

  /**
   * Decodes a raw transaction into a DecodedTxRaw and checks if it has non empty signatures
   * @param {string} rawTransaction
   * @returns {boolean} true if transaction is signed else false
   */
  isSignedRawTx(rawTransaction: string): boolean {
    const decodedTx = this.getDecodedTxFromRawBase64(rawTransaction);
    if (decodedTx.signatures.length > 0) {
      return true;
    }
    return false;
  }

  /**
   * Decodes a raw transaction into a DecodedTxRaw and returns the signer info in form of {pubKey, signature}
   * @Assumption Only one signature is present in the raw transaction
   * @param {string} rawTransaction
   * @returns {{{pub: string}, Buffer}} public key and signature
   */
  getSignerInfoFromRawSignedTx(rawTransaction: string) {
    if (!this.isSignedRawTx(rawTransaction)) {
      throw new Error('getSignerInfoFromRawTx failed, raw tx is not signed');
    }
    const decodedTx = this.getDecodedTxFromRawBase64(rawTransaction);
    const aminoPubKey = decodedTx.authInfo.signerInfos[0].publicKey as Any;
    const decodedPubKeyHex = toHex(fromBase64(decodePubkey(aminoPubKey)?.value));
    const pubKey = {
      pub: decodedPubKeyHex,
    };
    const signature = Buffer.from(decodedTx.signatures[0]);
    return { pubKey, signature };
  }
}

const utils = new Utils();

export default utils;
