use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::Pool;
use crate::error::DistributeFundsError;

#[derive(Accounts)]
pub struct DistributeFunds<'info> {
    #[account(
        mut,
        seeds = [b"pool".as_ref(), creator.key().as_ref(), donation.key().as_ref()],
        constraint = !pool.claimed  @ DistributeFundsError::PoolAlreadyClaimed,
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

    #[account(
        mut,
        constraint = donation.key() == pool.donation_pubkey @ DistributeFundsError::DonationAccountMismatch
    )]
    pub donation: SystemAccount<'info>,

    #[account(
        mut,
    )]
    pub provided_winner: Signer<'info>,

    #[account(
        mut,
        constraint = creator.key() == pool.creator @ DistributeFundsError::CreatorMismatch
    )]
    pub creator: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DistributeFunds>) -> Result<()> {
    let pool_vault = &mut ctx.accounts.pool_vault;
    let donation = &mut ctx.accounts.donation;
    let pool = &mut ctx.accounts.pool;
    let provided_winner = &mut ctx.accounts.provided_winner;
    let creator = &mut ctx.accounts.creator;

    require_gt!(pool.contributions.len(), 1, DistributeFundsError::NoContributions);

    match pool.winner {
        Some(drawn_winner) => {
            require_eq!(drawn_winner, provided_winner.key(), DistributeFundsError::WinnerMismatch);
        },
        None => {
            return Err(DistributeFundsError::WinnerNotDrawn.into());
        }
    }

    let pool_vault_balance = pool_vault.lamports();

    // Pourcentage
    let winner_amount = pool_vault_balance.checked_mul(70).unwrap().checked_div(100).unwrap();
    let charity_amount = pool_vault_balance.checked_mul(20).unwrap().checked_div(100).unwrap();
    let protocol_amount = pool_vault_balance.checked_mul(10).unwrap().checked_div(100).unwrap();

    assert!(pool_vault.lamports() >= winner_amount + charity_amount + protocol_amount, "Round error");

    pool.claimed = true;

    // Transfer to winner
    let bump = &[ctx.bumps.pool_vault];
    let seeds = &[&[b"pool_vault".as_ref(), pool.to_account_info().key.as_ref(), bump][..]];
    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: pool_vault.to_account_info(),
                to: provided_winner.to_account_info(),
            },
            seeds,
        ),
        winner_amount,
    )?;

    // Transfer to charity
    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: pool_vault.to_account_info(),
                to: donation.to_account_info(),
            },
            seeds,
        ),
        charity_amount
    )?;

    // Transfer to protocol
    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: pool_vault.to_account_info(),
                to: creator.to_account_info(),
            },
            seeds,
        ),
        protocol_amount
    )?;

    msg!(
        "Funds distributed: Winner: {}, Charity: {}, Protocol: {}",
        winner_amount,
        charity_amount,
        protocol_amount
    );

    Ok(())
}

