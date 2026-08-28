const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

code = code.replace(
  'const [step, setStep] = useState<1 | 2>(preselectedPlace ? 2 : 1);',
  'const [step, setStep] = useState<1 | 2>(1);'
);

code = code.replace(
  `  useEffect(() => {
    if (preselectedPlace) {
      setSelectedPlace(preselectedPlace);
      if (isOpen) setStep(2);
    }
  }, [preselectedPlace, isOpen]);`,
  `  useEffect(() => {
    if (preselectedPlace) {
      setSelectedPlace(preselectedPlace);
      if (isOpen) setStep(1);
    }
  }, [preselectedPlace, isOpen]);`
);

const targetUI = `        {/* STEP 1: PLACE & RATING SELECTION (Mobile & Desktop) */}
        {step === 1 && (
          <>
            {/* Mobile: Render CopoMobileSearchView for 100% exact parity with mobile search page */}
            <div className="md:hidden fixed inset-0 z-[250] bg-zinc-950">
              <CopoMobileSearchView
                places={places}
                videos={[]}
                onSelectVideo={() => {}}
                onOpenPlace={() => {}}
                onRecordForPlace={(place) => {
                  setSelectedPlace(place);
                  setRating(5);
                  setStep(2);
                  startCamera();
                }}
                onAddPlace={onAddPlace}
                onClose={onClose}
              />
            </div>
            
            {/* Desktop: Keep original step 1 modal */}
            <div className="hidden md:flex flex-col h-full bg-zinc-950">`;

const replaceUI = `        {/* STEP 1: PLACE & RATING SELECTION (Mobile & Desktop) */}
        {step === 1 && (
          <>
            {/* Mobile: Render CopoMobileSearchView for 100% exact parity with mobile search page */}
            {!selectedPlace && (
              <div className="md:hidden fixed inset-0 z-[250] bg-zinc-950">
                <CopoMobileSearchView
                  places={places}
                  videos={[]}
                  onSelectVideo={() => {}}
                  onOpenPlace={() => {}}
                  onRecordForPlace={(place) => {
                    setSelectedPlace(place);
                    setRating(0);
                  }}
                  onAddPlace={onAddPlace}
                  onClose={onClose}
                />
              </div>
            )}
            
            {/* Desktop: Keep original step 1 modal */}
            <div className={\`flex flex-col h-full bg-zinc-950 \${!selectedPlace ? 'hidden md:flex' : ''}\`}>`;

code = code.replace(targetUI, replaceUI);
fs.writeFileSync('src/components/CopoCreateModal.tsx', code);
