use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub mod contexts;
pub use contexts::*;

#[program]
pub mod solana_dev_workshop {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {

        ctx.accounts.initialize()?;

        msg!("Counter account initialized!");
        
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {

        ctx.accounts.increment()?;

        msg!("Counter incremented!");

        Ok(())
    }

    pub fn initialize_pda(ctx: Context<InitializePDA>) -> Result<()> {
        ctx.accounts.initialize()?;

        ctx.accounts.account.bump = *ctx.bumps.get("account").unwrap();

        Ok(())
    }

    pub fn mint_to(ctx: Context<MintSPL>) -> Result<()> {
        ctx.accounts.mint_to(5000000)?;

        msg!("Tokens sucessfully minted");

        Ok(())
    }
}
