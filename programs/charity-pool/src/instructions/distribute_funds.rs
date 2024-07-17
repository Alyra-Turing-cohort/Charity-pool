use anchor_lang::prelude::*;
use crate::state::Pool;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction::transfer;

#[derive(Accounts)]
pub struct DistributeFunds<'info> {
    #[account(mut, has_one = creator)]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(
        mut,
        seeds = [b"pool_vault".as_ref(), creator.key().as_ref(), pool.key().as_ref()],
        bump
    )]
    pub pool_vault: AccountInfo<'info>,

    #[account(mut)]
    pub donation: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DistributeFunds>) -> Result<()> {
    let pool_vault_balance = **ctx.accounts.pool_vault.lamports.borrow();
    let pool = &mut ctx.accounts.pool;

    let total_pool_amount = pool.contributions.iter().map(|c| c.amount).sum::<u64>();
    if total_pool_amount == 0 {
        return Err(ErrorCode::NoContributions.into());
    }
    if pool_vault_balance < total_pool_amount {
        return Err(ErrorCode::InsufficientFunds.into());
    }

    // let winner_index = simulate_vrf(pool.contributions.len());
    let winner = &pool.contributions[0];

    //POurcentage
    let winner_amount = total_pool_amount * 70 / 100;
    let charity_amount = total_pool_amount * 20 / 100;
    let protocol_amount = total_pool_amount * 10 / 100;


    assert!(**ctx.accounts.pool_vault.try_borrow_mut_lamports()? >= winner_amount + charity_amount + protocol_amount);

    // Transfer to winner
    let winner_transfer_ix = transfer(
        &ctx.accounts.pool_vault.key(),
        &winner.contributor,
        winner_amount
    );
    invoke(
        &winner_transfer_ix,
        &[
            ctx.accounts.pool_vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ]
    )?;

    // Transfer to charity
    let charity_transfer_ix = transfer(
        &ctx.accounts.pool_vault.key(),
        &ctx.accounts.donation.key(),
        charity_amount
    );
    invoke(
        &charity_transfer_ix,
        &[
            ctx.accounts.pool_vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ]
    )?;

    // Transfer to protocol
    let protocol_transfer_ix = transfer(
        &ctx.accounts.pool_vault.key(),
         &ctx.accounts.creator.key(),
        protocol_amount
    );
    invoke(
        &protocol_transfer_ix,
        &[
            ctx.accounts.pool_vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ]
    )?;


    msg!(
        "Funds distributed: Winner: {}, Charity: {}, Protocol: {}",
        winner_amount,
        charity_amount,
        protocol_amount
    );

    Ok(())
}

// A remplacer
fn simulate_vrf(total_contributors: usize) -> usize {
    (total_contributors * 12345 + 6789) % total_contributors
}

#[error_code]
pub enum ErrorCode {
    #[msg("No contributions available for distribution")]
    NoContributions,
    #[msg("Insufficient funds in the pool vault")]
    InsufficientFunds,
}
