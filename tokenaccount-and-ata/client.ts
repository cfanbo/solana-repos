import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import {
  mintTo,
  createMint,
  transfer,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

async function main() {
  // 1. 初始化网络，这里使用本地网络
  // 1.1 填写合约ID, 即 programID
  const programId = new PublicKey(
    "GRw8aJXJaMHYtAkyMer9VqsiUc3e6qRYiuMNYGVhb8oC",
  );

  // 1.2 设置rpc
  // Connect to a solana cluster. Either to your local test validator or to devnet
  //const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const connection = new Connection("http://localhost:8899", "confirmed");

  // 2. 账户创建，包括从本地读取和随机生成
  const payer = await getKeypairFromFile("~/.config/solana/id.json");
  console.log("PAYER:", payer.publicKey.toBase58());

  // 连接钱包（例如通过 Phantom 钱包或其他）
  const user1 = Keypair.generate(); // 第一个用户的密钥
  const user2 = Keypair.generate(); // 第二个用户的密钥
  console.log("USER1:", user1.publicKey.toBase58());
  console.log("UESR2:", user2.publicKey.toBase58());

  // 为支付者账户充值一些 SOL
  // const airdropSignature = await connection.requestAirdrop(
  //   payer.publicKey,
  //   2 * 10 ** 9, // 2 SOL, 手续给别人转账时支付交易手续费
  // );
  // await connection.confirmTransaction(airdropSignature);

  // 3. 创建 Mint
  const mint = await createMintAccount(connection, payer);

  // 4. 为每个账号创建对应的 ATA 账号，并添加一些代币
  await mintTokens(connection, mint, payer, 500 * 10 ** 9, payer);
  await mintTokens(connection, mint, user1, 100 * 10 ** 9, payer);
  await mintTokens(connection, mint, user2, 20 * 10 ** 9, payer);

  // 5. 转账，这里在ATA账号之间实现转账功能
  let payerATA = await getAssociatedTokenAddress(mint, payer.publicKey);
  let user1ATA = await getAssociatedTokenAddress(mint, user1.publicKey);
  let user2ATA = await getAssociatedTokenAddress(mint, user2.publicKey);

  console.log("payer: ", payerATA.toBase58());
  // 打印转账后的余额
  console.log("\n转账前:");
  console.log(
    "payer代币余额:",
    (await connection.getTokenAccountBalance(payerATA)).value.uiAmount,
  );
  console.log(
    "支付者代币余额:",
    (await connection.getTokenAccountBalance(user1ATA)).value.uiAmount,
  );
  console.log(
    "接收者代币余额:",
    (await connection.getTokenAccountBalance(user2ATA)).value.uiAmount,
  );

  // 5.1 payer => user1ATA
  const tx1 = await transfer(
    connection,
    payer,
    payerATA,
    user1ATA,
    payer,
    100 * 10 ** 9, // 转账 500 个代币
  );
  console.log("tx1", tx1);

  // 5.2 user1ATA => user2ATA
  // 给 user1 空投一些 SOL 用于支付交易费用
  const airdropSignature2 = await connection.requestAirdrop(
    user1.publicKey,
    1 * 10 ** 9, // 1 SOL 作为转账手续费
  );
  await connection.confirmTransaction(airdropSignature2);

  // 查看账户余额
  console.log(
    "user1 初始余额：",
    await getFormattedBalance(connection, user1.publicKey),
  );

  // 转账
  const tx2 = await transfer(
    connection,
    user1,
    user1ATA,
    user2ATA,
    user1,
    50 * 10 ** 9,
  );
  console.log("tx2", tx2);
  // 转账后，手续费
  console.log(
    "user1 转账后：",
    await getFormattedBalance(connection, user1.publicKey),
  );

  // 打印转账后的余额
  console.log("\n转账后:");
  console.log(
    "payer代币余额:",
    (await connection.getTokenAccountBalance(payerATA)).value.uiAmount,
  );
  console.log(
    "支付者代币余额:",
    (await connection.getTokenAccountBalance(user1ATA)).value.uiAmount,
  );
  console.log(
    "接收者代币余额:",
    (await connection.getTokenAccountBalance(user2ATA)).value.uiAmount,
  );
}

main();

// 创建ATA账号，并添加一些代币
async function mintTokens(
  connection: Connection,
  mint: PublicKey,
  user: Keypair,
  amount: number,
  payer: Keypair,
) {
  // 获取或创建用户的 ATA
  const userATA = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    user.publicKey,
  );
  console.log("User ATA address:", userATA.address.toBase58());

  // 添加代币
  await mintTo(connection, payer, mint, userATA.address, payer, amount);
  console.log(`Minted ${amount} tokens to ${userATA.address.toBase58()}`);
}

async function createMintAccount(connection: Connection, payer: Keypair) {
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey, // mint的所有者
    null, // mint没有冻结权限
    9, // 精度，通常是9
  );
  console.log("Mint address:", mint.toBase58(), "\n");
  return mint;
}

// 格式化账户原生币金额，用来查看手续费变动情况
async function getFormattedBalance(connection: Connection, address: PublicKey) {
  const balance = await connection.getBalance(address);
  return {
    lamports: balance,
    sol: balance / LAMPORTS_PER_SOL,
    formatted: `${(balance / LAMPORTS_PER_SOL).toFixed(9)} SOL`,
  };
}
