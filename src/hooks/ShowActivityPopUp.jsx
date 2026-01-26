import React from "react";
import { useState, useEffect } from "react";

export default function ShowActivityPopUp(initial) {
  const [openPopUp, setOpenPopUp] = useState(initial);
  const togglePopUp = () => {
    setOpenPopUp((prev) => !prev);
  };

  return { openPopUp, togglePopUp };
}
