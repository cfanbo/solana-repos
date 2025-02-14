use anchor_lang::prelude::*;

// This is your program's public key and it will update automatically when you build the project.
declare_id!("24ELvnv7XnZKMu7c3VGmPhGSYu6uhzfYEai1u92J8Ud8");

#[program]
mod hello_anchor {
    use super::*;

    pub fn create_account(ctx: Context<CreateAccount>, data: u64) -> Result<()> {
        // Initialize new_account with provided data
        let new_account = &mut ctx.accounts.new_account;
        new_account.data = data;

        msg!("Created new account with data: {}!", new_account.data);
        Ok(())
    }

    pub fn close_account(ctx: Context<CloseAccount>) -> Result<()> {
        // At this point, the account is being closed and the balance will be transferred to the signer
        let close_account = &mut ctx.accounts.close_account;

        // Optionally, you can log the data of the account being closed before it's deleted
        msg!("Closing account with data: {}!", close_account.data);

        // The account will be closed and the SOL will be sent to `signer` automatically.
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateAccount<'info> {
    #[account(init, payer = signer, seeds = [b"test"], bump, space = 8 + 8)]
    pub new_account: Account<'info, NewAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseAccount<'info> {
    #[account(mut, close = signer)]
    pub close_account: Account<'info, NewAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct NewAccount {
    pub data: u64,
}
