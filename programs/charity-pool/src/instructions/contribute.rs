use anchor_lang::prelude::*;
use crate::state::Pool;
use crate::state::Contribution;

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut,
        seeds = [b"pool", pool.creator.key().as_ref(), donation.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    /// CHECK: This is not dangerous because the pool_vault is owned by the program
    #[account(
        mut,
        seeds = [b"pool_vault".as_ref(), pool.key().as_ref()],
        bump
    )]
    pub pool_vault: SystemAccount<'info>,

    #[account(mut)]
    pub contributor: Signer<'info>,

    pub donation: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Contribute>, amount: u64) -> Result<()> {
    let system_program = &ctx.accounts.system_program;
    let contributor = &mut ctx.accounts.contributor;
    let pool = &mut ctx.accounts.pool;
    let pool_vault = &mut ctx.accounts.pool_vault;

    let contribution = Contribution {
        contributor: contributor.key(),
        amount,
    };

    pool.contributions.push(contribution);

    // Calculate the space taken by the contributions
    let space_needed = 8 + (8 * pool.contributions.capacity());

    // Check the account size and reallocate if necessary
    if pool.to_account_info().data_len() < space_needed {
        pool.to_account_info().realloc(space_needed, false)?;
    }

    // Transfer contribution amount from the contributor to the pool's account
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &contributor.key(),
        &pool_vault.key(),
        amount,
    );

    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            contributor.to_account_info(),
            pool_vault.to_account_info(),
            system_program.to_account_info(),
        ],
    )?;

    Ok(())
}
