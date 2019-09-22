import React from "react";

import Delimiter from "./Delimiter";
import FieldLine from "./FieldLine";
import { ReportField, ReportType } from "./reportTypes";
import TypeKind from "./TypeKind";
import TypeName from "./TypeName";

interface Props {
  type: ReportType;
  filter: string;
  onFieldClick(field: ReportField): void;
}

const TypeBlock: React.FC<Props> = ({ type, filter, onFieldClick }) => {
  const { name, fields } = type;
  const typeMatchesFilter = type.name
    .toLowerCase()
    .includes(filter.toLowerCase());

  return (
    <div style={{ paddingBottom: "20px" }}>
      <div>
        <TypeKind>type</TypeKind>{" "}
        <TypeName highlight={!!filter && typeMatchesFilter}>{name}</TypeName>{" "}
        <Delimiter token={"{"} />
      </div>
      {fields.map(field => {
        return (
          <FieldLine
            field={field}
            key={field.name}
            filter={filter}
            onFieldClick={onFieldClick}
          />
        );
      })}
      <Delimiter token={"}"} />
    </div>
  );
};

export default TypeBlock;
