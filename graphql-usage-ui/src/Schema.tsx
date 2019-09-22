import React from "react";

import { ReportField, ReportType } from "./reportTypes";
import TypeBlock from "./TypeBlock";

interface Props {
  types: ReportType[];
  filter: string;
  onFieldClick(field: ReportField): void;
}

const Schema: React.FC<Props> = ({ types, filter, onFieldClick }) => {
  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#ffffff",
        fontFamily:
          "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace"
      }}
    >
      {types.map(type => {
        return (
          <TypeBlock
            type={type}
            filter={filter}
            key={type.name}
            onFieldClick={onFieldClick}
          />
        );
      })}
    </div>
  );
};

export default Schema;
