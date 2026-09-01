const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'const [places, setPlaces] = useState<Place[]>([]);',
  `const [places, setPlaces] = useState<Place[]>(() => {
    try {
      const cached = localStorage.getItem("yoouz_cached_places");
      if (cached) return JSON.parse(cached);
    } catch(e){}
    return [];
  });
  
  useEffect(() => {
    try {
      if (places.length > 0) {
        localStorage.setItem("yoouz_cached_places", JSON.stringify(places));
      }
    } catch (e) {}
  }, [places]);`
);

fs.writeFileSync('src/App.tsx', code);
