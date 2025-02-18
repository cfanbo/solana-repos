import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { getLogs } from "@solana-developers/helpers";
import { TokenProgramExample } from "../target/types/token_program_example";
import { Keypair, SystemProgram, PublicKey } from "@solana/web3.js";


import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  getMint,
  getAccount,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";


describe("token-program-example", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TokenProgramExample as Program<TokenProgramExample>;
  const connection = program.provider.connection;

  const wallet = provider.wallet as anchor.Wallet;
  const payer = wallet.payer;

  // const [mint, bump] = anchor.web3.PublicKey.findProgramAddressSync(
  //   [Buffer.from("mint")],
  //   program.programId
  // );

  console.log("payer:", payer.publicKey.toBase58());
  const mint = Keypair.generate();

  console.log("ProgramID: ", program.programId.toBase58());

  const metadata = {
    name: "MyToken",
    symbol: "MT",
    uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json",
  };

  it.only("Create Mint", async () => {
    const tx = await program.methods
      .createMint(metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        // signer: payer.publicKey,
        mint: mint.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        // systemProgram: SystemProgram.programId,
      }).signers([payer, mint]).rpc({ commitment: "confirmed" });

    console.log('Success!');
    console.log(`   Mint Address: ${mint.publicKey}`);
    console.log("Your transaction signature", tx);

    const mintAccount = await getMint(
      connection,
      mint.publicKey,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    console.log("Mint Account", mintAccount);
  });

  it("Create token account", async () => {
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      payer.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    console.log("associatedTokenAccount: ", associatedTokenAccount.toBase58());

    const tx = await program.methods
      .createTokenAccount()
      .accounts({
        signer: payer.publicKey,
        mint: mint.publicKey,
        // tokenAccount: associatedTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        // systemProgram: SystemProgram.programId,
        // associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    console.log("Your transaction signature", tx);

    const tokenAccount = await getAccount(
      connection,
      associatedTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    console.log("Token Account", tokenAccount);
  });

  it("Mint Tokens", async () => {
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      payer.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const tx = await program.methods
      .mintTokens(new anchor.BN(1000000))
      .accounts({
        signer: payer.publicKey,
        mint: mint.publicKey,
        tokenAccount: associatedTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    console.log("Your transaction signature", tx);

    const tokenAccount = await getAccount(
      connection,
      associatedTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    console.log("Token Account", tokenAccount.amount);
  });
});
