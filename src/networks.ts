import { CoinFamily } from './base';

export const enum NetworkType {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
}

export abstract class BaseNetwork {
  public abstract readonly type: NetworkType;
  public abstract readonly family: CoinFamily;
}

export interface UtxoNetwork extends BaseNetwork {
  messagePrefix: string;
  bech32?: string;
  bip32: {
    public: number;
    private: number;
  };
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
  explorerUrl?: string;
}

export interface AccountNetwork extends BaseNetwork {
  explorerUrl?: string;
}

export interface OfcNetwork extends BaseNetwork {}

abstract class Mainnet extends BaseNetwork {
  type = NetworkType.MAINNET;
}

abstract class Testnet extends BaseNetwork {
  type = NetworkType.TESTNET;
}

/**
 * Mainnet abstract class for Bitcoin forks. These are the constants from the Bitcoin main network,
 * which are overridden to various degrees by each Bitcoin fork.
 *
 * This allows us to not redefine these properties for forks which haven't changed them from Bitcoin.
 *
 * However, if a coin network has changed one of these properties, and you accidentally forget to override,
 * you'll inherit the incorrect values from the Bitcoin network. Be wary, and double check your network constant
 * overrides to ensure you're not missing any changes.
 */
abstract class BitcoinLikeMainnet extends Mainnet implements UtxoNetwork {
  messagePrefix = '\x18Bitcoin Signed Message:\n';
  bip32 = {
    public: 0x0488b21e,
    private: 0x0488ade4,
  };
  pubKeyHash = 0x00;
  scriptHash = 0x05;
  wif = 0x80;
  type = NetworkType.MAINNET;
}

/**
 * Testnet abstract class for Bitcoin forks. Works exactly the same as `BitcoinLikeMainnet`,
 * except the constants are taken from the Bitcoin test network.
 */
abstract class BitcoinLikeTestnet extends Testnet implements UtxoNetwork {
  messagePrefix = '\x18Bitcoin Signed Message:\n';
  bip32 = {
    public: 0x043587cf,
    private: 0x04358394,
  };
  pubKeyHash = 0x6f;
  scriptHash = 0xc4;
  wif = 0xef;
  type = NetworkType.TESTNET;
}

class Algorand extends Mainnet implements AccountNetwork {
  family = CoinFamily.ALGO;
  explorerUrl = 'https://algoexplorer.io/tx/';
}

class AlgorandTestnet extends Testnet implements AccountNetwork {
  family = CoinFamily.ALGO;
  explorerUrl = 'https://testnet.algoexplorer.io/tx/';
}
class Bitcoin extends BitcoinLikeMainnet {
  family = CoinFamily.BTC;
  explorerUrl = 'https://smartbit.com.au/tx/';
  bech32 = 'bc';
}

class BitcoinTestnet extends BitcoinLikeTestnet {
  family = CoinFamily.BTC;
  explorerUrl = 'https://testnet.smartbit.com.au/tx/';
  bech32 = 'tb';
}

class BitcoinCash extends BitcoinLikeMainnet {
  family = CoinFamily.BCH;
  explorerUrl = 'http://blockdozer.com/tx/';
}

class BitcoinCashTestnet extends BitcoinLikeTestnet {
  family = CoinFamily.BCH;
  explorerUrl = 'https://tbch.blockdozer.com/tx/';
}

class BitcoinSV extends BitcoinLikeMainnet {
  family = CoinFamily.BSV;
  explorerUrl = 'https://blockchair.com/bitcoin-sv/transaction/';
}

class BitcoinSVTestnet extends BitcoinLikeTestnet {
  family = CoinFamily.BSV;
  explorerUrl = 'https://testnet.bitcoincloud.net/tx/';
}

class BitcoinGold extends BitcoinLikeMainnet {
  messagePrefix = '\x18Bitcoin Gold Signed Message:\n';
  bech32 = 'btg';
  pubKeyHash = 0x26;
  scriptHash = 0x17;
  family = CoinFamily.BTG;
  explorerUrl = 'https://btgexplorer.com/tx/';
}

class Dash extends BitcoinLikeMainnet {
  messagePrefix = '\x19DarkCoin Signed Message:\n';
  pubKeyHash = 0x4c;
  scriptHash = 0x10;
  wif = 0xcc;
  family = CoinFamily.DASH;
  explorerUrl = 'https://insight.dashevo.org/insight/tx/';
}

class DashTestnet extends BitcoinLikeTestnet {
  messagePrefix = '\x19DarkCoin Signed Message:\n';
  bip32 = {
    public: 0x043587cf,
    private: 0x04358394,
  };
  pubKeyHash = 0x8c;
  scriptHash = 0x13;
  wif = 0xef;
  family = CoinFamily.DASH;
  explorerUrl = 'https://tbch.blockdozer.com/tx/';
}

