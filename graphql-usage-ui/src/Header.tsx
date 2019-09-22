import React from "react";

interface SearchBoxProps {
  searchText: string;
  onChange(searchText: string): void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onChange, searchText }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value);
  };

  return (
    <label
      style={{
        backgroundColor: "#fff",
        display: "inline-flex",
        alignItems: "center",
        padding: "0px 14px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, .1)",
        height: "45px"
      }}
    >
      <i style={{ transform: "rotate(0deg)", display: "flex" }}>
        <svg
          stroke="rgba(0, 0, 0, 0.3)"
          strokeWidth="3px"
          fill="none"
          style={{ width: "16px", height: "16px" }}
          viewBox="0 0 50 50"
        >
          <circle cx="17.82" cy="18.11" r="16.21" />
          <line x1="29.28" y1="29.57" x2="48.21" y2="48.5" />
        </svg>
      </i>
      <input
        style={{
          marginLeft: "10px",
          fontSize: "16px",
          border: "none",
          letterSpacing: "0.3px",
          color: "gba(0,0,0,0.8)",
          outlineWidth: "0"
        }}
        type="text"
        placeholder="Search..."
        value={searchText}
        onChange={handleChange}
        autoFocus
      />
    </label>
  );
};

interface HeaderProps {
  searchText: string;
  onSearchChange(searchText: string): void;
}

const Header: React.FC<HeaderProps> = ({ searchText, onSearchChange }) => {
  return (
    <header
      style={{
        paddingLeft: "24px",
        height: "72px",
        display: "flex",
        alignItems: "center",
        backgroundColor: "#fafafa",
        borderColor: "rgba(0,0,0,.1)",
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0
      }}
    >
      <SearchBox onChange={onSearchChange} searchText={searchText} />
    </header>
  );
};

export default Header;
