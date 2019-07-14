import React from 'react';

interface SearchBoxProps {
  onChange: (searchText: string) => void;
  searchText: string;
}
function SearchBox({ onChange, searchText }: SearchBoxProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value);
  };

  return (
    <label
      style={{
        backgroundColor: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '12px 14px 13px 15px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, .1)',
      }}>
      <i style={{ transform: 'rotate(0deg)', display: 'flex' }}>
        <svg
          stroke="rgba(0, 0, 0, 0.3)"
          strokeWidth="3px"
          fill="none"
          style={{ width: '16px', height: '16px' }}
          viewBox="0 0 50 50">
          <circle cx="17.82" cy="18.11" r="16.21" />
          <line x1="29.28" y1="29.57" x2="48.21" y2="48.5" />
        </svg>
      </i>
      <input
        style={{
          marginLeft: '10px',
          fontSize: '16px',
          border: 'none',
          letterSpacing: '0.3px',
          color: 'gba(0,0,0,0.8)',
          outlineWidth: '0',
        }}
        type="text"
        placeholder="Search..."
        value={searchText}
        onChange={handleChange}
        autoFocus
      />
    </label>
  );
}

interface HeaderProps {
  onSearchChange: (searchText: string) => void;
  searchText: string;
}
function Header({ onSearchChange, searchText }: HeaderProps) {
  return (
    <header
      style={{
        padding: '24px',
        backgroundColor: '#fafafa',
        borderColor: 'rgba(0,0,0,.1)',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
      }}>
      <SearchBox onChange={onSearchChange} searchText={searchText} />
    </header>
  );
}

export default Header;
