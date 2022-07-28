import { getBuilder } from '../getBuilder';
import { Ecdsa, ECDSA, TransactionType } from '@bitgo/sdk-core';
import { keyShares } from '../../fixtures/ecdsa';

describe('BSC Transfer Builder', () => {
  describe('TSS Signing with 2 of 3', () => {
    let MPC: Ecdsa;
    let A_combine: ECDSA.KeyCombined, B_combine: ECDSA.KeyCombined, C_combine: ECDSA.KeyCombined;
    let serializedTransaction: Buffer;

    before('key generation and unsigned tx building', async () => {
      MPC = new Ecdsa();

      const { A, B, C } = keyShares;

      A_combine = MPC.keyCombine(A.pShare, [B.nShares[1], C.nShares[1]]);
      B_combine = MPC.keyCombine(B.pShare, [A.nShares[2], C.nShares[2]]);
      C_combine = MPC.keyCombine(C.pShare, [A.nShares[3], B.nShares[3]]);

      const txBuilder = getBuilder('tbsc');
      txBuilder.type(TransactionType.Send);
      txBuilder.publicKey(A_combine.xShare.y);
      txBuilder.contract('0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3');
      txBuilder.counter(1);
      txBuilder.fee({
        fee: '20',
        gasLimit: '30',
      });

      txBuilder
        .transfer()
        .amount('1000')
        .to('0xA2959D3F95eAe5dC7D70144Ce1b73b403b7EB6E0')
        .expirationTime(1590066728)
        .contractSequenceId(5);

      const unsignedTransaction = await txBuilder.build();
      serializedTransaction = Buffer.from(unsignedTransaction.toBroadcastFormat());
    });

    it('A and B signing', () => {
      const B_sign_share = MPC.signShare(B_combine.xShare, B_combine.yShares[1]);

      const A_sign_convert = MPC.signConvert({
        xShare: A_combine.xShare,
        yShare: A_combine.yShares[2],
        kShare: B_sign_share.kShare,
      });

      const B_sign_convert = MPC.signConvert({
        wShare: B_sign_share.wShare,
        aShare: A_sign_convert.aShare,
      });

      const A_second_sign_convert = MPC.signConvert({
        bShare: A_sign_convert.bShare,
        muShare: B_sign_convert.muShare,
      });

      const A_sign_combine = MPC.signCombine({
        gShare: A_second_sign_convert.gShare!,
        signIndex: {
          i: 1,
          j: 2,
        },
      });

      const B_sign_combine = MPC.signCombine({
        gShare: B_sign_convert.gShare!,
        signIndex: {
          i: 2,
          j: 1,
        },
      });

      const A_sign = MPC.sign(serializedTransaction, A_sign_combine.oShare, B_sign_combine.dShare);
      const B_sign = MPC.sign(serializedTransaction, B_sign_combine.oShare, A_sign_combine.dShare);
      const signature = MPC.constructSignature([A_sign, B_sign]);

      MPC.verify(serializedTransaction, signature).should.be.true;
    });

    it('A and C signing', () => {
      const C_sign_share = MPC.signShare(C_combine.xShare, C_combine.yShares[1]);

      const A_sign_convert = MPC.signConvert({
        xShare: A_combine.xShare,
        yShare: A_combine.yShares[3],
        kShare: C_sign_share.kShare,
      });

      const C_sign_convert = MPC.signConvert({
        wShare: C_sign_share.wShare,
        aShare: A_sign_convert.aShare,
      });

      const A_second_sign_convert = MPC.signConvert({
        bShare: A_sign_convert.bShare,
        muShare: C_sign_convert.muShare,
      });

      const A_sign_combine = MPC.signCombine({
        gShare: A_second_sign_convert.gShare!,
        signIndex: {
          i: 1,
          j: 3,
        },
      });

      const C_sign_combine = MPC.signCombine({
        gShare: C_sign_convert.gShare!,
        signIndex: {
          i: 3,
          j: 1,
        },
      });

      const A_sign = MPC.sign(serializedTransaction, A_sign_combine.oShare, C_sign_combine.dShare);
      const C_sign = MPC.sign(serializedTransaction, C_sign_combine.oShare, A_sign_combine.dShare);
      const signature = MPC.constructSignature([A_sign, C_sign]);

      MPC.verify(serializedTransaction, signature).should.be.true;
    });

    it('B and C signing', () => {
      const C_sign_share = MPC.signShare(C_combine.xShare, C_combine.yShares[2]);

      const B_sign_convert = MPC.signConvert({
        xShare: B_combine.xShare,
        yShare: B_combine.yShares[3],
        kShare: C_sign_share.kShare,
      });

      const C_sign_convert = MPC.signConvert({
        wShare: C_sign_share.wShare,
        aShare: B_sign_convert.aShare,
      });

      const B_second_sign_convert = MPC.signConvert({
        bShare: B_sign_convert.bShare,
        muShare: C_sign_convert.muShare,
      });

      const B_sign_combine = MPC.signCombine({
        gShare: B_second_sign_convert.gShare!,
        signIndex: {
          i: 2,
          j: 3,
        },
      });

      const C_sign_combine = MPC.signCombine({
        gShare: C_sign_convert.gShare!,
        signIndex: {
          i: 3,
          j: 2,
        },
      });

      const B_sign = MPC.sign(serializedTransaction, B_sign_combine.oShare, C_sign_combine.dShare);
      const C_sign = MPC.sign(serializedTransaction, C_sign_combine.oShare, B_sign_combine.dShare);
      const signature = MPC.constructSignature([B_sign, C_sign]);

      MPC.verify(serializedTransaction, signature).should.be.true;
    });
  });
});
