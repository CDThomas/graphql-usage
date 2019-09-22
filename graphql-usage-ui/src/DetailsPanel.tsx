import React from "react";

import { ReportField } from "./reportTypes";

interface Props {
  onClose(): void;
  field: ReportField;
}

const DetailsPanel: React.FC<Props> = ({ field, onClose }) => {
  if (field.occurrences.length === 0) return null;

  return (
    <div
      style={{
        flex: 1,
        borderColor: "rgba(0,0,0,.1)",
        borderLeftStyle: "solid",
        borderLeftWidth: "1px",
        position: "fixed",
        top: 0,
        right: 0,
        left: "50%",
        height: "100%",
        marginBottom: "24px",
        overflowY: "scroll",
        backgroundColor: "#fff",
        boxShadow: "0 0 8px rgba(0, 0, 0, 0.15)"
      }}
    >
      <div
        style={{
          height: "72px",
          borderBottomStyle: "solid",
          borderBottomWidth: "1px",
          borderBottomColor: "rgba(0, 0, 0, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px"
        }}
      >
        <div>
          <span style={{ color: "#f25c54", padding: "10px 0px" }}>
            {field.parentType}
          </span>
          <span style={{ color: "#555" }}>.</span>
          <span style={{ color: "#1f61a0", padding: "10px 0px" }}>
            {field.name}
          </span>
        </div>
        <div
          style={{
            margin: "-7px -8px -6px 0",
            cursor: "pointer",
            padding: "18px 16px 15px 12px",
            fontSize: "24px"
          }}
          onClick={onClose}
        >
          ✕
        </div>
      </div>
      <div
        style={{
          padding: "0 24px"
        }}
      >
        <h2
          style={{
            color: "rgba(0,0,0,.3)",
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            borderBottom: "1px solid #e0e0e0",
            padding: "16px 0px 8px 0px"
          }}
        >
          Type
        </h2>
        <span style={{ color: "#f5a000", padding: "10px 0px" }}>
          {field.type}
        </span>
        <h2
          style={{
            color: "rgba(0,0,0,.3)",
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            borderBottom: "1px solid #e0e0e0",
            padding: "16px 0px 8px 0px"
          }}
        >
          Occurrences
        </h2>
        <ul
          style={{
            listStyle: "none",
            padding: 0
          }}
        >
          {field.occurrences.map(({ filename, rootNodeName }, index) => {
            return (
              <li
                key={index}
                style={{
                  paddingBottom: "10px"
                }}
              >
                <code>
                  <a href={filename} target="blank">
                    {rootNodeName}
                  </a>
                </code>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default DetailsPanel;
