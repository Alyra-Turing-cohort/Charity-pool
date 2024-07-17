use anchor_lang::prelude::*;
use crate::state::Pool;

#[derive(Accounts)]
pub struct DistributeFunds<'info> {
    #[account(mut, has_one = creator)]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(seeds = [b"pool_vault".as_ref(), creator.key().as_ref(), pool.key().as_ref()], bump)]
    pub pool_vault: SystemAccount<'info>,

    #[account(mut)]
    pub donation: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DistributeFunds>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    let total_pool_amount = pool.contributions.iter().map(|c| c.amount).sum::<u64>();
    if total_pool_amount == 0 {
        return Err(ErrorCode::NoContributions.into());
    }

    // Placeholder for random winner selection, replace with actual VRF call in production.
    let winner_index = simulate_vrf(pool.contributions.len());
    let winner = &pool.contributions[winner_index];

    // Define distribution percentages
    let winner_amount = total_pool_amount * 70 / 100;
    let charity_amount = total_pool_amount * 20 / 100;
    let protocol_amount = total_pool_amount * 10 / 100;

    // Transfer to winner
    **ctx.accounts.pool_vault.try_borrow_mut_lamports()? -= winner_amount;
    **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += winner_amount;

    // Transfer to charity
    let charity_pubkey = pool.donation_pubkey;
    let charity_account = ctx.accounts.donation.to_account_info();
    **ctx.accounts.pool_vault.try_borrow_mut_lamports()? -= charity_amount;
    **charity_account.try_borrow_mut_lamports()? += charity_amount;

    // Transfer to protocol
    **ctx.accounts.pool_vault.try_borrow_mut_lamports()? -= protocol_amount;
    **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += protocol_amount;

    msg!("Funds distributed: Winner: {}, Charity: {}, Protocol: {}", winner_amount, charity_amount, protocol_amount);

    Ok(())
}

// A remplacer
fn simulate_vrf(total_contributors: usize) -> usize {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    rng.gen_range(0..total_contributors)
}

#[error_code]
pub enum ErrorCode {
    #[msg("No contributions available for distribution")]
    NoContributions,
}
