sed -i 's/showAutocompleteDropdown && query.trim().length > 0/showAutocompleteDropdown \&\& !selectedPlace \&\& query.trim().length > 0/g' src/components/CopoSearchView.tsx
