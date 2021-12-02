import 'should';
import { BaseNetwork, CoinFamily, coins, Erc20Coin, EthereumNetwork, NetworkType } from '../../src';

interface DuplicateCoinObject {
  name: string;
  network: BaseNetwork;
}

coins.forEach((coin, coinName) => {
  describe(`Coin ${coinName}`, function () {
    it('has expected name', function () {
      coin.name.should.eql(coinName);
    });

    if (!coin.isToken) {
      it(`has expected network type`, function () {
        coin.network.type.should.eql(coin.name === coin.family ? NetworkType.MAINNET : NetworkType.TESTNET);
      });
    }
  });
});

describe('ERC20 Coins', () => {
  it('should have no duplicate contract addresses', () => {
    coins
      .filter((coin) => coin instanceof Erc20Coin)
      .reduce((acc: { [index: string]: DuplicateCoinObject }, token) => {
        const address = (token as Readonly<Erc20Coin>).contractAddress.toString();

        // If not ETH, should never have duplicates
        if (acc[address] && token.network.family !== CoinFamily.ETH) {
          throw new Error(
            `ERC20 tokens '${acc[address].name}' and '${token.name}' have identical contract address '${address}'`
          );
        }

        // If ETH, must check if chainId is different for the tokens before concluding they are duplicates
        if (acc[address] && token.network.family === CoinFamily.ETH) {
          const network = token.network as EthereumNetwork;
          const accEntry = acc[address].network as EthereumNetwork;
          if (network.chainId === accEntry.chainId) {
            throw new Error(
              `ERC20 tokens '${acc[address]}' and '${token.name}' have identical contract address '${address}'`
            );
          }
        }
        acc[address] = { name: token.name, network: token.network };
        return acc;
      }, {});
  });
});
