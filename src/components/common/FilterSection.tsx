import React from 'react';

interface FilterOptionProps {
  id: string;
  name: string;
  selected: boolean;
  onClick: (id: string) => void;
}

const FilterOption: React.FC<FilterOptionProps> = ({ id, name, selected, onClick }) => {
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-3 py-1 rounded-full text-sm m-1 transition-colors ${
        selected
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {name}
    </button>
  );
};

interface FilterSectionProps {
  title: string;
  options: Array<{ id: string; name: string }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  options,
  selectedIds,
  onToggle,
}) => {
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      <div className="flex flex-wrap">
        {options.map((option) => (
          <FilterOption
            key={option.id}
            id={option.id}
            name={option.name}
            selected={selectedIds.includes(option.id)}
            onClick={onToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default FilterSection; 