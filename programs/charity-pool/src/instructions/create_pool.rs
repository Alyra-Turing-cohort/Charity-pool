use anchor_lang::prelude::*;

use crate::Pool;

#[derive(Accounts)]
// #[instruction(params: CreatePoolParams)]
pub struct CreatePool<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Pool::INIT_SPACE,
        seeds = [b"pool".as_ref(), creator.key().as_ref(), donation.key().as_ref()],
        bump

    )]
    pub pool: Account<'info, Pool>,

    // #[account(
    //     mut,
    //     seeds = [b"pool_vault".as_ref(), creator.key().as_ref(), &params.donation_pubkey.to_bytes()],
    //     bump,
    // )]
    // pub pool_vault: SystemAccount<'info>,

    pub donation: SystemAccount<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// #[derive(Debug, AnchorSerialize, AnchorDeserialize)]
// pub struct CreatePoolParams {
//     pool_name: String,
//     donation_pubkey: Pubkey,
//     initial_funding: u64,
// }

pub fn handler(ctx: Context<CreatePool>, pool_name: String, donation_pubkey: Pubkey, initial_funding: u64) -> Result<()> {
    let creator = ctx.accounts.creator.key();
    *ctx.accounts.pool = Pool::new(pool_name, donation_pubkey, creator)?;

    msg!("Pool created: {:?}", ctx.accounts.pool);

    Ok(())
}
