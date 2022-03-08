import { coins } from '@bitgo/statics';
import should from 'should';
import { TransactionType } from '../../../../src/coin/baseCoin';
import { Transaction } from '../../../../src/coin/near';
import * as NearResources from '../../../resources/near';

describe('Near Transaction', () => {
  let tx: Transaction;
  const config = coins.get('tnear');

  beforeEach(() => {
    tx = new Transaction(config);
  });

  describe('empty transaction', () => {
    it('should throw empty transaction', () => {
      should.throws(() => tx.toJson(), 'Empty transaction');
      should.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
    });
  });

  describe('sign transaction', () => {
    it('can sign', () => {
      should.deepEqual(tx.canSign({ key: NearResources.accounts.account2.secretKey }), true);
    });
    it('cannot  sign', () => {
      should.deepEqual(tx.canSign({ key: NearResources.accounts.account2.secretKey + '11' }), false);
    });
    it('cannot  sign', () => {
      should.deepEqual(tx.canSign({ key: 'afdsljadslkel23' }), false);
    });
  });

  describe('from raw transaction', () => {
    it('build a transfer from raw', async () => {
      tx.fromRawTransaction(NearResources.rawTx.transfer.signed);
      const json = tx.toJson();
      should.equal(json.signerId, NearResources.accounts.account1.address);
    });

    it('build a unsigned transfer from raw', async () => {
      tx.fromRawTransaction(NearResources.rawTx.transfer.unsigned);
      const json = tx.toJson();
      should.equal(json.signerId, NearResources.accounts.account1.address);
    });

    it('build a transfer from incorrent raw data', async () => {
      should.throws(() => tx.fromRawTransaction('11' + NearResources.rawTx.transfer.signed), 'incorrect raw data');
    });
  });

  describe('Explain', () => {
    it('a signed transfer transaction', async () => {
      tx.fromRawTransaction(NearResources.rawTx.transfer.signed);
      const explain = tx.explainTransaction();
      explain.id.should.equal('CEpsBC4fA64phQMfDnNzJqLFiDmgMhyAeu9vqN18EExH');
      explain.outputAmount.should.equal('1');
      explain.outputs[0].amount.should.equal('1');
      explain.outputs[0].address.should.equal(NearResources.accounts.account2.address);
      explain.fee.fee.should.equal('');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.Send);
    });

    it('an unsigned transfer transaction', async () => {
      tx.fromRawTransaction(NearResources.rawTx.transfer.unsigned);
      const explain = tx.explainTransaction();
      explain.id.should.equal('CEpsBC4fA64phQMfDnNzJqLFiDmgMhyAeu9vqN18EExH');
      explain.outputAmount.should.equal('1');
      explain.outputs[0].amount.should.equal('1');
      explain.outputs[0].address.should.equal(NearResources.accounts.account2.address);
      explain.fee.fee.should.equal('');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.Send);
    });
  });
});
