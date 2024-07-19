"use client";
import * as React from "react";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import { Wallet } from "@mui/icons-material";
import { useState } from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import { createPool } from "./helpers/PoolHelper";
import { toast } from "sonner";
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

const solanaLabs = "Solana labs";
const alyraAlumni = "Alyra alumni";
const antiCapitalism = "Anti capitalism";

export default function CreatePoolForm() {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [donation, setDonation] = useState("");
  const [title, setTitle] = useState("");
  const [sliderDefaultValue, setSliderDefaultValue] = useState(1);

  const wallet = useWallet();
  const connection = useConnection();

  const submitCreatePool = async () => {
    await createPool(
      title,
      sliderDefaultValue,
      connection.connection,
      wallet
    ).then((tx) => {
      const urlSolanaEplorer =
        "https://explorer.solana.com/tx/" + tx + "?cluster=devnet";
  
      const txMessage = (
        <Link href={urlSolanaEplorer} target="_blank">
          Check this out on Solana explorer <OpenInNewIcon />
        </Link>
      );
      
      toast(txMessage);
    }).catch(err => {
      toast("Transaction cancelled");
      console.error(err);
    });
    setOpen(!open);
  };

  const handleDonationChange = (event: SelectChangeEvent) => {
    setDonation(event.target.value as string);
  };

  const handleTitleChange = (event: SelectChangeEvent) => {
    setTitle(event.target.value as string);
  };

  const valueLabelFormat = (value: number): string => {
    setSliderDefaultValue(value);
    return `${value} SOL`;
  };

  return (
    <div className="flex flex-row items-start justify-start gap-8">
      <Button className="btn glow-on-hover" onClick={handleOpen}>
        Create a new pool
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
              Hey contributor!
            </Typography>
            <Typography id="transition-modal-description" sx={{ mt: 2, mb: 2 }}>
              You rock 👋
            </Typography>

            <TextField
              id="standard-basic"
              label="The pool's title"
              variant="standard"
              onChange={handleTitleChange}
            />

            <InputLabel id="demo-simple-select-label">Donation</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={donation}
              label="Donation"
              onChange={handleDonationChange}
            >
              <MenuItem value={solanaLabs}>{solanaLabs}</MenuItem>
              <MenuItem value={alyraAlumni}>{alyraAlumni}</MenuItem>
              <MenuItem value={antiCapitalism}>{antiCapitalism}</MenuItem>
            </Select>

            <Box sx={{ width: 300 }}>
              <Slider
                aria-label="Temperature"
                defaultValue={sliderDefaultValue}
                getAriaValueText={valueLabelFormat}
                valueLabelDisplay="auto"
                step={0.5}
                marks
                min={0.5}
                max={20}
              />
            </Box>

            <Box>
              <>
                <Button
                  variant="outlined"
                  color="secondary"
                  endIcon={<Wallet />}
                  onClick={submitCreatePool}
                >
                  Create new pool
                </Button>
                <span>SOL {sliderDefaultValue} </span>
              </>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}
