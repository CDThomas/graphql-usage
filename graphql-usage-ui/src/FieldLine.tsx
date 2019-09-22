import React from "react";

import Delimiter from "./Delimiter";
import FieldName from "./FieldName";
import FieldType from "./FieldType";
import Label from "./Label";
import { ReportField } from "./reportTypes";

interface Props {
  field: ReportField;
  filter: string;
  onFieldClick(field: ReportField): void;
}

const FieldLine: React.FC<Props> = ({ field, filter, onFieldClick }) => {
  const { name, type, occurrences } = field;
  const lowerCaseFilter = filter.toLowerCase();
  const fieldMatchesFilter = field.name.toLowerCase().includes(lowerCaseFilter);
  const typeMatchesFilter = field.type.toLowerCase().includes(lowerCaseFilter);
  const handleFieldClick = () => onFieldClick(field);

  return (
    <div
      style={{ display: "flex", alignItems: "center", paddingLeft: "16px" }}
      onClick={handleFieldClick}
    >
      <div className="field-line" style={{ padding: "10px 0px" }}>
        <FieldName highlight={!!filter && fieldMatchesFilter}>{name}</FieldName>
        <Delimiter token={":"} />{" "}
        <FieldType highlight={!!filter && typeMatchesFilter}>{type}</FieldType>
      </div>

      {occurrences.length === 0 ? (
        <Label color="red">Unused</Label>
      ) : (
        <Label>{occurrences.length}</Label>
      )}
    </div>
  );
};

export default FieldLine;
