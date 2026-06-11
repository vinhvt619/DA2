import React from "react";
import { useState } from "react";

export default function ShowMenuChatHook(initial = true) {
  const [openMenu, setOpenMenu] = useState(initial);
  const toggleMenu = () => {
    setOpenMenu((prev) => !prev);
  };

  return { openMenu, toggleMenu };
}
