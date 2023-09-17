use anchor_spl::{token::{TokenAccount, Token, Mint, Transfer}, associated_token::AssociatedToken};

use crate::*;
#[derive(Accounts)]
pub struct TransferSPL<'info> {
    #[account(mut)]
    from: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = user, associated_token::mint = mint, associated_token::authority = receiver)]
    receiver_pda: Account<'info, TokenAccount>,
    #[account(mut)]
    user: Signer<'info>,
    receiver: Account<'info, CounterPDA>,
    mint: Account<'info, Mint>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,
    system_program: Program<'info, System>,
}

impl<'info> TransferSPL<'info> {
    pub fn transfer_spl(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.from.to_account_info(),
            to: self.receiver_pda.to_account_info(),
            authority: self.user.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        anchor_spl::token::transfer(cpi_ctx, 500000)?;

        msg!("Tokens transferred!");
        
        Ok(())
    }
}