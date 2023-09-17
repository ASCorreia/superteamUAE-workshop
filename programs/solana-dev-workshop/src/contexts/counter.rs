use crate::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + Counter::INIT_SPACE)]
    user_account: Account<'info, Counter>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn initialize(&mut self) -> Result<()> {
        self.user_account.counter = 0;
        self.user_account.owner = self.user.key();

        msg!("User Counter account initialized!");
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    user_account: Account<'info, Counter>,
    user: Signer<'info>,
}

impl<'info> Increment<'info> {
    pub fn increment(&mut self) -> Result<()> {
        if self.user_account.owner == self.user.key() {
            self.user_account.counter += 1;
        }

        msg!("Incremented user account");

        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub counter: u8,
    pub owner: Pubkey,
}