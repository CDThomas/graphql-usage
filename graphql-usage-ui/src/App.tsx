import React, { useEffect, useState } from "react";

import DetailsPanel from "./DetailsPanel";
import Header from "./Header";
import { Report, ReportField, ReportType } from "./reportTypes";

interface SchemaProps {
  types: ReportType[];
  filter: string;
  onFieldClick(field: ReportField): void;
}
function Schema({ types, filter, onFieldClick }: SchemaProps) {
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
}

function TypeLine({
  children
}: {
  children: Array<JSX.Element | string> | JSX.Element | string;
}) {
  return <div>{children}</div>;
}

interface FieldLineProps {
  field: ReportField;
  filter: string;
  onFieldClick(field: ReportField): void;
}
function FieldLine({ field, filter, onFieldClick }: FieldLineProps) {
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
}

interface FieldNameProps {
  children: string;
  highlight: boolean;
}
function FieldName({ children, highlight }: FieldNameProps) {
  const highlightStyles = highlight ? { backgroundColor: "#ffffe0" } : {};
  return (
    <span style={{ color: "#1f61a0", padding: "10px 0px", ...highlightStyles }}>
      {children}
    </span>
  );
}

function TypeKind({ children }: { children: string }) {
  return <span style={{ color: "#1f61a0" }}>{children}</span>;
}

interface TypeNameProps {
  children: string;
  highlight: boolean;
}
function TypeName({ children, highlight }: TypeNameProps) {
  const highlightStyles = highlight ? { backgroundColor: "#ffffe0" } : {};

  return (
    <span style={{ color: "#f25c54", padding: "10px 0px", ...highlightStyles }}>
      {children}
    </span>
  );
}

interface FieldTypeProps {
  children: string;
  highlight: boolean;
}
function FieldType({ children, highlight }: FieldTypeProps) {
  const highlightStyles = highlight ? { backgroundColor: "#ffffe0" } : {};
  return (
    <span style={{ color: "#f5a000", padding: "10px 0px", ...highlightStyles }}>
      {children}
    </span>
  );
}

function Delimiter({ token }: { token: string }) {
  const color =
    token === "{" || token === "}" ? "rgba(23,42,58,.5)" : "#555555";

  return <span style={{ color }}>{token}</span>;
}

interface TypeBlockProps {
  type: ReportType;
  filter: string;
  onFieldClick(field: ReportField): void;
}
function TypeBlock({ type, filter, onFieldClick }: TypeBlockProps) {
  const { name, fields } = type;
  const typeMatchesFilter = type.name
    .toLowerCase()
    .includes(filter.toLowerCase());

  return (
    <div style={{ paddingBottom: "20px" }}>
      <TypeLine>
        <TypeKind>type</TypeKind>{" "}
        <TypeName highlight={!!filter && typeMatchesFilter}>{name}</TypeName>{" "}
        <Delimiter token={"{"} />
      </TypeLine>
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
      <TypeLine>
        <Delimiter token={"}"} />
      </TypeLine>
    </div>
  );
}

function App() {
  const [filter, setFilter] = useState("");
  const handleSearchChange = (searchText: string) => setFilter(searchText);

  const [showDetails, setShowDetails] = useState(false);
  const [selectedField, setSelectedField] = useState<ReportField | null>(null);
  const handleFieldClick = (field: ReportField): void => {
    setShowDetails(true);
    setSelectedField(field);
  };

  const [report, setReport] = useState<Report | null>(null);
  const hasReportLoaded = !!report;

  useEffect(() => {
    fetch("/stats")
      .then(res => res.json())
      .then((report: Report) => {
        setReport(report);
      });
  }, [hasReportLoaded]);

  if (!report) {
    return <div>Loading...</div>;
  }

  const types = report.data.types.filter(type => {
    const lowerCaseFilter = filter.toLowerCase();
    const typeMatchesFilter = type.name.toLowerCase().includes(lowerCaseFilter);

    const fieldsMatchFilter = type.fields
      .map(field => {
        const typeMatchesFilter = field.type
          .toLowerCase()
          .includes(lowerCaseFilter);
        const fieldMatchesFilter = field.name
          .toLowerCase()
          .includes(lowerCaseFilter);

        return fieldMatchesFilter || typeMatchesFilter;
      })
      .includes(true);

    return typeMatchesFilter || fieldsMatchFilter;
  });

  return (
    <div style={{ paddingTop: "94px" }}>
      <Header onSearchChange={handleSearchChange} searchText={filter} />
      {types.length === 0 ? (
        <p style={{ padding: "36px" }}>No types or fields match your search.</p>
      ) : (
        <div style={{ display: "flex" }}>
          <Schema
            types={types}
            filter={filter}
            onFieldClick={handleFieldClick}
          />
          {showDetails && selectedField && (
            <DetailsPanel field={selectedField} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
