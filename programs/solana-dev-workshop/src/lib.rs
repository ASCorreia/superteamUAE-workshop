use anchor_lang::prelude::*;

declare_id!("8Pf8RCh4hEHqe9uVtVqs6SnytqfdmY3z28ky8A7JKDUQ");

pub mod contexts;
pub use contexts::*;

#[program]
pub mod solana_dev_workshop {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize()?;

        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.increment()?;

        Ok(())
    }

    pub fn initialize_pda(ctx: Context<InitializePDA>) -> Result<()> {
        ctx.accounts.user_account.bump = *ctx.bumps.get("user_account").unwrap();

        ctx.accounts.initialize_pda()?;

        Ok(())
    }

    pub fn increment_pda(ctx: Context<IncrementPDA>) -> Result<()> {
        ctx.accounts.increment_pda()?;

        Ok(())
    }

    pub fn close_pda(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.close()?;

        Ok(())
    }

    pub fn mint_spl(ctx: Context<MintSPL>) -> Result<()> {
        ctx.accounts.mint_spl()?;

        Ok(())
    }

    pub fn mint_pda(ctx: Context<MintPDA>) -> Result<()> {
        ctx.accounts.user_account.authority_bump = *ctx.bumps.get("authority").unwrap();

        ctx.accounts.mint_pda()?;

        Ok(())
    }

    pub fn transfer_spl(ctx: Context<TransferSPL>) -> Result<()> {
        ctx.accounts.transfer_spl()?;

        Ok(())
    }

    pub fn mint_nft(ctx: Context<MintNFT>, creator_key: Pubkey, uri: String, title: String) -> Result<()> {
        ctx.accounts.mint_nft(creator_key, uri, title)?;

        msg!("NFT Successfullt minted!");
        
        Ok(())
    }

}
