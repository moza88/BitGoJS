import { NetworkType } from '@bitgo/statics';
import EthereumCommon from '@ethereumjs/common';
import { Utils, KeyPair, TxData } from '@bitgo/sdk-coin-eth';
import { InvalidTransactionError } from '@bitgo/sdk-core';
import { testnetCommon, mainnetCommon } from './resources';

/**
 * Signs the transaction using the appropriate algorithm
 *
 * @param {TxData} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
export async function sign(transactionData: TxData, keyPair: KeyPair): Promise<string> {
  return Utils.signInternal(transactionData, keyPair, testnetCommon);
}

const commons: Map<NetworkType, EthereumCommon> = new Map<NetworkType, EthereumCommon>([
  [NetworkType.MAINNET, mainnetCommon],
  [NetworkType.TESTNET, testnetCommon],
]);

/**
 * @param network
 */
export function getCommon(network: NetworkType): EthereumCommon {
  const common = commons.get(network);
  if (!common) {
    throw new InvalidTransactionError('Missing network common configuration');
  }
  return common;
}

/*
  Steps to reproduce:
  Checkout https://github.com/bitgo/eth-multisig-v4
  npm install -g solc@0.8.10
  solcjs --bin ./contracts/coins/PolygonWalletSimple.sol ./contracts/Forwarder.sol ./contracts/ERC20Interface.sol
  cat PolygonWalletSimple.bin
*/
export const walletSimpleByteCode =
  '0x60806040526000600160006101000a81548160ff02191690831515021790555060006001806101000a81548160ff02191690831515021790555034801561004557600080fd5b50613834806100556000396000f3fe6080604052600436106101235760003560e01c806392467776116100a0578063c137878411610064578063c137878414610488578063c6044c46146104b1578063e6bd0aa4146104da578063f23a6e6114610503578063fc0f392d146105405761016d565b806392467776146103a3578063a0b7967b146103cc578063abe3219c146103f7578063ad3ad70914610422578063bc197c811461044b5761016d565b806334f94047116100e757806334f94047146102ae57806339125215146102d75780635a953d0a14610300578063736c0d5b146103295780637df73e27146103665761016d565b806301ffc9a7146101b75780630dcd7a6c146101f4578063150b7a021461021d578063158ef93e1461025a5780632da03409146102855761016d565b3661016d57600034111561016b577f6e89d517057028190560dd200cf6bf792842861353d1173761dfa362e1c133f03334604051610162929190611c6a565b60405180910390a15b005b60003411156101b5577f6e89d517057028190560dd200cf6bf792842861353d1173761dfa362e1c133f033346000366040516101ac9493929190611cf3565b60405180910390a15b005b3480156101c357600080fd5b506101de60048036038101906101d99190611d9f565b610557565b6040516101eb9190611de7565b60405180910390f35b34801561020057600080fd5b5061021b60048036038101906102169190611ebf565b6105d1565b005b34801561022957600080fd5b50610244600480360381019061023f919061208f565b610679565b6040516102519190612121565b60405180910390f35b34801561026657600080fd5b5061026f61068d565b60405161027c9190611de7565b60405180910390f35b34801561029157600080fd5b506102ac60048036038101906102a7919061217a565b61069e565b005b3480156102ba57600080fd5b506102d560048036038101906102d09190612210565b61075b565b005b3480156102e357600080fd5b506102fe60048036038101906102f99190612284565b61081e565b005b34801561030c57600080fd5b5061032760048036038101906103229190612353565b6109b6565b005b34801561033557600080fd5b50610350600480360381019061034b91906123a6565b610a76565b60405161035d9190611de7565b60405180910390f35b34801561037257600080fd5b5061038d600480360381019061038891906123a6565b610a96565b60405161039a9190611de7565b60405180910390f35b3480156103af57600080fd5b506103ca60048036038101906103c591906123ff565b610aeb565b005b3480156103d857600080fd5b506103e1610ba8565b6040516103ee919061243f565b60405180910390f35b34801561040357600080fd5b5061040c610c18565b6040516104199190611de7565b60405180910390f35b34801561042e57600080fd5b50610449600480360381019061044491906124b0565b610c2b565b005b34801561045757600080fd5b50610472600480360381019061046d919061258c565b610e3d565b60405161047f9190612121565b60405180910390f35b34801561049457600080fd5b506104af60048036038101906104aa91906123ff565b610e55565b005b3480156104bd57600080fd5b506104d860048036038101906104d39190612668565b610f12565b005b3480156104e657600080fd5b5061050160048036038101906104fc9190612353565b611104565b005b34801561050f57600080fd5b5061052a600480360381019061052591906126b5565b6111c4565b6040516105379190612121565b60405180910390f35b34801561054c57600080fd5b506105556111da565b005b60007f4e2312e0000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614806105ca57506105c982611275565b5b9050919050565b6105da33610a96565b610619576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610610906127ac565b60405180910390fd5b60006106236112df565b888888888860405160200161063d969594939291906128af565b60405160208183030381529060405280519060200120905061066388828585898961131c565b5061066f8689896114e0565b5050505050505050565b600063150b7a0260e01b9050949350505050565b60018054906101000a900460ff1681565b6106a733610a96565b6106e6576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106dd906127ac565b60405180910390fd5b60008290508073ffffffffffffffffffffffffffffffffffffffff16633ef13367836040518263ffffffff1660e01b8152600401610724919061291b565b600060405180830381600087803b15801561073e57600080fd5b505af1158015610752573d6000803e3d6000fd5b50505050505050565b61076433610a96565b6107a3576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161079a906127ac565b60405180910390fd5b60008490508073ffffffffffffffffffffffffffffffffffffffff1663c6a2dd248585856040518463ffffffff1660e01b81526004016107e5939291906129a8565b600060405180830381600087803b1580156107ff57600080fd5b505af1158015610813573d6000803e3d6000fd5b505050505050505050565b61082733610a96565b610866576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161085d906127ac565b60405180910390fd5b6000610870611616565b89898989898960405160200161088c9796959493929190612a0a565b60405160208183030381529060405280519060200120905060006108b48a8386868a8a61131c565b905060008a73ffffffffffffffffffffffffffffffffffffffff168a8a8a6040516108e0929190612a74565b60006040518083038185875af1925050503d806000811461091d576040519150601f19603f3d011682016040523d82523d6000602084013e610922565b606091505b5050905080610966576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161095d90612ad9565b60405180910390fd5b7f59bed9ab5d78073465dd642a9e3e76dfdb7d53bcae9d09df7d0b8f5234d5a8063383858e8e8e8e6040516109a19796959493929190612b12565b60405180910390a15050505050505050505050565b6109bf33610a96565b6109fe576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016109f5906127ac565b60405180910390fd5b60008390508073ffffffffffffffffffffffffffffffffffffffff1663159e44d784846040518363ffffffff1660e01b8152600401610a3e929190612b7c565b600060405180830381600087803b158015610a5857600080fd5b505af1158015610a6c573d6000803e3d6000fd5b5050505050505050565b60006020528060005260406000206000915054906101000a900460ff1681565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff169050919050565b610af433610a96565b610b33576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b2a906127ac565b60405180910390fd5b60008290508073ffffffffffffffffffffffffffffffffffffffff16638acc01be836040518263ffffffff1660e01b8152600401610b719190611de7565b600060405180830381600087803b158015610b8b57600080fd5b505af1158015610b9f573d6000803e3d6000fd5b50505050505050565b6000806000905060005b600a811015610c045781600282600a8110610bd057610bcf612ba5565b5b01541115610bf157600281600a8110610bec57610beb612ba5565b5b015491505b8080610bfc90612c03565b915050610bb2565b50600181610c129190612c4c565b91505090565b600160009054906101000a900460ff1681565b610c3433610a96565b610c73576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c6a906127ac565b60405180910390fd5b6000888890501415610cba576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610cb190612cee565b60405180910390fd5b858590508888905014610d02576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610cf990612d5a565b60405180910390fd5b6101008888905010610d49576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d4090612dc6565b60405180910390fd5b6000610d53611653565b898989898989604051602001610d6f9796959493929190612f0a565b604051602081830303815290604052805190602001209050600160009054906101000a900460ff1615610dd7576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610dce90612fad565b60405180910390fd5b6000610de860008386868a8a61131c565b9050610df68a8a8a8a611690565b7fe4c9047a729726b729cf4fa62c95ef9a434bbaf206a7ea0c7c77515db1584022338284604051610e2993929190612fcd565b60405180910390a150505050505050505050565b600063bc197c8160e01b905098975050505050505050565b610e5e33610a96565b610e9d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610e94906127ac565b60405180910390fd5b60008290508073ffffffffffffffffffffffffffffffffffffffff1663c59f9f19836040518263ffffffff1660e01b8152600401610edb9190611de7565b600060405180830381600087803b158015610ef557600080fd5b505af1158015610f09573d6000803e3d6000fd5b50505050505050565b60018054906101000a900460ff1615610f60576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610f5790613050565b60405180910390fd5b60038282905014610fa6576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610f9d906130bc565b60405180910390fd5b60005b828290508160ff1610156110e557600073ffffffffffffffffffffffffffffffffffffffff1683838360ff16818110610fe557610fe4612ba5565b5b9050602002016020810190610ffa91906123a6565b73ffffffffffffffffffffffffffffffffffffffff161415611051576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161104890613128565b60405180910390fd5b600160008085858560ff1681811061106c5761106b612ba5565b5b905060200201602081019061108191906123a6565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff02191690831515021790555080806110dd90613155565b915050610fa9565b5060018060016101000a81548160ff0219169083151502179055505050565b61110d33610a96565b61114c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611143906127ac565b60405180910390fd5b60008390508073ffffffffffffffffffffffffffffffffffffffff16638972c17c84846040518363ffffffff1660e01b815260040161118c929190612b7c565b600060405180830381600087803b1580156111a657600080fd5b505af11580156111ba573d6000803e3d6000fd5b5050505050505050565b600063f23a6e6160e01b90509695505050505050565b6111e333610a96565b611222576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611219906127ac565b60405180910390fd5b60018060006101000a81548160ff0219169083151502179055507f0909e8f76a4fd3e970f2eaef56c0ee6dfaf8b87c5b8d3f56ffce78e825a911573360405161126b919061291b565b60405180910390a1565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149050919050565b60606040518060400160405280600d81526020017f504f4c59474f4e2d455243323000000000000000000000000000000000000000815250905090565b60008061136d8787878080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f8201169050808301925050505050505061187c565b9050600160009054906101000a900460ff161580611390575061138f88610a96565b5b6113cf576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016113c6906131cb565b60405180910390fd5b42841015611412576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161140990613237565b60405180910390fd5b61141b836119bb565b61142481610a96565b611463576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161145a90613128565b60405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614156114d2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016114c9906132a3565b60405180910390fd5b809150509695505050505050565b6000808473ffffffffffffffffffffffffffffffffffffffff1663a9059cbb8585604051602401611512929190612b7c565b6040516020818303038152906040529060e01b6020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff838183161783525050505060405161156091906132ff565b6000604051808303816000865af19150503d806000811461159d576040519150601f19603f3d011682016040523d82523d6000602084013e6115a2565b606091505b50915091508180156115d057506000815114806115cf5750808060200190518101906115ce919061332b565b5b5b61160f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611606906133ca565b60405180910390fd5b5050505050565b60606040518060400160405280600781526020017f504f4c59474f4e00000000000000000000000000000000000000000000000000815250905090565b60606040518060400160405280600d81526020017f504f4c59474f4e2d426174636800000000000000000000000000000000000000815250905090565b60005b84849050811015611875578282828181106116b1576116b0612ba5565b5b905060200201354710156116fa576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016116f190613436565b60405180910390fd5b600085858381811061170f5761170e612ba5565b5b905060200201602081019061172491906123a6565b73ffffffffffffffffffffffffffffffffffffffff1684848481811061174d5761174c612ba5565b5b9050602002013560405161176090613479565b60006040518083038185875af1925050503d806000811461179d576040519150601f19603f3d011682016040523d82523d6000602084013e6117a2565b606091505b50509050806117e6576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016117dd906134da565b60405180910390fd5b7fc42fa155158786a1dd6ccc3a785f35845467353c3cc700e0e31a79f90e22227d3387878581811061181b5761181a612ba5565b5b905060200201602081019061183091906123a6565b86868681811061184357611842612ba5565b5b90506020020135604051611859939291906134fa565b60405180910390a150808061186d90612c03565b915050611693565b5050505050565b600060418251146118c2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016118b99061357d565b60405180910390fd5b6000806000602085015192506040850151915060ff6041860151169050601b8160ff1610156118fb57601b816118f8919061359d565b90505b7f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a08260001c1115611961576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161195890613646565b60405180910390fd5b600186828585604051600081526020016040526040516119849493929190613675565b6020604051602081039080840390855afa1580156119a6573d6000803e3d6000fd5b50505060206040510351935050505092915050565b6119c433610a96565b611a03576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016119fa906127ac565b60405180910390fd5b6000806002600a806020026040519081016040528092919082600a8015611a3f576020028201915b815481526020019060010190808311611a2b575b5050505050905060005b600a811015611af957838282600a8110611a6657611a65612ba5565b5b60200201511415611aac576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611aa390613706565b60405180910390fd5b8183600a8110611abf57611abe612ba5565b5b60200201518282600a8110611ad757611ad6612ba5565b5b60200201511015611ae6578092505b8080611af190612c03565b915050611a49565b508082600a8110611b0d57611b0c612ba5565b5b60200201518311611b53576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611b4a90613772565b60405180910390fd5b6127108183600a8110611b6957611b68612ba5565b5b6020020151611b789190612c4c565b831115611bba576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611bb1906137de565b60405180910390fd5b82600283600a8110611bcf57611bce612ba5565b5b0181905550505050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000611c0482611bd9565b9050919050565b611c1481611bf9565b82525050565b6000819050919050565b611c2d81611c1a565b82525050565b600082825260208201905092915050565b50565b6000611c54600083611c33565b9150611c5f82611c44565b600082019050919050565b6000606082019050611c7f6000830185611c0b565b611c8c6020830184611c24565b8181036040830152611c9d81611c47565b90509392505050565b82818337600083830152505050565b6000601f19601f8301169050919050565b6000611cd28385611c33565b9350611cdf838584611ca6565b611ce883611cb5565b840190509392505050565b6000606082019050611d086000830187611c0b565b611d156020830186611c24565b8181036040830152611d28818486611cc6565b905095945050505050565b6000604051905090565b600080fd5b600080fd5b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b611d7c81611d47565b8114611d8757600080fd5b50565b600081359050611d9981611d73565b92915050565b600060208284031215611db557611db4611d3d565b5b6000611dc384828501611d8a565b91505092915050565b60008115159050919050565b611de181611dcc565b82525050565b6000602082019050611dfc6000830184611dd8565b92915050565b611e0b81611bf9565b8114611e1657600080fd5b50565b600081359050611e2881611e02565b92915050565b611e3781611c1a565b8114611e4257600080fd5b50565b600081359050611e5481611e2e565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f840112611e7f57611e7e611e5a565b5b8235905067ffffffffffffffff811115611e9c57611e9b611e5f565b5b602083019150836001820283011115611eb857611eb7611e64565b5b9250929050565b600080600080600080600060c0888a031215611ede57611edd611d3d565b5b6000611eec8a828b01611e19565b9750506020611efd8a828b01611e45565b9650506040611f0e8a828b01611e19565b9550506060611f1f8a828b01611e45565b9450506080611f308a828b01611e45565b93505060a088013567ffffffffffffffff811115611f5157611f50611d42565b5b611f5d8a828b01611e69565b925092505092959891949750929550565b600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b611fab82611cb5565b810181811067ffffffffffffffff82111715611fca57611fc9611f73565b5b80604052505050565b6000611fdd611d33565b9050611fe98282611fa2565b919050565b600067ffffffffffffffff82111561200957612008611f73565b5b61201282611cb5565b9050602081019050919050565b600061203261202d84611fee565b611fd3565b90508281526020810184848401111561204e5761204d611f6e565b5b612059848285611ca6565b509392505050565b600082601f83011261207657612075611e5a565b5b813561208684826020860161201f565b91505092915050565b600080600080608085870312156120a9576120a8611d3d565b5b60006120b787828801611e19565b94505060206120c887828801611e19565b93505060406120d987828801611e45565b925050606085013567ffffffffffffffff8111156120fa576120f9611d42565b5b61210687828801612061565b91505092959194509250565b61211b81611d47565b82525050565b60006020820190506121366000830184612112565b92915050565b600061214782611bd9565b9050919050565b6121578161213c565b811461216257600080fd5b50565b6000813590506121748161214e565b92915050565b6000806040838503121561219157612190611d3d565b5b600061219f85828601612165565b92505060206121b085828601611e19565b9150509250929050565b60008083601f8401126121d0576121cf611e5a565b5b8235905067ffffffffffffffff8111156121ed576121ec611e5f565b5b60208301915083602082028301111561220957612208611e64565b5b9250929050565b6000806000806060858703121561222a57612229611d3d565b5b600061223887828801612165565b945050602061224987828801611e19565b935050604085013567ffffffffffffffff81111561226a57612269611d42565b5b612276878288016121ba565b925092505092959194509250565b60008060008060008060008060c0898b0312156122a4576122a3611d3d565b5b60006122b28b828c01611e19565b98505060206122c38b828c01611e45565b975050604089013567ffffffffffffffff8111156122e4576122e3611d42565b5b6122f08b828c01611e69565b965096505060606123038b828c01611e45565b94505060806123148b828c01611e45565b93505060a089013567ffffffffffffffff81111561233557612334611d42565b5b6123418b828c01611e69565b92509250509295985092959890939650565b60008060006060848603121561236c5761236b611d3d565b5b600061237a86828701612165565b935050602061238b86828701611e19565b925050604061239c86828701611e45565b9150509250925092565b6000602082840312156123bc576123bb611d3d565b5b60006123ca84828501611e19565b91505092915050565b6123dc81611dcc565b81146123e757600080fd5b50565b6000813590506123f9816123d3565b92915050565b6000806040838503121561241657612415611d3d565b5b600061242485828601611e19565b9250506020612435858286016123ea565b9150509250929050565b60006020820190506124546000830184611c24565b92915050565b60008083601f8401126124705761246f611e5a565b5b8235905067ffffffffffffffff81111561248d5761248c611e5f565b5b6020830191508360208202830111156124a9576124a8611e64565b5b9250929050565b60008060008060008060008060a0898b0312156124d0576124cf611d3d565b5b600089013567ffffffffffffffff8111156124ee576124ed611d42565b5b6124fa8b828c0161245a565b9850985050602089013567ffffffffffffffff81111561251d5761251c611d42565b5b6125298b828c016121ba565b9650965050604061253c8b828c01611e45565b945050606061254d8b828c01611e45565b935050608089013567ffffffffffffffff81111561256e5761256d611d42565b5b61257a8b828c01611e69565b92509250509295985092959890939650565b60008060008060008060008060a0898b0312156125ac576125ab611d3d565b5b60006125ba8b828c01611e19565b98505060206125cb8b828c01611e19565b975050604089013567ffffffffffffffff8111156125ec576125eb611d42565b5b6125f88b828c016121ba565b9650965050606089013567ffffffffffffffff81111561261b5761261a611d42565b5b6126278b828c016121ba565b9450945050608089013567ffffffffffffffff81111561264a57612649611d42565b5b6126568b828c01611e69565b92509250509295985092959890939650565b6000806020838503121561267f5761267e611d3d565b5b600083013567ffffffffffffffff81111561269d5761269c611d42565b5b6126a98582860161245a565b92509250509250929050565b60008060008060008060a087890312156126d2576126d1611d3d565b5b60006126e089828a01611e19565b96505060206126f189828a01611e19565b955050604061270289828a01611e45565b945050606061271389828a01611e45565b935050608087013567ffffffffffffffff81111561273457612733611d42565b5b61274089828a01611e69565b92509250509295509295509295565b600082825260208201905092915050565b7f4e6f6e2d7369676e657220696e206f6e6c795369676e6572206d6574686f6400600082015250565b6000612796601f8361274f565b91506127a182612760565b602082019050919050565b600060208201905081810360008301526127c581612789565b9050919050565b600081519050919050565b600081905092915050565b60005b838110156128005780820151818401526020810190506127e5565b8381111561280f576000848401525b50505050565b6000612820826127cc565b61282a81856127d7565b935061283a8185602086016127e2565b80840191505092915050565b60008160601b9050919050565b600061285e82612846565b9050919050565b600061287082612853565b9050919050565b61288861288382611bf9565b612865565b82525050565b6000819050919050565b6128a96128a482611c1a565b61288e565b82525050565b60006128bb8289612815565b91506128c78288612877565b6014820191506128d78287612898565b6020820191506128e78286612877565b6014820191506128f78285612898565b6020820191506129078284612898565b602082019150819050979650505050505050565b60006020820190506129306000830184611c0b565b92915050565b600082825260208201905092915050565b600080fd5b60006129588385612936565b93507f07ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff83111561298b5761298a612947565b5b60208302925061299c838584611ca6565b82840190509392505050565b60006040820190506129bd6000830186611c0b565b81810360208301526129d081848661294c565b9050949350505050565b600081905092915050565b60006129f183856129da565b93506129fe838584611ca6565b82840190509392505050565b6000612a16828a612815565b9150612a228289612877565b601482019150612a328288612898565b602082019150612a438286886129e5565b9150612a4f8285612898565b602082019150612a5f8284612898565b60208201915081905098975050505050505050565b6000612a818284866129e5565b91508190509392505050565b7f43616c6c20657865637574696f6e206661696c65640000000000000000000000600082015250565b6000612ac360158361274f565b9150612ace82612a8d565b602082019050919050565b60006020820190508181036000830152612af281612ab6565b9050919050565b6000819050919050565b612b0c81612af9565b82525050565b600060c082019050612b27600083018a611c0b565b612b346020830189611c0b565b612b416040830188612b03565b612b4e6060830187611c0b565b612b5b6080830186611c24565b81810360a0830152612b6e818486611cc6565b905098975050505050505050565b6000604082019050612b916000830185611c0b565b612b9e6020830184611c24565b9392505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000612c0e82611c1a565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff821415612c4157612c40612bd4565b5b600182019050919050565b6000612c5782611c1a565b9150612c6283611c1a565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03821115612c9757612c96612bd4565b5b828201905092915050565b7f4e6f7420656e6f75676820726563697069656e74730000000000000000000000600082015250565b6000612cd860158361274f565b9150612ce382612ca2565b602082019050919050565b60006020820190508181036000830152612d0781612ccb565b9050919050565b7f556e657175616c20726563697069656e747320616e642076616c756573000000600082015250565b6000612d44601d8361274f565b9150612d4f82612d0e565b602082019050919050565b60006020820190508181036000830152612d7381612d37565b9050919050565b7f546f6f206d616e7920726563697069656e74732c206d61782032353500000000600082015250565b6000612db0601c8361274f565b9150612dbb82612d7a565b602082019050919050565b60006020820190508181036000830152612ddf81612da3565b9050919050565b600081905092915050565b6000819050919050565b612e0481611bf9565b82525050565b6000612e168383612dfb565b60208301905092915050565b6000612e316020840184611e19565b905092915050565b6000602082019050919050565b6000612e528385612de6565b9350612e5d82612df1565b8060005b85811015612e9657612e738284612e22565b612e7d8882612e0a565b9750612e8883612e39565b925050600181019050612e61565b5085925050509392505050565b600081905092915050565b6000612eba8385612ea3565b93507f07ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff831115612eed57612eec612947565b5b602083029250612efe838584611ca6565b82840190509392505050565b6000612f16828a612815565b9150612f2382888a612e46565b9150612f30828688612eae565b9150612f3c8285612898565b602082019150612f4c8284612898565b60208201915081905098975050505050505050565b7f426174636820696e2073616665206d6f64650000000000000000000000000000600082015250565b6000612f9760128361274f565b9150612fa282612f61565b602082019050919050565b60006020820190508181036000830152612fc681612f8a565b9050919050565b6000606082019050612fe26000830186611c0b565b612fef6020830185611c0b565b612ffc6040830184612b03565b949350505050565b7f436f6e747261637420616c726561647920696e697469616c697a656400000000600082015250565b600061303a601c8361274f565b915061304582613004565b602082019050919050565b600060208201905081810360008301526130698161302d565b9050919050565b7f496e76616c6964206e756d626572206f66207369676e65727300000000000000600082015250565b60006130a660198361274f565b91506130b182613070565b602082019050919050565b600060208201905081810360008301526130d581613099565b9050919050565b7f496e76616c6964207369676e6572000000000000000000000000000000000000600082015250565b6000613112600e8361274f565b915061311d826130dc565b602082019050919050565b6000602082019050818103600083015261314181613105565b9050919050565b600060ff82169050919050565b600061316082613148565b915060ff82141561317457613173612bd4565b5b600182019050919050565b7f45787465726e616c207472616e7366657220696e2073616665206d6f64650000600082015250565b60006131b5601e8361274f565b91506131c08261317f565b602082019050919050565b600060208201905081810360008301526131e4816131a8565b9050919050565b7f5472616e73616374696f6e206578706972656400000000000000000000000000600082015250565b600061322160138361274f565b915061322c826131eb565b602082019050919050565b6000602082019050818103600083015261325081613214565b9050919050565b7f5369676e6572732063616e6e6f7420626520657175616c000000000000000000600082015250565b600061328d60178361274f565b915061329882613257565b602082019050919050565b600060208201905081810360008301526132bc81613280565b9050919050565b600081519050919050565b60006132d9826132c3565b6132e381856129da565b93506132f38185602086016127e2565b80840191505092915050565b600061330b82846132ce565b915081905092915050565b600081519050613325816123d3565b92915050565b60006020828403121561334157613340611d3d565b5b600061334f84828501613316565b91505092915050565b7f5472616e7366657248656c7065723a3a736166655472616e736665723a20747260008201527f616e73666572206661696c656400000000000000000000000000000000000000602082015250565b60006133b4602d8361274f565b91506133bf82613358565b604082019050919050565b600060208201905081810360008301526133e3816133a7565b9050919050565b7f496e73756666696369656e742066756e64730000000000000000000000000000600082015250565b600061342060128361274f565b915061342b826133ea565b602082019050919050565b6000602082019050818103600083015261344f81613413565b9050919050565b60006134636000836129da565b915061346e82611c44565b600082019050919050565b600061348482613456565b9150819050919050565b7f43616c6c206661696c6564000000000000000000000000000000000000000000600082015250565b60006134c4600b8361274f565b91506134cf8261348e565b602082019050919050565b600060208201905081810360008301526134f3816134b7565b9050919050565b600060608201905061350f6000830186611c0b565b61351c6020830185611c0b565b6135296040830184611c24565b949350505050565b7f496e76616c6964207369676e6174757265202d2077726f6e67206c656e677468600082015250565b600061356760208361274f565b915061357282613531565b602082019050919050565b600060208201905081810360008301526135968161355a565b9050919050565b60006135a882613148565b91506135b383613148565b92508260ff038211156135c9576135c8612bd4565b5b828201905092915050565b7f45434453413a20696e76616c6964207369676e6174757265202773272076616c60008201527f7565000000000000000000000000000000000000000000000000000000000000602082015250565b600061363060228361274f565b915061363b826135d4565b604082019050919050565b6000602082019050818103600083015261365f81613623565b9050919050565b61366f81613148565b82525050565b600060808201905061368a6000830187612b03565b6136976020830186613666565b6136a46040830185612b03565b6136b16060830184612b03565b95945050505050565b7f53657175656e636520494420616c726561647920757365640000000000000000600082015250565b60006136f060188361274f565b91506136fb826136ba565b602082019050919050565b6000602082019050818103600083015261371f816136e3565b9050919050565b7f53657175656e63652049442062656c6f772077696e646f770000000000000000600082015250565b600061375c60188361274f565b915061376782613726565b602082019050919050565b6000602082019050818103600083015261378b8161374f565b9050919050565b7f53657175656e63652049442061626f7665206d6178696d756d00000000000000600082015250565b60006137c860198361274f565b91506137d382613792565b602082019050919050565b600060208201905081810360008301526137f7816137bb565b905091905056fea26469706673582212202ca642f8ef8aa5f0d11f11ac6e19afc9fe221ed5575e1acb3aa1e2d2e4f78e8664736f6c634300080a0033';
