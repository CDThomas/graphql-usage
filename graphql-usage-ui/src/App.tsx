import React, { useEffect, useState } from "react";

import DetailsPanel from "./DetailsPanel";
import Header from "./Header";
import { Report, ReportField } from "./reportTypes";
import Schema from "./Schema";

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
