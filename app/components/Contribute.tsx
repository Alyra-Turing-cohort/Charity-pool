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
import { useWallet } from "@solana/wallet-adapter-react";
import MyMultiButton from "./layout/MyMultiButton";

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

export default function TransitionsModal() {
  const [sliderDefaultValue, setSliderDefaultValue] = useState(1);
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const wallet = useWallet();

  const valueLabelFormat = (value: number) => {
    setSliderDefaultValue(value);
    return `${value} SOL`;
  };

  const contribute = () => {
    console.log(sliderDefaultValue);
  };

  return (
    <div className="flex flex-row items-start justify-start gap-8">
      <Button className="btn glow-on-hover" onClick={handleOpen}>
        Contribute
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
                  We encourage you to contribute to this pool.
                </Typography>

                <Box sx={{ width: 300 }}>
                  <Slider
                    aria-label="Sol"
                    defaultValue={sliderDefaultValue}
                    getAriaValueText={valueLabelFormat}
                    valueLabelDisplay="auto"
                    step={0.5}
                    marks
                    min={0.5}
                    max={20}
                  />
                </Box>
                <Button
                  variant="outlined"
                  color="secondary"
                  endIcon={<Wallet />}
                  onClick={contribute}
                >
                  Contribute
                </Button>
                <span>SOL {sliderDefaultValue} </span>
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
