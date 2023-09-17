use anchor_spl::{token::{TokenAccount, Token, MintTo, Mint}, associated_token::AssociatedToken};

use crate::*;
#[derive(Accounts)]
pub struct MintPDA<'info> {
    #[account(seeds = [b"authority"], bump)]
    authority: SystemAccount<'info>,
    #[account(seeds = [b"Counter", user.key().as_ref()], bump = user_account.bump)]
    pub user_account: Account<'info, CounterPDA>,
    #[account(mut)]
    user: Signer<'info>,
    #[account(init_if_needed, payer = user, mint::decimals = 6, mint::authority = authority)]
    mint: Account<'info, Mint>,
    #[account(init_if_needed, payer = user, associated_token::mint = mint, associated_token::authority = user)]
    receiver: Account<'info, TokenAccount>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
    associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> MintPDA<'info> {
    pub fn mint_pda(&mut self) -> Result<()> {
        let seeds = &[
            "authority".as_bytes(),
            &[self.user_account.authority_bump]
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = MintTo {
            mint: self.mint.to_account_info(),
            to: self.receiver.to_account_info(),
            authority: self.authority.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        anchor_spl::token::mint_to(cpi_ctx, 1000000)?;

        msg!("Tokens minted!");

        Ok(())
    }
}