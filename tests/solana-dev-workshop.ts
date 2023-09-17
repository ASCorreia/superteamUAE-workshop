import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaDevWorkshop } from "../target/types/solana_dev_workshop";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { KeypairIdentityDriver, Metaplex, keypairIdentity } from "@metaplex-foundation/js"
import { MINT_SIZE, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createInitializeMintInstruction, createMint, getAssociatedTokenAddress, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import { BN, min } from "bn.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { keypair } from "./wallet"

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const getMetadata = async (mint: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> => {
  return (
    anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
};
const getMasterEdition = async (mint: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> => {
  return (
    anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
};

const NFTmintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();

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
    try {
      let airdropTx = await provider.connection.requestAirdrop(userKeypair.publicKey, 0.1 * LAMPORTS_PER_SOL);
      let latestBlockHash = await provider.connection.getLatestBlockhash();
    
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropTx,
      });

      console.log("\n\nAirdrop Operation Successfull");
    }
    catch(error) {
      console.log("Error while trying to request airdrop!");
      console.log("Trying to transfer from anchor provider");
      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: provider.wallet.publicKey,
            toPubkey:  userKeypair.publicKey,
            lamports: 0.1 * LAMPORTS_PER_SOL,
          })
        );
        transaction.recentBlockhash = (await provider.connection.getLatestBlockhash('finalized')).blockhash;
        transaction.feePayer = provider.wallet.publicKey;
            
        // Sign transaction, broadcast, and confirm
        const signature = await provider.sendAndConfirm(transaction);
        console.log(`Transfer Success! Check out your TX here: 
        https://explorer.solana.com/tx/${signature}?cluster=devnet`);
      } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
      }
    }
  });

  it("Request airdrop", async () => {
    try {
      let airdropTx = await provider.connection.requestAirdrop(userKeypair2.publicKey, 0.1 * LAMPORTS_PER_SOL);
      let latestBlockHash = await provider.connection.getLatestBlockhash();
    
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropTx,
      });

      console.log("\n\nAirdrop Operation Successfull");
    }
    catch(error) {
      console.log("Error while trying to request airdrop!");
      console.log("Trying to transfer from anchor provider");
      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: provider.wallet.publicKey,
            toPubkey:  userKeypair2.publicKey,
            lamports: 0.1 * LAMPORTS_PER_SOL,
          })
        );
        transaction.recentBlockhash = (await provider.connection.getLatestBlockhash('finalized')).blockhash;
        transaction.feePayer = provider.wallet.publicKey;
            
        // Sign transaction, broadcast, and confirm
        const signature = await provider.sendAndConfirm(transaction);
        console.log(`Transfer Success! Check out your TX here: 
        https://explorer.solana.com/tx/${signature}?cluster=devnet`);
      } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
      }
    }
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
    let autorithyPDA = findProgramAddressSync([anchor.utils.bytes.utf8.encode("escrow")], program.programId);

    const createdMint = await createMint(provider.connection, userKeypair2, autorithyPDA[0], autorithyPDA[0], 6);
    mint = createdMint;
    console.log("\n\nMint created!");

    const to_ata = await getOrCreateAssociatedTokenAccount(provider.connection, userKeypair2, mint, userPDA[0], true);
    console.log("ATA created!");

    const tx = await program.methods.mintTo().accounts({
      mint: mint,
      toAta: to_ata.address,
      //user: provider.publicKey,
      account: userPDA[0],
      authority: autorithyPDA[0],
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
  });

  it("Mint an NFT", async() => {
    const lamports: number = await program.provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

    //Get the ATA for a token on a public key (but might not exist yet)
    let receiver = new anchor.web3.PublicKey("6eGKgDhFAaLYkxoDMyx2NU4RyrSKfCXdRmqtjT7zodxQ");
    let associatedTokenAccount = await getAssociatedTokenAddress(NFTmintKey.publicKey, receiver); //key.wallet.publicKey

    //Fires a list of instructions
    const mint_nft_tx = new anchor.web3.Transaction().add(
        //Use anchor to creante an account from the key we created
        anchor.web3.SystemProgram.createAccount({
            fromPubkey: provider.wallet.publicKey,
            newAccountPubkey: NFTmintKey.publicKey,
            space: MINT_SIZE,
            programId: TOKEN_PROGRAM_ID,
            lamports,
        }),
        //creates, through a transaction, our mint account that is controlled by our anchor wallet (key)
        createInitializeMintInstruction(NFTmintKey.publicKey, 0, provider.wallet.publicKey, provider.wallet.publicKey),
        
        //Creates the ATA account that is associated with our mint on our anchor wallet (key)
        createAssociatedTokenAccountInstruction(provider.wallet.publicKey, associatedTokenAccount, receiver, NFTmintKey.publicKey)
    );

    //Sends and create the transaction
    console.log("Sending transaction");
    const res = await provider.sendAndConfirm(mint_nft_tx, [NFTmintKey]);

    console.log(await program.provider.connection.getParsedAccountInfo(NFTmintKey.publicKey));

    console.log("Account: ", res);
    console.log("Mint Key: ", NFTmintKey.publicKey.toString());
    console.log("User: ", provider.wallet.publicKey.toString());


    //Starts the Mint Operation
    console.log("Starting the NFT Mint Operation");
    const metadataAddress = await getMetadata(NFTmintKey.publicKey);
    const masterEdition = await getMasterEdition(NFTmintKey.publicKey);
    //Executes our smart contract to mint our token into our specified ATA
    const tx = await program.rpc.mintNft(
      new anchor.web3.PublicKey("6eGKgDhFAaLYkxoDMyx2NU4RyrSKfCXdRmqtjT7zodxQ"),
      "https://arweave.net/HL0MkXm11IofyXgTzGWZPFXlCE9YKGt1vKc44w6ttA8",
      "Superteam UAE Dev Workshop",
      {
        accounts: {
          mintAuthority: provider.wallet.publicKey,
          mint: NFTmintKey.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          metadata: metadataAddress,
          tokenAccount: associatedTokenAccount,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          payer: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          masterEdition: masterEdition,
        },
      }
    );
    console.log("Your transaction signature", tx);       
    console.log("NFT Mint Operation Finished!");

    const metaplex = Metaplex.make(provider.connection).use(keypairIdentity(keypair));
    let verified = await metaplex.nfts().verifyCreator({mintAddress: NFTmintKey.publicKey, creator: keypair});
    console.log("NFT Verified: TxID: ", verified.response.signature);
  });

  it("Close account", async() => {
    let tx = await program.methods.closePda().accounts({
      account: userPDA[0],
      destination: provider.publicKey,
    }).rpc();

    console.log("User PDA account succesfully closed!");
  })

});
