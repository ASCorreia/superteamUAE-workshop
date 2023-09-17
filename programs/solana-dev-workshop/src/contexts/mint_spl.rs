use anchor_spl::{token::{Mint, TokenAccount, Token, MintTo}, associated_token::AssociatedToken};
//use mpl_token_metadata::instruction::create_metadata_accounts_v3;
//use solana_program::program::invoke;

use crate::*;
#[derive(Accounts)]
pub struct MintSPL<'info> {
    #[account(init_if_needed, payer = user, mint::decimals = 6, mint::authority = user)]
    mint: Account<'info, Mint>,
    #[account(init_if_needed, payer = user, associated_token::mint = mint, associated_token::authority = user)]
    receiver: Account<'info, TokenAccount>,
    #[account(mut)]
    user: Signer<'info>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,
    system_program: Program<'info, System>,

    // CHECK: This is not dangerous because we don't read or write from this account
    //pub token_metadata_program: AccountInfo<'info>,
    // CHECK: This is not dangerous because we don't read or write from this account
    //#[account(mut)]
    //pub metadata: AccountInfo<'info>,
    // CHECK: This is not dangerous because we don't read or write from this account
    //pub rent: AccountInfo<'info>,
}

impl<'info> MintSPL<'info> {
    pub fn mint_spl(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = MintTo {
            mint: self.mint.to_account_info(),
            to: self.receiver.to_account_info(),
            authority: self.user.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        anchor_spl::token::mint_to(cpi_ctx, 1000000)?;

        msg!("Tokens minted to user!");

        Ok(())
    }

    /*
    pub fn associate_metadata(&mut self) -> Result<()> {
        let account_info = vec![
            self.metadata.to_account_info(),
            self.mint.to_account_info(),
            self.user.to_account_info(),
            self.user.to_account_info(),
            self.token_metadata_program.to_account_info(),
            self.token_program.to_account_info(),
            self.system_program.to_account_info(),
            self.rent.to_account_info(),
        ];
        msg!("Account Info Assigned");

        let creator = vec![
            mpl_token_metadata::state::Creator {
                address: self.user.key(),
                verified: false,
                share: 100,
            },
        ];
        msg!("Creator Assigned");

        invoke(
            &create_metadata_accounts_v3(
                self.token_metadata_program.key(), //program_id
                self.metadata.key(), //metadata_account
                self.mint.key(), //mint
                self.user.key(), //mint_authority
                self.user.key(), //payer
                self.user.key(), //update_authority
                "Superteam UAE".to_owned(), //name
                "UAE".to_owned(), //symbol
                "".to_owned(), //uri
                Some(creator), //creators
                100, //seller_fee_basis_points
                true, //update_authority_is_signer
                true, //is_mutable
                None, //collection
                None, //uses
                None, //collection_details
            ),
            account_info.as_slice(),
        )?;
        msg!("Metadata Account Created !!!");

        Ok(())
    }*/
}