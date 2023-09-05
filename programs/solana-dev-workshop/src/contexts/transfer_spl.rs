use anchor_spl::token::{TokenAccount, Token, Transfer};

use crate::*;

#[derive(Accounts)]
pub struct TransferSpl<'info> {
    #[account(mut)]
    from_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    to_ata: Account<'info, TokenAccount>,
    #[account(seeds = [b"counter"], bump = authority.bump)]
    authority: Account<'info, CounterPDA>,
    token_program: Program<'info, Token>,
}

impl<'info> TransferSpl<'info> {
    pub fn transfer_spl(&mut self, amount: usize) -> Result<()> {
        let seeds = &[
            "counter".as_bytes(),
            /*&self.user.key().clone().to_bytes(),*/
            &[self.authority.bump]
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.from_ata.to_account_info(),
            to: self.to_ata.to_account_info(),
            authority: self.authority.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        anchor_spl::token::transfer(cpi_ctx, amount as u64)?;

        Ok(())
    }
}