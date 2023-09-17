import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaDevWorkshop } from "../target/types/solana_dev_workshop";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { KeypairIdentityDriver, Metaplex, keypairIdentity } from "@metaplex-foundation/js"
import { MINT_SIZE, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createInitializeMintInstruction, createMint, getAssociatedTokenAddress, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import { BN, min } from "bn.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { keypair } from "./wallet"
import { ASSOCIATED_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";

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

  let mint = Keypair.generate();
  let receiver = getAssociatedTokenAddressSync(mint.publicKey, provider.publicKey);

  let userPDA = findProgramAddressSync([anchor.utils.bytes.utf8.encode("Counter"), provider.publicKey.toBuffer()], program.programId);

  it("Initialize user account", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().accounts({
      userAccount: userKeypair.publicKey,
      user: provider.publicKey,
      systemProgram: SystemProgram.programId,
    }).signers([userKeypair]).rpc();
    console.log("\n\nUser counter account initialized: TxID - ", tx);
  });

  it("Increment user account", async () => {
    let counter = await program.account.counter.fetch(userKeypair.publicKey);
    console.log("\n\nUser counter value before incrementing: ", counter.counter);

    const tx = await program.methods.increment().accounts({
      userAccount: userKeypair.publicKey,
      user: provider.publicKey,
    }).rpc();
    console.log("User account incremented! TxID: ", tx);
    
    counter = await program.account.counter.fetch(userKeypair.publicKey);
    console.log("User counter value after incrementing: ", counter.counter);
  })

  it("Initialize user account PDA", async () => {

    const tx = await program.methods.initializePda().accounts({
      userAccount: userPDA[0],
      user: provider.publicKey,
      systemProgram: SystemProgram.programId,
    }).rpc();

    console.log("\n\nUser PDA account initialized! TxID: ", tx);
  })

  it("Increment user account PDA", async () => {
    const tx = await program.methods.incrementPda().accounts({
      userAccount: userPDA[0],
      user: provider.publicKey,
    }).rpc()

    console.log("\n\nUser PDA account incremented!");
  });

  it("Mint some tokens", async () => {
    const tx = await program.methods.mintSpl().accounts({
      mint: mint.publicKey,
      receiver: receiver,
      user: provider.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).signers([mint]).rpc();

    console.log("\n\nToken minted! TxID: ", tx);
    console.log("Number of tokens after minting: ", (await provider.connection.getTokenAccountBalance(receiver)).value.amount);
  });

  it("Mint some tokens from a PDA", async() => {
    let mint = Keypair.generate();
    let receiver = getAssociatedTokenAddressSync(mint.publicKey, provider.publicKey);

    let authority = findProgramAddressSync([anchor.utils.bytes.utf8.encode("authority")], program.programId);

    const tx = await program.methods.mintPda().accounts({
      authority: authority[0],
      userAccount: userPDA[0],
      user: provider.publicKey,
      mint: mint.publicKey,
      receiver: receiver,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).signers([mint]).rpc();

    console.log("\n\nToken minted! TxID: ", tx);
    console.log("Number of tokens after minting: ", (await provider.connection.getTokenAccountBalance(receiver)).value.amount);
  })

  it("Transfer some tokens", async() => {
    let receiverPDA = getAssociatedTokenAddressSync(mint.publicKey, userPDA[0], true);

    const tx = await program.methods.transferSpl().accounts({
      from: receiver,
      receiverPda: receiverPDA,
      user: provider.publicKey,
      receiver: userPDA[0],
      mint: mint.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
    }).rpc();
    console.log("\n\nTokens transferred! TxID: ", tx);
  })

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
