import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export default function SearchableDropdown({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  labelKey = "label",
  valueKey = "value",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    String(option[labelKey]).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((o) => o[valueKey] === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-input rounded-lg px-3 py-2 bg-background flex justify-between items-center cursor-pointer hover:border-input focus:ring-2 focus:ring-primary text-foreground"
      >
        <span className={`block truncate ${!selectedOption ? "text-muted-foreground" : "text-foreground"}`}>
          {selectedOption ? selectedOption[labelKey] : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-card shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-border overflow-auto focus:outline-none sm:text-sm">
          <div className="sticky top-0 bg-card px-2 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                className="w-full pl-8 pr-2 py-1 border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {filteredOptions.length === 0 ? (
            <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-muted-foreground italic">
              No results found
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option[valueKey]}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-accent hover:text-accent-foreground ${option[valueKey] === value ? "bg-accent text-accent-foreground font-medium" : "text-foreground"
                  }`}
                onClick={() => {
                  onChange(option[valueKey]);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
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
