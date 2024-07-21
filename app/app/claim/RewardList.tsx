"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { getRewardedPools } from "../../components/helpers/PoolHelper";
import ClaimReward from "./ClaimReward";

export default function RewardList() {
  const [pools, setPools] = useState();
  const [poolsLoaded, setPoolsLoaded] = useState(false);
  const connection = useConnection();
  const wallet = useWallet();

  // get pools from useEffect
  useEffect(() => {
    const fetchPools = async () => {
      await getRewardedPools(connection.connection, wallet).then((fetchedPools) => {
        setPools(fetchedPools);
        setPoolsLoaded(true);
      });
    };
    fetchPools();
  }, [poolsLoaded]);

  const claim = async () => { };

  return (
    <div>
      {pools &&
        poolsLoaded &&
        pools.map((pool) => (
          <div key={pool.account.name}>
            <ClaimReward pool={pool} />
          </div>
        ))}
    </div>
  );
}
