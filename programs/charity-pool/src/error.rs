use anchor_lang::prelude::*;

#[error_code]
pub enum DistributeFundsError {
    #[msg("No contributions available for distribution")]
    NoContributions,

    #[msg("Donation account does not match the pool donation account")]
    DonationAccountMismatch,

    #[msg("Winner not drawn yet")]
    WinnerNotDrawn,

    #[msg("Provided winner does not match the drawn winner")]
    WinnerMismatch,
}

#[error_code]
pub enum DrawWinnerError {
    #[msg("No contributions available for distribution")]
    NoContributions,

    #[msg("Pool not ended yet")]
    PoolNotEnded,
}

