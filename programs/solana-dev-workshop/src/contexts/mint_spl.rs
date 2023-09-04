use anchor_spl::token::{TokenAccount, Token, MintTo, Mint};

use crate::*;

#[derive(Accounts)]
pub struct MintSPL<'info> {
    #[account(mut)]
    mint: Account<'info, Mint>,
    #[account(mut)]
    to_ata: Account<'info, TokenAccount>,
    #[account(seeds = [b"counter", user.key().as_ref()], bump = authority.bump)]
    authority: Account<'info, CounterPDA>,
    user: SystemAccount<'info>,
    token_program: Program<'info, Token>,
}

impl<'info> MintSPL<'info> {
    pub fn mint_to(&mut self, amount: usize) -> Result<()> {

        let seeds = &[
            "counter".as_bytes(),
            &self.user.key().clone().to_bytes(),
            &[self.authority.bump]
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = MintTo {
            mint: self.mint.to_account_info(),
            to: self.to_ata.to_account_info(),
            authority: self.authority.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        anchor_spl::token::mint_to(cpi_ctx, amount as u64)?;

        msg!("{:?} tokens have been minted to {:?}", amount, self.to_ata.key());
        Ok(())
    }
}