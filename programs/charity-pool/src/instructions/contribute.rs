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

    #[account(mut)]
    pub contributor: Signer<'info>,

    pub donation: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Contribute>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    let contribution = Contribution {
        contributor: ctx.accounts.contributor.key(),
        amount,
    };

    pool.contributions.push(contribution);

    // Calculate the space taken by the contributions
    let space_needed = 8 + (8 * pool.contributions.capacity());

    // Check the account size and reallocate if necessary
    if ctx.accounts.pool.to_account_info().data_len() < space_needed {
        ctx.accounts.pool.to_account_info().realloc(space_needed, false)?;
    }

    let pool_account = ctx.accounts.pool.to_account_info();

    // Transfer contribution amount from the contributor to the pool's account
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.contributor.key(),
        &pool_account.key(),
        amount,
    );

    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.contributor.to_account_info(),
            pool_account,
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    Ok(())
}
