import React from "react";

import Delimiter from "./Delimiter";
import FieldName from "./FieldName";
import FieldType from "./FieldType";
import OccurrencesList from "./OccurrencesList";
import { ReportField } from "./reportTypes";
import TypeName from "./TypeName";

const Panel: React.FC = ({ children }) => {
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
        backgroundColor: "#fff",
        boxShadow: "0 0 8px rgba(0, 0, 0, 0.15)"
      }}
    >
      {children}
    </div>
  );
};

const DetailsPanelHeader: React.FC = ({ children }) => {
  return (
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
      {children}
    </div>
  );
};

interface DetailsPanelTitleProps {
  field: ReportField;
}

const DetailsPanelTitle: React.FC<DetailsPanelTitleProps> = ({ field }) => {
  return (
    <div>
      <TypeName>{field.parentType}</TypeName>
      <Delimiter token="." />
      <FieldName>{field.name}</FieldName>
    </div>
  );
};

const DetailsPanelBody: React.FC = ({ children }) => {
  return (
    <div
      style={{
        padding: "0 24px"
      }}
    >
      {children}
    </div>
  );
};

const DetailsPanelHeading: React.FC = ({ children }) => {
  return (
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
      {children}
    </h2>
  );
};

interface CloseButtonProps {
  onClick(): void;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClick }) => {
  return (
    <div
      style={{
        margin: "-7px -8px -6px 0",
        cursor: "pointer",
        padding: "18px 16px 15px 12px",
        fontSize: "24px"
      }}
      onClick={onClick}
    >
      ✕
    </div>
  );
};

interface Props {
  field: ReportField;
  onClose(): void;
}

const DetailsPanel: React.FC<Props> = ({ field, onClose }) => {
  if (field.occurrences.length === 0) return null;

  return (
    <Panel>
      <DetailsPanelHeader>
        <DetailsPanelTitle field={field} />
        <CloseButton onClick={onClose} />
      </DetailsPanelHeader>
      <DetailsPanelBody>
        <DetailsPanelHeading>Type</DetailsPanelHeading>
        <FieldType>{field.type}</FieldType>
        <DetailsPanelHeading>Occurrences</DetailsPanelHeading>
        <OccurrencesList field={field} />
      </DetailsPanelBody>
    </Panel>
  );
};

export default DetailsPanel;
