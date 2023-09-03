use crate::*;
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 1)]
    pub account: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn initialize(&mut self) -> Result<()> {
        self.account.counter = 0;

        Ok(())
    }
}

#[account]
pub struct Counter {
    pub counter: u8,
}