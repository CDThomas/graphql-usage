import React from "react";

import { ReportField } from "./reportTypes";

interface Props {
  field: ReportField;
}

const OccurrencesList: React.FC<Props> = ({ field }) => {
  return (
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
              <a href={filename} rel="noopener noreferrer" target="_blank">
                {rootNodeName}
              </a>
            </code>
          </li>
        );
      })}
    </ul>
  );
};

export default OccurrencesList;
