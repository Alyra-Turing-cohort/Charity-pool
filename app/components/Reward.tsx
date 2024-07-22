"use client";
import * as React from "react";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import MyMultiButton from "./layout/MyMultiButton";
import { drawWinner } from "./helpers/PoolHelper";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { toast } from "sonner";
import Divider from "@mui/material/Divider";
import Link from "next/link";

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  borderRadius: 5,
  p: 4,
};

export default function Reward({ pool, setPoolsLoaded }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const wallet = useWallet();
  const connection = useConnection();

  const reward = async () => {
    await drawWinner(
      connection.connection,
      wallet,
      pool.account
    )
      .then((tx) => {
        const urlSolanaEplorer =
          "https://explorer.solana.com/tx/" + tx + "?cluster=devnet";

        const txMessage = (
          <Link href={urlSolanaEplorer} target="_blank">
            Check who is the lucky dude on Solana explorer <OpenInNewIcon />
          </Link>
        );

        setPoolsLoaded(false);
        toast(txMessage);
      })
      .catch((err) => {
        toast("Transaction cancelled");
        console.error(err);
      });
    setOpen(!open);
  };

  return (
    <div className="flex flex-row items-start justify-start gap-8">
      <Button className="btn glow-on-hover" onClick={handleOpen}>
        Lucky dude!
      </Button>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={open}>
          <Box sx={style}>
            <Typography id="transition-modal-title" variant="h6" component="h2">
              Hey contributor 👋
            </Typography>

            {wallet.connected ? (
              <>
                <Typography
                  id="transition-modal-description"
                  sx={{ mt: 2, mb: 2 }}
                >
                  Lets draw a pool winner.
                  <Divider variant="middle" />
                  {pool.account.name}
                </Typography>

                <Box>
                  <Button
                    variant="outlined"
                    color="secondary"
                    endIcon={<EmojiEventsIcon />}
                    onClick={reward}
                  >
                    Draw the winner
                  </Button>
                </Box>
              </>
            ) : (
              <div>
                <Typography
                  id="transition-modal-description"
                  sx={{ mt: 2, mb: 2 }}
                >
                  Please, connect first.
                </Typography>
                <MyMultiButton />
              </div>
            )}
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}
