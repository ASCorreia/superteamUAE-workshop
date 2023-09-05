import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaDevWorkshop } from "../target/types/solana_dev_workshop";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { BN, min } from "bn.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";

describe("solana-dev-workshop", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaDevWorkshop as Program<SolanaDevWorkshop>;

  const userKeypair = Keypair.generate();

  const userKeypair2 = Keypair.generate();

  const userPDA = findProgramAddressSync([anchor.utils.bytes.utf8.encode("counter")/*, provider.publicKey.toBuffer()*/], program.programId);

  let mint: PublicKey = undefined;

  it("Request airdrop", async () => {
    let airdropTx = await provider.connection.requestAirdrop(userKeypair.publicKey, 2 * LAMPORTS_PER_SOL);
    let latestBlockHash = await provider.connection.getLatestBlockhash();
    
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropTx,
    });

    console.log("\n\nAirdrop Operation Successfull");
  });

  it("Request airdrop", async () => {
    let airdropTx = await provider.connection.requestAirdrop(userKeypair2.publicKey, 2 * LAMPORTS_PER_SOL);
    let latestBlockHash = await provider.connection.getLatestBlockhash();
    
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropTx,
    });

    console.log("\n\nAirdrop Operation Successfull");
  });

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().accounts({
      account: userKeypair.publicKey,
      user: provider.publicKey,
      systemProgram: SystemProgram.programId
    }).signers([userKeypair]).rpc();

    console.log("\n\nCounter account succesfully initialized! TxID: ", tx);
  });

  it("Increment Account counter!", async() => {
    const tx = await program.methods.increment().accounts({
      account: userKeypair.publicKey,
    }).rpc();

    let fetched = await program.account.counter.fetch(userKeypair.publicKey);
    console.log(fetched.counter);

    console.log("\n\nAccount counter incremented! TxID: ", tx);
  });

  it("Initialize PDA Counter Account!", async() => {
    const tx = await program.methods.initializePda().accounts({
      account: userPDA[0],
      user: provider.publicKey,
      systemProgram: SystemProgram.programId,
    }).rpc();

    console.log("\n\nPDA Account Initialized! TxID: ", tx);
  });

  it("Mint some SPL Tokens!", async() => {
    const createdMint = await createMint(provider.connection, userKeypair2, userPDA[0], userPDA[0], 6);
    mint = createdMint;
    console.log("\n\nMint created!");

    const to_ata = await getOrCreateAssociatedTokenAccount(provider.connection, userKeypair2, mint, userPDA[0], true);
    console.log("ATA created!");

    const tx = await program.methods.mintTo().accounts({
      mint: mint,
      toAta: to_ata.address,
      /*user: provider.publicKey,*/
      authority: userPDA[0],
      tokenProgram: TOKEN_PROGRAM_ID,
    }).rpc({skipPreflight: true});

    console.log("\n\nTokens minted! TxID: ", tx);
  });

  it("Transfer some SPL Tokens!", async() => {
    const from_ata = await getOrCreateAssociatedTokenAccount(provider.connection, userKeypair2, mint, userPDA[0], true);
    const to_ata = await getOrCreateAssociatedTokenAccount(provider.connection, userKeypair2, mint, userKeypair.publicKey);

    console.log("\n\nOrigin ATA Balance before transfer: ", (await provider.connection.getTokenAccountBalance(from_ata.address)).value.amount);
    console.log("Destination ATA Balance before transfer: ", (await provider.connection.getTokenAccountBalance(to_ata.address)).value.amount);

    const tx = await program.methods.transferSpl().accounts({
      fromAta: from_ata.address,
      toAta: to_ata.address,
      authority: userPDA[0],
      tokenProgram: TOKEN_PROGRAM_ID,
    }).rpc();

    console.log("\n\nOrigin ATA Balance before transfer: ", (await provider.connection.getTokenAccountBalance(from_ata.address)).value.amount);
    console.log("Destination ATA Balance before transfer: ", (await provider.connection.getTokenAccountBalance(to_ata.address)).value.amount);

    console.log("\n\nTokens Transferred! TxID: ", tx);
  })

});
