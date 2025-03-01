/**
 * Currently, assets on algorand network need to be enabled and disabled in order to be used or not. 
 * Please note that enable/disable transactions have a fee associated, and increase the minimum balance wallet must have by 0.1 Algos for each enable token as well. In example : 
 * Wallet without tokens enabled has minimum balance of 0.1 Algos
 * Wallet with 1 token enabled has minimum balance of 0.2 Algos
 * Wallet with 2 token enabled has minimum balance of 0.3 Algos
 * And so
 */

import { BitGo, Wallet } from 'bitgo';
import { WalletCoinSpecific } from '../../../src/v2/wallet';
   
// change this to env: 'production' when you are ready for production
const bitgo = new BitGo({ env: 'test' });
   
// change this to 'algo:16026733' when you are ready for production
const coin = 'talgo:KAL-16026733';
   
// this can be found on test.bitgo.com in the URL after clicking on a wallet
// https://test.bitgo.com/enterprise/XXXXXXXXX/coin/talgo/YYYYY/transactions
const walletId = 'your wallet id';
   
// this is your wallet passphrase, which could be different than your login credentials
const walletPassphrase = 'set your wallet passphrase here';
   
// this will need to be a real OTP code on production
const otp = '000000';
   
// this can be retrieved by logging into app.bitgo-test.com (app.bitgo.com for production)
// and going to: User > User Settings > Access Tokens > (+ icon)
// the token will need Spender permission for ALGO
const accessToken = 'insert access token string here';
  
const address = 'your root address or address of same wallet';

const closeRemainderTo = 'your address where send token balance once you disable it';
  
async function main(): Promise<void> {
  bitgo.authenticateWithAccessToken({ accessToken });
  
  const wallet: Wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  
  console.log('Wallet ID:', wallet.id());
 
  if (!wallet || !wallet.coinSpecific()) {
    throw new Error('Failed to retrieve wallet');
  }
 
  const coinSpecific = wallet.coinSpecific() as WalletCoinSpecific;
  if (!coinSpecific) {
    throw new Error('Coin specific area not found - aborting.');
  }
  
  // this is your wallet's root address - this is where spendable funds come from
  console.log('Root Address:', wallet.coinSpecific()?.rootAddress);
  
  // your balance or confirmed balance will be sum of the amounts
  // across all addresses and your wallet's root address
  console.log('Balance:', wallet.balanceString());
  console.log('Confirmed Balance:', wallet.confirmedBalanceString());
  
  // your spendable balance will be the balance on the wallet root address
  // and should differ from your confirmed balance
  console.log('Spendable Balance:', wallet.spendableBalanceString());
  
  // we have to unlock this session since we're sending funds
  const unlock = await bitgo.unlock({ otp, duration: 3600 });
  if (!unlock) {
    throw new Error('We did not unlock.');
  }
  const txDisableToken = await wallet.sendMany({
    type: 'disabletoken',
    recipients: [
      {
        amount: '0',
        address: address,
      },
    ],
    feeRate: 1,
    walletPassphrase,
    closeRemainderTo,
  });
  console.dir(txDisableToken, { depth: 6 });
}
 
main().catch((e) => console.error(e));
 
