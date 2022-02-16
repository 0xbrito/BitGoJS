import should = require('should');
import * as accountLib from '@bitgo/account-lib';
import * as materialData from '@bitgo/account-lib/test/resources/dot/materialData.json';
import { TestBitGo } from '../../../lib/test_bitgo';
import * as DotResources from '../../fixtures/coins/dot';
import { randomBytes } from 'crypto';

import { Environments } from '../../../../src';
import * as nock from 'nock';
nock.enableNetConnect();

describe('DOT:', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tdot');

    const uri = Environments[bitgo.getEnv()].uri;
    nock(uri)
      .get('/api/v2/tdot/material')
      .reply(200, {
        ...materialData
      });
  });

  describe('Sign Message', () => {
    it('should be performed', async () => {
      const keyPair = new accountLib.Dot.KeyPair();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      const signature = await basecoin.signMessage(keyPair.getKeys(), messageToSign);
      keyPair.verifySignature(messageToSign, Uint8Array.from(signature)).should.equals(true);
    });

    it('should fail with missing private key', async () => {
      const keyPair = new accountLib.Dot.KeyPair({ pub: '7788327c695dca4b3e649a0db45bc3e703a2c67428fce360e61800cc4248f4f7' }).getKeys();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      await basecoin.signMessage(keyPair, messageToSign).should.be.rejectedWith('Invalid key pair options');
    });
  });

  describe('Sign transaction', () => {
    const transaction = {
      id: '0x19de156328eea66bd1ec45843569c168e0bb2f2898221029b403df3f23a5489d',
      sender: '5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr',
      referenceBlock: '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
      blockNumber: 3933,
      genesisHash: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
      nonce: 200,
      specVersion: 9150,
      transactionVersion: 8,
      eraPeriod: 64,
      chainName: 'Westend',
      tip: 0,
      to: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq',
      amount: '10000000000',
    };

    // TODO: BG-43197
    xit('should sign transaction', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          txHex: DotResources.rawTx.transfer.unsigned,
          transaction,
        },
        pubs: [
          DotResources.accounts.account1.publicKey,
        ],
        prv: DotResources.accounts.account1.secretKey,
      });
      signed.txHex.should.equal(DotResources.rawTx.transfer.signed);
    });

    // TODO: BG-43197
    xit('should fail to sign transaction with an invalid key', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: DotResources.rawTx.transfer.unsigned,
            transaction,
          },
          pubs: [
            DotResources.accounts.account2.publicKey,
          ],
          prv: DotResources.accounts.account1.secretKey,
        });
      } catch (e) {
        should.equal(e.message, 'Private key cannot sign the transaction');
      }
    });

    it('should fail to build transaction with missing params', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: DotResources.rawTx.transfer.unsigned,
            key: DotResources.accounts.account1.publicKey,
          },
          prv: DotResources.accounts.account1.secretKey,
        });
      } catch (e) {
        should.notEqual(e, null);
      }
    });
  });

  describe('Generate wallet key pair: ', () => {
    it('should generate key pair', () => {
      const kp = basecoin.generateKeyPair();
      basecoin.isValidPub(kp.pub).should.equal(true);
      basecoin.isValidPrv(kp.prv).should.equal(true);
    });

    it('should generate key pair from seed', () => {
      const seed = Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex');
      const kp = basecoin.generateKeyPair(seed);
      basecoin.isValidPub(kp.pub).should.equal(true);
      basecoin.isValidPrv(kp.prv).should.equal(true);
    });
  });

  describe('Derive Keypair', () => {
    const params = {
      addressDerivationPrv: DotResources.accounts.account1.secretKey,
      addressDerivationPub: DotResources.accounts.account1.publicKey,
      index: 0,
    };
    it('should derive valid key pairs', async () => {
      Array.from({ length: 10 }).forEach((val, idx) => {
        params.index = idx + 1;
        const derivedKeypair = basecoin.deriveKeypair(params);
        basecoin.isValidPrv(derivedKeypair.prv).should.be.true();
        basecoin.isValidPub(derivedKeypair.pub).should.be.true();
        basecoin.isValidAddress(derivedKeypair.address).should.be.true();
      });
    });
    it('should throw if prv is missing from deriveKeypair params', async () => {
      // @ts-expect-error allow invalid type for testing
      params.addressDerivationPrv = undefined;
      should(() => basecoin.deriveKeypair(params)).throw();
    });
    it('should throw if prv is invalid in deriveKeypair params', async () => {
      params.addressDerivationPrv = 'fakeprvkey';
      should(() => basecoin.deriveKeypair(params)).throw();
    });
    it('should throw if index is invalid', async () => {
      params.addressDerivationPrv = DotResources.accounts.account1.secretKey;
      params.index = -1;
      should(() => basecoin.deriveKeypair(params)).throw();
    });
  });
});
