import should from 'should';
import { UnnominateBuilder } from '../../../../../src/coin/dot';
import { accounts, rawTx } from '../../../../resources/dot';
import { buildTestConfig } from './base';
import { Networks } from '@bitgo/statics';

describe('Dot Unnominate Builder', () => {
  let builder: UnnominateBuilder;

  const { genesisHash, specVersion, txVersion } = Networks.test.dot;
  const sender = accounts.account1;
  const refBlock = '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d';

  beforeEach(() => {
    builder = new UnnominateBuilder(buildTestConfig());
  });

  describe('build unnominate transaction', () => {
    it('should build a unnominate transaction', async () => {
      builder
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(refBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .version(8);
      builder.sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, refBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build an unsigned unnominate transaction', async () => {
      builder
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(refBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .version(8);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, refBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async () => {
      builder.from(rawTx.unnominate.signed);
      builder.validity({ firstValid: 3933 }).referenceBlock(refBlock).version(8);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, refBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(rawTx.unnominate.unsigned);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock(refBlock)
        .sender({ address: sender.address })
        .sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, refBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.eraPeriod, 64);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
    });
  });
});
