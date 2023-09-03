import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaDevWorkshop } from "../target/types/solana_dev_workshop";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";

describe("solana-dev-workshop", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaDevWorkshop as Program<SolanaDevWorkshop>;

  const userKeypair = Keypair.generate();

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

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().accounts({
      account: userKeypair.publicKey,
      user: provider.publicKey,
      systemProgram: SystemProgram.programId
    }).signers([userKeypair]).rpc();

    console.log("\n\nCounter account succesfully initialized! TxID: ", tx);
  });
});
