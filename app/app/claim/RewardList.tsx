"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { getRewardedPools } from "../../components/helpers/PoolHelper";
import ClaimReward from "./ClaimReward";
import { Typography } from "@mui/material";
import MyMultiButton from "../../components/layout/MyMultiButton";

export default function RewardList() {
  const [pools, setPools] = useState();
  const [poolsLoaded, setPoolsLoaded] = useState(false);
  const connection = useConnection();
  const wallet = useWallet();

  // get rewarded pools matched with the current user
  useEffect(() => {
    if (wallet && wallet.connected) {
      const fetchPools = async () => {
        await getRewardedPools(connection.connection, wallet).then(
          (fetchedPools) => {
            setPools(fetchedPools);
            setPoolsLoaded(true);
          }
        );
      };
      fetchPools();
    }
  }, []);

  return (
    <div>
      {wallet && wallet.connected ? (
        pools && pools.length > 0 && poolsLoaded ? (
          pools.map((pool) => (
            <div key={pool.account.name}>
              <ClaimReward pool={pool} />
            </div>
          ))
        ) : (
          <h2 className="text-black dark:text-white">Nothing to claim ...</h2>
        )
      ) : (
        <div>
          <Typography id="transition-modal-description" sx={{ mt: 2, mb: 2 }}>
            Please, connect first.
          </Typography>
          <MyMultiButton />
        </div>
      )}
    </div>
  );
}
