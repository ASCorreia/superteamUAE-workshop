use crate::*;

#[derive(Accounts)]
pub struct InitializePDA<'info> {
    #[account(init, seeds = [b"counter"/*, user.key.as_ref()*/], bump, payer = user, space = 8 + 1 + 1)]
    pub account: Account<'info, CounterPDA>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializePDA <'info> {
    pub fn initialize(&mut self) -> Result<()> {
        self.account.counter = 0;

        Ok(())
    }
}

#[account]
pub struct CounterPDA {
    pub counter: u8,
    pub bump: u8,
}