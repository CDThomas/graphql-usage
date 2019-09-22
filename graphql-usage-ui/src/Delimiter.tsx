import React from "react";

interface Props {
  token: string;
}

const Delimiter: React.FC<Props> = ({ token }) => {
  const color =
    token === "{" || token === "}" ? "rgba(23,42,58,.5)" : "#555555";

  return <span style={{ color }}>{token}</span>;
};

export default Delimiter;
