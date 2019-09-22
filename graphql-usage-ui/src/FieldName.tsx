import React from "react";

interface Props {
  highlight: boolean;
}

const FieldName: React.FC<Props> = ({ children, highlight }) => {
  const highlightStyles = highlight ? { backgroundColor: "#ffffe0" } : {};
  return (
    <span style={{ color: "#1f61a0", padding: "10px 0px", ...highlightStyles }}>
      {children}
    </span>
  );
};

export default FieldName;
