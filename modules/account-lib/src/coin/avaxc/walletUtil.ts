// TODO BG-35012: determine if and how to use methodIds
export const sendMultisigMethodId = '';
export const sendMultisigTokenMethodId = '';
export const createForwarderMethodId = '';
export const walletInitializationFirstBytes = '';
export const flushForwarderTokensMethodId = '';
export const flushCoinsMethodId = '';

export const walletSimpleByteCode =
  '0x60606040526000600160006101000a81548160ff021916908315150217905550341561002a57600080fd5b60405161155b38038061155b833981016040528080518201919050506003815114151561005657600080fd5b806000908051906020019061006c929190610073565b5050610140565b8280548282559060005260206000209081019282156100ec579160200282015b828111156100eb5782518260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555091602001919060010190610093565b5b5090506100f991906100fd565b5090565b61013d91905b8082111561013957600081816101000a81549073ffffffffffffffffffffffffffffffffffffffff021916905550600101610103565b5090565b90565b61140c8061014f6000396000f300606060405260043610610099576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680630dcd7a6c146101335780632079fb9a146101e95780632da034091461024c57806339125215146102a45780637df73e271461037e578063a0b7967b146103cf578063a68a76cc146103f8578063abe3219c1461044d578063fc0f392d1461047a575b6000341115610131577f6e89d517057028190560dd200cf6bf792842861353d1173761dfa362e1c133f03334600036604051808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200184815260200180602001828103825284848281815260200192508082843782019150509550505050505060405180910390a15b005b341561013e57600080fd5b6101e7600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803590602001909190803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803590602001909190803590602001909190803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190505061048f565b005b34156101f457600080fd5b61020a6004808035906020019091905050610668565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b341561025757600080fd5b6102a2600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803573ffffffffffffffffffffffffffffffffffffffff169060200190919050506106a7565b005b34156102af57600080fd5b61037c600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803590602001909190803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190803590602001909190803590602001909190803590602001908201803590602001908080601f01602080910402602001604051908101604052809392919081815260200183838082843782019150505050505091905050610773565b005b341561038957600080fd5b6103b5600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050610a72565b604051808215151515815260200191505060405180910390f35b34156103da57600080fd5b6103e2610b16565b6040518082815260200191505060405180910390f35b341561040357600080fd5b61040b610b70565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b341561045857600080fd5b610460610b95565b604051808215151515815260200191505060405180910390f35b341561048557600080fd5b61048d610ba8565b005b60008061049b33610a72565b15156104a657600080fd5b878787878760405180807f415641582d455243323000000000000000000000000000000000000000000000815250600a018673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166c010000000000000000000000000281526014018581526020018473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166c0100000000000000000000000002815260140183815260200182815260200195505050505050604051809103902091506105898883858888610c3b565b508590508073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb89896000604051602001526040518363ffffffff167c0100000000000000000000000000000000000000000000000000000000028152600401808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200182815260200192505050602060405180830381600087803b151561063857600080fd5b6102c65a03f1151561064957600080fd5b50505060405180519050151561065e57600080fd5b5050505050505050565b60008181548110151561067757fe5b90600052602060002090016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60006106b233610a72565b15156106bd57600080fd5b8290508073ffffffffffffffffffffffffffffffffffffffff16633ef13367836040518263ffffffff167c0100000000000000000000000000000000000000000000000000000000028152600401808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001915050600060405180830381600087803b151561075a57600080fd5b6102c65a03f1151561076b57600080fd5b505050505050565b60008061077f33610a72565b151561078a57600080fd5b878787878760405180807f41564158000000000000000000000000000000000000000000000000000000008152506004018673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166c0100000000000000000000000002815260140185815260200184805190602001908083835b602083101515610833578051825260208201915060208101905060208303925061080e565b6001836020036101000a038019825116818451168082178552505050505050905001838152602001828152602001955050505050506040518091039020915061087f8883858888610c3b565b90508773ffffffffffffffffffffffffffffffffffffffff16878760405180828051906020019080838360005b838110156108c75780820151818401526020810190506108ac565b50505050905090810190601f1680156108f45780820380516001836020036101000a031916815260200191505b5091505060006040518083038185876187965a03f192505050151561091857600080fd5b7f59bed9ab5d78073465dd642a9e3e76dfdb7d53bcae9d09df7d0b8f5234d5a8063382848b8b8b604051808773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200185600019166000191681526020018473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200183815260200180602001828103825283818151815260200191508051906020019080838360005b83811015610a29578082015181840152602081019050610a0e565b50505050905090810190601f168015610a565780820380516001836020036101000a031916815260200191505b5097505050505050505060405180910390a15050505050505050565b600080600090505b600080549050811015610b0b578273ffffffffffffffffffffffffffffffffffffffff16600082815481101515610aad57fe5b906000526020600020900160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415610afe5760019150610b10565b8080600101915050610a7a565b600091505b50919050565b6000806000809150600090505b600a811015610b655781600282600a81101515610b3c57fe5b01541115610b5857600281600a81101515610b5357fe5b015491505b8080600101915050610b23565b600182019250505090565b6000610b7a610e90565b604051809103906000f0801515610b9057600080fd5b905090565b600160009054906101000a900460ff1681565b610bb133610a72565b1515610bbc57600080fd5b60018060006101000a81548160ff0219169083151502179055507f0909e8f76a4fd3e970f2eaef56c0ee6dfaf8b87c5b8d3f56ffce78e825a9115733604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390a1565b600080610c488686610ce6565b9050600160009054906101000a900460ff168015610c6c5750610c6a87610a72565b155b15610c7657600080fd5b42841015610c8357600080fd5b610c8c83610db9565b610c9581610a72565b1515610ca057600080fd5b3373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415610cd957600080fd5b8091505095945050505050565b60008060008060418551141515610cfc57600080fd5b602085015192506040850151915060ff6041860151169050601b8160ff161015610d2757601b810190505b600186828585604051600081526020016040526000604051602001526040518085600019166000191681526020018460ff1660ff16815260200183600019166000191681526020018260001916600019168152602001945050505050602060405160208103908084039060008661646e5a03f11515610da557600080fd5b505060206040510351935050505092915050565b600080610dc533610a72565b1515610dd057600080fd5b60009150600090505b600a811015610e385782600282600a81101515610df257fe5b01541415610dff57600080fd5b600282600a81101515610e0e57fe5b0154600282600a81101515610e1f57fe5b01541015610e2b578091505b8080600101915050610dd9565b600282600a81101515610e4757fe5b0154831015610e5557600080fd5b612710600283600a81101515610e6757fe5b015401831115610e7657600080fd5b82600283600a81101515610e8657fe5b0181905550505050565b60405161054080610ea18339019056006060604052341561000f57600080fd5b336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506104e28061005e6000396000f300606060405260043610610056576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff168062821de3146101475780633ef133671461019c5780636b9f96ea146101d5575b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166108fc349081150290604051600060405180830381858888f1935050505015156100b757600080fd5b7f69b31548dea9b3b707b4dff357d326e3e9348b24e7a6080a218a6edeeec48f9b3334600036604051808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200184815260200180602001828103825284848281815260200192508082843782019150509550505050505060405180910390a1005b341561015257600080fd5b61015a6101ea565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b34156101a757600080fd5b6101d3600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190505061020f565b005b34156101e057600080fd5b6101e861043c565b005b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008060008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561026f57600080fd5b8392503091508273ffffffffffffffffffffffffffffffffffffffff166370a08231836000604051602001526040518263ffffffff167c0100000000000000000000000000000000000000000000000000000000028152600401808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001915050602060405180830381600087803b151561031857600080fd5b6102c65a03f1151561032957600080fd5b505050604051805190509050600081141561034357610436565b8273ffffffffffffffffffffffffffffffffffffffff1663a9059cbb6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff16836000604051602001526040518363ffffffff167c0100000000000000000000000000000000000000000000000000000000028152600401808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200182815260200192505050602060405180830381600087803b151561040f57600080fd5b6102c65a03f1151561042057600080fd5b50505060405180519050151561043557600080fd5b5b50505050565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166108fc3073ffffffffffffffffffffffffffffffffffffffff16319081150290604051600060405180830381858888f1935050505015156104b457600080fd5b5600a165627a7a72305820ffd078edc0e7f8e4c581c4d531c9619ed1ede538db1a0e1558a2ad1ee8a271e60029a165627a7a72305820b3536b1d05b7a85b619fa414a9cf3b280fc48b3154a2e4f09aa335189c8ae7b80029';

export const walletSimpleConstructor = ['address[]'];
export const flushTokensTypes = ['address', 'address'];
export const flushCoinsTypes = [];
/*
The steps used to obtain the ABI of the contract were:

1. Go to: https://remix.ethereum.org/
2. Copy the content of the contract AvaxWalletSimple.sol into the IDE
    The content of the contracts: Forwarder.sol and ERC20Interface.sol also need to be present to replicate the imports structure of AvaxWalletSimple.sol
3. Compile the contract with the compiler version 0.4.26+commit.4563c3fc and then get the generated ABI
 */
export const walletSimpleAbi = [
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "success",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export const sendMultiSigTypes = ['address', 'uint', 'bytes', 'uint', 'uint', 'bytes'];

export const sendMultiSigTokenTypes = ['address', 'uint', 'address', 'uint', 'uint', 'bytes'];
