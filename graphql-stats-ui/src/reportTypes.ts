// TODO: import these types rather than duplicating them
export interface Report {
  data: {
    types: ReportType[],
  };
}

export interface ReportType {
  name: string;
  fields: ReportField[];
}

export interface ReportField {
  parentType: string;
  type: string;
  name: string;
  occurrences: ReportOccurrence[];
}

export interface ReportOccurrence {
  rootNodeName: string;
  filename: string;
}
