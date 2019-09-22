import React from "react";

interface Props {
  highlight?: boolean;
}

const FieldType: React.FC<Props> = ({ children, highlight = false }) => {
  const highlightStyles = highlight ? { backgroundColor: "#ffffe0" } : {};
  return (
    <span style={{ color: "#f5a000", padding: "10px 0px", ...highlightStyles }}>
      {children}
    </span>
  );
};

export default FieldType;
