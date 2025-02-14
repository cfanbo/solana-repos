// 在每次执行完指令后，执行这个脚本，查看当前账户的 balance 余额信息

console.log("My address:", pg.wallet.publicKey.toString());
const balance = await pg.connection.getBalance(pg.wallet.publicKey);
console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);

import { PublicKey } from "@solana/web3.js";

const connection = pg.connection;

// 刚刚创建的账户
const accountPubkey = new PublicKey(
  "8qgn3sNb6BnYHUVbrXd74PH1YXYFa26ULiLYrzSGCmSk"
);

async function checkAccountBalance() {
  try {
    const accountInfo = await connection.getAccountInfo(accountPubkey);
    if (accountInfo) {
      console.log("Account balance: ", accountInfo.lamports);
      if (accountInfo.lamports === 0) {
        console.log("Account has no balance, it might be closed.");
      }
    } else {
      console.log("Account does not exist (probably closed).");
    }
  } catch (error) {
    console.error("Error checking account: ", error);
  }
}

checkAccountBalance();
