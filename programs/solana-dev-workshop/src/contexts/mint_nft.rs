use anchor_spl::token::{Token, MintTo, self};
use mpl_token_metadata::{instruction::{create_master_edition_v3, create_metadata_accounts_v3, VerificationArgs}, processor::verify};
use solana_program::program::invoke;

use crate::*;

#[derive(Accounts)]
pub struct MintNFT<'info> {
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub mint: AccountInfo<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub token_account: AccountInfo<'info>,
    pub mint_authority: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub master_edition: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub rent: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub token_metadata_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> MintNFT<'info> {
    pub fn mint_nft(&mut self, creator_key: Pubkey, uri: String, title: String) -> Result<()> {
        msg!("Initializing Mint NFT");
        let cpi_accounts = MintTo {
            mint: self.mint.to_account_info(),
            to: self.token_account.to_account_info(),
            authority: self.payer.to_account_info(),
        };
        msg!("CPI Accounts Assigned");

        let cpi_program = self.token_program.to_account_info();
        msg!("CPI Program Assigned");

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        msg!("CPI Context Assigned");

        token::mint_to(cpi_ctx, 1)?;
        msg!("Token Minted !!!");

        let account_info = vec![
            self.metadata.to_account_info(),
            self.mint.to_account_info(),
            self.mint_authority.to_account_info(),
            self.payer.to_account_info(),
            self.token_metadata_program.to_account_info(),
            self.token_program.to_account_info(),
            self.system_program.to_account_info(),
            self.rent.to_account_info(),
        ];
        msg!("Account Info Assigned");

        let creator = vec![
            mpl_token_metadata::state::Creator {
                address: creator_key,
                verified: false,
                share: 100,
            },
            /*mpl_token_metadata::state::Creator {
                address: self.mint_authority.key(),
                verified: false,
                share: 0,
            },*/
        ];
        msg!("Creator Assigned");

        let symbol = std::string::ToString::to_string("STW");

        invoke(
            &create_metadata_accounts_v3(
                self.token_metadata_program.key(), //program_id
                self.metadata.key(), //metadata_account
                self.mint.key(), //mint
                self.mint_authority.key(), //mint_authority
                self.payer.key(), //payer
                self.payer.key(), //update_authority
                title, //name
                symbol, //symbol
                uri, //uri
                Some(creator), //creators
                500, //seller_fee_basis_points
                true, //update_authority_is_signer
                false, //is_mutable
                None, //collection
                None, //uses
                None, //collection_details
            ),
            account_info.as_slice(),
        )?;
        msg!("Metadata Account Created !!!");

        let master_edition_infos = vec![
            self.master_edition.to_account_info(),
            self.mint.to_account_info(),
            self.mint_authority.to_account_info(),
            self.payer.to_account_info(),
            self.metadata.to_account_info(),
            self.token_metadata_program.to_account_info(),
            self.token_program.to_account_info(),
            self.system_program.to_account_info(),
            self.rent.to_account_info(),
        ];
        msg!("Master Edition Account Infos Assigned");

        invoke(
            &create_master_edition_v3(
                self.token_metadata_program.key(), //program_id
                self.master_edition.key(), //edition
                self.mint.key(), //mint
                self.payer.key(), //update_authority
                self.mint_authority.key(), //mint_authority
                self.metadata.key(), //metadata (metadata_account)
                self.payer.key(), //payer
                Some(0), //max_supply
            ),
            master_edition_infos.as_slice(),
        )?;
        msg!("Master Edition Nft Minted !!!");

        //let a = [self.mint.clone().to_account_info(), self.master_edition.clone().to_account_info()];

        //verify(&self.token_metadata_program.key(), &a, VerificationArgs::CreatorV1);

        Ok(())
    }
}