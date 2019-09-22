import React from "react";

import { LIGHT_BLUE, RED, WHITE } from "./constants/colors";

type LabelColor = "red" | "blue";

interface LabelProps {
  color?: LabelColor;
}

const Label: React.FC<LabelProps> = ({ children, color = "blue" }) => {
  const hexColor = {
    blue: LIGHT_BLUE,
    red: RED
  }[color];

  return (
    <span
      style={{
        display: "inline-block",
        padding: ".25em .4em",
        fontSize: "75%",
        fontWeight: 700,
        lineHeight: 1,
        textAlign: "center",
        whiteSpace: "nowrap",
        verticalAlign: "baseline",
        borderRadius: ".25rem",
        backgroundColor: hexColor,
        color: WHITE,
        marginLeft: "8px"
      }}
    >
      {children}
    </span>
  );
};

export default Label;
