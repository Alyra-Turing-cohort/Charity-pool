use anchor_lang::prelude::*;

#[error_code]
pub enum DistributeFundsError {
    #[msg("Pool already claimed")]
    PoolAlreadyClaimed,

    #[msg("No contributions available for distribution")]
    NoContributions,

    #[msg("Donation account does not match the pool donation account")]
    DonationAccountMismatch,

    #[msg("Winner not drawn yet")]
    WinnerNotDrawn,

    #[msg("Provided winner does not match the drawn winner")]
    WinnerMismatch,

    #[msg("Creator does not match the pool creator")]
    CreatorMismatch,
}

#[error_code]
pub enum DrawWinnerError {
    #[msg("No contributions available for distribution")]
    NoContributions,

    #[msg("Pool not ended yet")]
    PoolNotEnded,
}
