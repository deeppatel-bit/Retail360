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
  allowCustomValue = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        // If closing and we have a custom value typed but not selected, maybe we should select it?
        // For now, let's just clear search if it doesn't match value.
        // Actually, better UX: if allowCustomValue is true, trigger change on blur?
        // But click outside is tricky. Let's stick to explicit selection for now.
        if (!value) setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filteredOptions = options.filter((option) =>
    String(option[labelKey]).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((o) => o[valueKey] === value);

  // Sync searchTerm with value when value changes externally
  useEffect(() => {
    if (selectedOption) {
      setSearchTerm(selectedOption[labelKey]);
    } else if (allowCustomValue && value) {
      setSearchTerm(value);
    } else if (!value) {
      setSearchTerm("");
    }
  }, [value, selectedOption, allowCustomValue, labelKey]);

  // Handle input change
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);
    setActiveIndex(0); // Reset to first option on search

    // If custom value allowed, update immediately? 
    // Usually better to wait for selection, but for "free text" fields it might be expected.
    // Let's keep it explicit (Enter or Click) to avoid accidental garbage data, 
    // UNLESS the user expects it to work like a normal input.
    // Given the user said "click krna pd rha he", they probably want "Type -> Enter".
  };

  // Handle option select
  const handleSelect = (option) => {
    onChange(option[valueKey]);
    setIsOpen(false);
    setSearchTerm(option[labelKey]);
  };

  // Handle custom value select
  const handleCustomSelect = () => {
    if (allowCustomValue && searchTerm) {
      onChange(searchTerm);
      setIsOpen(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        scrollIntoView(activeIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
        scrollIntoView(activeIndex - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelect(filteredOptions[activeIndex]);
        } else if (allowCustomValue) {
          handleCustomSelect();
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "Tab":
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelect(filteredOptions[activeIndex]);
        } else if (allowCustomValue && searchTerm) {
          handleCustomSelect();
        }
        setIsOpen(false);
        break;
    }
  };

  const scrollIntoView = (index) => {
    if (listRef.current) {
      const element = listRef.current.children[index];
      if (element) {
        element.scrollIntoView({ block: "nearest" });
      }
    }
  };

  // Clear selection
  const handleClear = () => {
    onChange("");
    setSearchTerm("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full border border-input rounded-lg px-3 py-2 pr-20 bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(searchTerm) && (
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
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-card shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-border overflow-auto focus:outline-none sm:text-sm"
        >
          {filteredOptions.length === 0 ? (
            <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-muted-foreground italic">
              {allowCustomValue && searchTerm ? (
                <div
                  className="cursor-pointer text-primary font-medium"
                  onClick={handleCustomSelect}
                >
                  Use "{searchTerm}"
                </div>
              ) : (
                searchTerm ? "No results found" : "Start typing to search..."
              )}
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option[valueKey]}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${index === activeIndex ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  } ${option[valueKey] === value ? "font-medium" : ""}`}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setActiveIndex(index)}
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