class Ethereum extends Mainnet implements AccountNetwork {
  family = CoinFamily.ETH;
  explorerUrl = 'https://etherscan.io/tx/';
}

class Kovan extends Testnet implements AccountNetwork {
  family = CoinFamily.ETH;
  explorerUrl = 'https://kovan.etherscan.io/tx/';
}

class Eos extends Mainnet implements AccountNetwork {
  family = CoinFamily.EOS;
  explorerUrl = 'https://bloks.io/transaction/';
}

class EosTestnet extends Testnet implements AccountNetwork {
  family = CoinFamily.EOS;
  explorerUrl = 'https://jungle.bloks.io/transaction/';
}

class Litecoin extends BitcoinLikeMainnet {
  messagePrefix = '\x19Litecoin Signed Message:\n';
  bech32 = 'ltc';
  pubKeyHash = 0x30;
  scriptHash = 0x32;
  wif = 0xb0;
  family = CoinFamily.LTC;
  explorerUrl = 'https://live.blockcypher.com/ltc/tx/';
}

class LitecoinTestnet extends BitcoinLikeTestnet {
  messagePrefix = '\x19Litecoin Signed Message:\n';
  bech32 = 'tltc';
  bip32 = {
    public: 0x0488b21e,
    private: 0x0488ade4,
  };
  pubKeyHash = 0x6f;
  scriptHash = 0x3a;
  wif = 0xb0;
  family = CoinFamily.LTC;
  explorerUrl = 'http://explorer.litecointools.com/tx/';
}

class Ofc extends Mainnet implements OfcNetwork {
  family = CoinFamily.OFC;
}

class OfcTestnet extends Testnet implements OfcNetwork {
  family = CoinFamily.OFC;
}

class Stellar extends Mainnet implements AccountNetwork {
  family = CoinFamily.XLM;
  explorerUrl = 'https://stellar.expert/explorer/public/tx/';
}

class StellarTestnet extends Testnet implements AccountNetwork {
  family = CoinFamily.XLM;
  explorerUrl = 'https://stellar.expert/explorer/testnet/tx/';
}
class SUSD extends Mainnet implements AccountNetwork {
  family = CoinFamily.SUSD;
}

class SUSDTestnet extends Testnet implements AccountNetwork {
  family = CoinFamily.SUSD;
}

class Xrp extends Mainnet implements AccountNetwork {
  family = CoinFamily.XRP;
  explorerUrl = 'https://xrpcharts.ripple.com/#/transactions/';
}

class XrpTestnet extends Testnet implements AccountNetwork {
  family = CoinFamily.XRP;
  explorerUrl = 'https://xrpcharts.ripple.com/#/transactions/';
}

class ZCash extends BitcoinLikeMainnet {
  messagePrefix = '\x18ZCash Signed Message:\n';
  pubKeyHash = 0x1cb8;
  scriptHash = 0x1cbd;
  family = CoinFamily.ZEC;
  explorerUrl = 'https://zcash.blockexplorer.com/tx/';
}

class ZCashTestnet extends BitcoinLikeTestnet {
  messagePrefix = '\x18ZCash Signed Message:\n';
  pubKeyHash = 0x1d25;
  scriptHash = 0x1cba;
  family = CoinFamily.ZEC;
  explorerUrl = 'https://explorer.testnet.z.cash/tx/';
}

export const Networks = {
  main: {
    algorand: Object.freeze(new Algorand()),
    bitcoin: Object.freeze(new Bitcoin()),
    bitcoinCash: Object.freeze(new BitcoinCash()),
    bitcoinGold: Object.freeze(new BitcoinGold()),
    bitcoinSV: Object.freeze(new BitcoinSV()),
    dash: Object.freeze(new Dash()),
    eos: Object.freeze(new Eos()),
    ethereum: Object.freeze(new Ethereum()),
    litecoin: Object.freeze(new Litecoin()),
    ofc: Object.freeze(new Ofc()),
    stellar: Object.freeze(new Stellar()),
    susd: Object.freeze(new SUSD()),
    xrp: Object.freeze(new Xrp()),
    zCash: Object.freeze(new ZCash()),
  },
  test: {
    algorand: Object.freeze(new AlgorandTestnet()),
    bitcoin: Object.freeze(new BitcoinTestnet()),
    bitcoinCash: Object.freeze(new BitcoinCashTestnet()),
    bitcoinSV: Object.freeze(new BitcoinSVTestnet()),
    dash: Object.freeze(new DashTestnet()),
    eos: Object.freeze(new EosTestnet()),
    kovan: Object.freeze(new Kovan()),
    litecoin: Object.freeze(new LitecoinTestnet()),
    ofc: Object.freeze(new OfcTestnet()),
    stellar: Object.freeze(new StellarTestnet()),
    susd: Object.freeze(new SUSDTestnet()),
    xrp: Object.freeze(new XrpTestnet()),
    zCash: Object.freeze(new ZCashTestnet()),
  },
};
