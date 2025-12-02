import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export default function SearchableDropdown({
  options = [],
  value,
  onChange,
  placeholder = "Type to search...",
  labelKey = "label",
  valueKey = "value",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm(""); // Clear search when closing
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    String(option[labelKey]).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((o) => o[valueKey] === value);

  // Handle input change - open dropdown and filter
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);
  };

  // Handle option select
  const handleSelect = (option) => {
    onChange(option[valueKey]);
    setSearchTerm("");
    setIsOpen(false);
  };

  // Clear selection
  const handleClear = () => {
    onChange("");
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm || (selectedOption ? selectedOption[labelKey] : "")}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full border border-input rounded-lg px-3 py-2 pr-20 bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(selectedOption || searchTerm) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-accent rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-card shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-border overflow-auto focus:outline-none sm:text-sm">
          {filteredOptions.length === 0 ? (
            <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-muted-foreground italic">
              {searchTerm ? "No results found" : "Start typing to search..."}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option[valueKey]}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-accent hover:text-accent-foreground ${
                  option[valueKey] === value ? "bg-accent text-accent-foreground font-medium" : "text-foreground"
                }`}
                onClick={() => handleSelect(option)}
              >
                {option[labelKey]}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
