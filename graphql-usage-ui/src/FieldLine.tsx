import React from "react";

import Delimiter from "./Delimiter";
import FieldName from "./FieldName";
import FieldType from "./FieldType";
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

      {occurrences.length === 0 && (
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
            backgroundColor: "#f25c54",
            color: "#fff",
            marginLeft: "8px"
          }}
        >
          Unused
        </span>
      )}
    </div>
  );
};

export default FieldLine;
