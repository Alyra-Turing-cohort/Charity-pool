"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { getPools } from "./helpers/PoolHelper";
import CreatePoolForm from "./CreatePoolForm";
import Contribute from "./Contribute";
import { Slider } from "@mui/material";

export default function PoolList() {
  const [pools, setPools] = useState();
  const [poolsLoaded, setPoolsLoaded] = useState(false);
  const connection = useConnection();
  const wallet = useWallet();

  // get pools from useEffect
  useEffect(() => {
    const fetchPools = async () => {
      await getPools(connection.connection, wallet).then((fetchedPools) => {
        setPools(fetchedPools);
        setPoolsLoaded(true);
      });
    };
    fetchPools();
  }, [poolsLoaded]);

  // calculate total funding for each pool
  useEffect(() => {
    if (pools && poolsLoaded) {
      pools.map((pool) => {
        pool.totalFunding = pool.account.contributions.reduce(
          (a, b) => a + b.amount.toNumber(),
          0
        );
        pool.totalFunding = pool.totalFunding / 1000000000; // convert to SOL
      });
    }
  }, [pools]);

  return (
    <div className="w-full h-screen flex justify-center items-center ">
      <div className="max-w-md bg-transparent  text-black dark:text-white rounded-lg shadow-lg border border-0.5 border-gray-300 dark:border-gray-800 p-[1.25rem]">
        <CreatePoolForm setPoolsLoaded={setPoolsLoaded} />

        {pools &&
          poolsLoaded &&
          pools.map((pool) => (
            <div
              className="flex flex-col justify-center p-1 bg-inherit gap-1"
              key={pool.account.name}
            >
              <h1 className="text-black dark:text-white">
                {pool.account.name}
              </h1>
              <Slider
                key={pool.account.name}
                defaultValue={pool.totalFunding}
                step={0.5}
                marks
                min={0.5}
                max={20}
                disabled
              />
              {pool.totalFunding} SOL / 20
              <div className="flex flex-col md:flex-row justify-start  items-center py-4">
                <Contribute pool={pool} setPoolsLoaded={setPoolsLoaded} />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
