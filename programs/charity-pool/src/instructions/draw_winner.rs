use anchor_lang::prelude::*;

use crate::state::Pool;
use crate::error::DrawWinnerError;

#[derive(Accounts)]
pub struct DrawWinner<'info> {
    #[account(
        mut,
        seeds = [b"pool".as_ref(), creator.key().as_ref(), pool.donation_pubkey.as_ref()],
        bump

    )]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DrawWinner>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;


    // TODO: Uncomment this line in production
    //let current_timestamp = Clock::get()?.unix_timestamp as u64;
    //require!(pool.is_ended(current_timestamp), DrawWinnerError::PoolNotEnded);
    require_gt!(pool.contributions.len(), 1, DrawWinnerError::NoContributions);

    pool.draw_winner()?;

    msg!("Selected winner: {:?}", pool.winner.unwrap());

    Ok(())
}
