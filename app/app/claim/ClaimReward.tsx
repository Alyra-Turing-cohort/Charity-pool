"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import SavingsIcon from "@mui/icons-material/Savings";
import { Button } from "@mui/material";
import { distributeFunds } from "../../components/helpers/PoolHelper";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Link from "next/link";
import { toast } from "sonner";

export default function ClaimReward({ pool }) {
  const connection = useConnection();
  const wallet = useWallet();

  const claim = async () => {
    await distributeFunds(
      connection.connection,
      wallet,
      pool.account
    )
      .then((tx) => {
        const urlSolanaEplorer =
          "https://explorer.solana.com/tx/" + tx + "?cluster=devnet";

        const txMessage = (
          <Link href={urlSolanaEplorer} target="_blank">
            Check who's the lucky dude on Solana explorer <OpenInNewIcon />
          </Link>
        );

        toast(txMessage);
      })
      .catch((err) => {
        toast("Transaction cancelled");
        console.error(err);
      });
    
  };

  return (
    <div>
      <div
        className="flex flex-col justify-center p-1 bg-inherit gap-1"
        key={pool.account.name}
      >
        <h1 className="text-black dark:text-white">{pool.account.name}</h1>
        <p>
          Total contributed:{" "}
          {pool.account.totalContributions / LAMPORTS_PER_SOL} SOL / 20
        </p>

        <Button
          variant="outlined"
          color="secondary"
          endIcon={<SavingsIcon />}
          onClick={claim}
        >
          Claim your reward
        </Button>
        <div className="flex flex-col md:flex-row justify-start  items-center py-4"></div>
      </div>
    </div>
  );
}
