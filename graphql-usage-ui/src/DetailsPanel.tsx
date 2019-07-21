import React from 'react';
import { ReportField } from './reportTypes';

interface Props {
  field: ReportField;
}
function DetailsPanel({ field }: Props) {
  if (field.occurrences.length === 0) return null;

  return (
    <div
      style={{
        flex: 1,
        borderColor: 'rgba(0,0,0,.1)',
        borderLeftStyle: 'solid',
        borderLeftWidth: '1px',
        position: 'fixed',
        right: 0,
        left: '60%',
        height: '100%',
        padding: '24px',
      }}>
      <h2
        style={{
          color: 'rgba(0,0,0,.3)',
          fontSize: '14px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
        Occurrences
      </h2>
      <ul>
        {field.occurrences.map(({ filename, rootNodeName }) => {
          return (
            <li
              style={{
                paddingBottom: '10px',
              }}>
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
  );
}

export default DetailsPanel;
