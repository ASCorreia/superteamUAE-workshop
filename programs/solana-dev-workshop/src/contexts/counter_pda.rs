use crate::*;
#[derive(Accounts)]
pub struct InitializePDA<'info> {
    #[account(init, seeds = [b"Counter", user.key().as_ref()], bump, payer = user, space = 8 + CounterPDA::INIT_SPACE)]
    pub user_account: Account<'info, CounterPDA>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
}

impl<'info> InitializePDA<'info> {
    pub fn initialize_pda(&mut self) -> Result<()> {
        self.user_account.counter += 1;
        
        msg!("User PDA account initialized!");

        Ok(())
    }
}

#[derive(Accounts)]
pub struct IncrementPDA<'info> {
    #[account(seeds = [b"Counter", user.key().as_ref()], bump = user_account.bump)]
    user_account: Account<'info, CounterPDA>,
    user: Signer<'info>,
}

impl<'info> IncrementPDA<'info> {
    pub fn increment_pda(&mut self) -> Result<()> {
        self.user_account.counter += 1;

        msg!("User PDA account incrmented!");
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut, close = destination)]
    account: Account<'info, CounterPDA>,
    #[account(mut)]
    destination: SystemAccount<'info>,
}

impl<'info> Close<'info> {
    pub fn close(&self) -> Result<()> {
        msg!("Account succesfully closed!");
        Ok(())
    }
}


#[account]
#[derive(InitSpace)]
pub struct CounterPDA {
    pub counter: u8,
    pub bump: u8,
    pub authority_bump: u8,
}