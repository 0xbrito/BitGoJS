export const DEFAULT_SEED_SIZE_BYTES = 16;
export const sendMsgTypeUrl = '/cosmos.bank.v1beta1.MsgSend';
export const delegateMsgTypeUrl = '/cosmos.staking.v1beta1.MsgDelegate';
export const undelegateMsgTypeUrl = '/cosmos.staking.v1beta1.MsgUndelegate';
export const withdrawDelegatorRewardMsgTypeUrl = '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward';
export const validDenoms = ['natom', 'uatom', 'matom', 'atom'];
export const accountAddressRegex = /^(cosmos)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l']+)$/;
export const validatorAddressRegex = /^(cosmosvaloper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l']+)$/;
