export interface CountryConfig {
  hasStates: boolean;
  stateLabel?: string;
  states?: string[];
  cities: string[] | { [state: string]: string[] };
}

export const locationData: Record<string, CountryConfig> = {
  "Afghanistan": {
    hasStates: false,
    cities: ["Kabul", "Herat", "Mazar-i-Sharif", "Kandahar", "Jalalabad", "Kunduz"]
  },
  "Albania": {
    hasStates: false,
    cities: ["Tirana", "Durrës", "Vlorë", "Shkodër", "Sarandë", "Gjirokastër"]
  },
  "Algeria": {
    hasStates: false,
    cities: ["Algiers", "Oran", "Constantine", "Annaba", "Blida", "Batna"]
  },
  "Andorra": {
    hasStates: false,
    cities: ["Andorra la Vella", "Escaldes-Engordany", "Encamp", "Sant Julià de Lòria"]
  },
  "Angola": {
    hasStates: false,
    cities: ["Luanda", "Huambo", "Lobito", "Benguela", "Lubango", "Malanje"]
  },
  "Antigua and Barbuda": {
    hasStates: false,
    cities: ["St. John's", "All Saints", "Liberta", "Potters Village"]
  },
  "Argentina": {
    hasStates: true,
    stateLabel: "Province",
    states: ["Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Salta", "Misiones"],
    cities: {
      "Buenos Aires": ["Buenos Aires City", "La Plata", "Mar del Plata", "Bahía Blanca", "Tandil"],
      "Córdoba": ["Córdoba", "Villa Carlos Paz", "Río Cuarto", "Villa María"],
      "Santa Fe": ["Rosario", "Santa Fe", "Rafaela", "Venado Tuerto"],
      "Mendoza": ["Mendoza", "San Rafael", "Godoy Cruz", "Maipú"],
      "Tucumán": ["San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo"],
      "Salta": ["Salta", "San Ramón de la Nueva Orán", "Tartagal"],
      "Misiones": ["Posadas", "Puerto Iguazú", "Oberá", "Eldorado"]
    }
  },
  "Armenia": {
    hasStates: false,
    cities: ["Yerevan", "Gyumri", "Vanadzor", "Vagharshapat", "Hrazdan", "Dilijan"]
  },
  "Australia": {
    hasStates: true,
    stateLabel: "State / Territory",
    states: ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Australian Capital Territory"],
    cities: {
      "New South Wales": ["Sydney", "Newcastle", "Wollongong", "Byron Bay"],
      "Victoria": ["Melbourne", "Geelong", "Ballarat", "Bendigo"],
      "Queensland": ["Brisbane", "Gold Coast", "Cairns", "Townsville", "Sunshine Coast"],
      "Western Australia": ["Perth", "Fremantle", "Broome"],
      "South Australia": ["Adelaide"],
      "Tasmania": ["Hobart", "Launceston"],
      "Australian Capital Territory": ["Canberra"]
    }
  },
  "Austria": {
    hasStates: false,
    cities: ["Vienna", "Salzburg", "Innsbruck", "Graz", "Linz", "Klagenfurt", "Bregenz"]
  },
  "Azerbaijan": {
    hasStates: false,
    cities: ["Baku", "Ganja", "Sumqayit", "Lankaran", "Nakhchivan", "Sheki"]
  },
  "Bahamas": {
    hasStates: false,
    cities: ["Nassau", "Freeport", "West End", "Coopers Town"]
  },
  "Bahrain": {
    hasStates: false,
    cities: ["Manama", "Riffa", "Muharraq", "Hamad Town", "A'ali", "Hidd"]
  },
  "Bangladesh": {
    hasStates: false,
    cities: ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Barisal"]
  },
  "Barbados": {
    hasStates: false,
    cities: ["Bridgetown", "Speightstown", "Oistins", "Holetown"]
  },
  "Belarus": {
    hasStates: false,
    cities: ["Minsk", "Gomel", "Mogilev", "Vitebsk", "Grodno", "Brest"]
  },
  "Belgium": {
    hasStates: true,
    stateLabel: "Region",
    states: ["Flanders", "Wallonia", "Brussels-Capital"],
    cities: {
      "Flanders": ["Antwerp", "Ghent", "Bruges", "Leuven", "Mechelen", "Hasselt", "Ostend"],
      "Wallonia": ["Liège", "Namur", "Charleroi", "Mons", "Tournai", "Arlon", "Dinant"],
      "Brussels-Capital": ["Brussels", "Ixelles", "Uccle", "Schaerbeek", "Anderlecht"]
    }
  },
  "Belize": {
    hasStates: false,
    cities: ["Belize City", "San Ignacio", "Belmopan", "Orange Walk", "Corozal"]
  },
  "Benin": {
    hasStates: false,
    cities: ["Cotonou", "Porto-Novo", "Parakou", "Djougou", "Bohicon"]
  },
  "Bhutan": {
    hasStates: false,
    cities: ["Thimphu", "Phuntsholing", "Paro", "Punakha", "Gelephu"]
  },
  "Bolivia": {
    hasStates: false,
    cities: ["La Paz", "Santa Cruz de la Sierra", "Sucre", "Cochabamba", "Oruro", "Potosí"]
  },
  "Bosnia and Herzegovina": {
    hasStates: false,
    cities: ["Sarajevo", "Banja Luka", "Mostar", "Tuzla", "Zenica", "Bihać"]
  },
  "Botswana": {
    hasStates: false,
    cities: ["Gaborone", "Francistown", "Molepolole", "Maun", "Serowe"]
  },
  "Brazil": {
    hasStates: true,
    stateLabel: "State",
    states: ["São Paulo", "Rio de Janeiro", "Minas Gerais", "Bahia", "Rio Grande do Sul", "Amazonas", "Paraná"],
    cities: {
      "São Paulo": ["São Paulo", "Campinas", "Santos", "São Bernardo do Campo", "Ribeirão Preto"],
      "Rio de Janeiro": ["Rio de Janeiro", "Niterói", "Búzios", "Petrópolis", "Angra dos Reis"],
      "Minas Gerais": ["Belo Horizonte", "Ouro Preto", "Uberlândia", "Juiz de Fora"],
      "Bahia": ["Salvador", "Porto Seguro", "Feira de Santana", "Ilhéus"],
      "Rio Grande do Sul": ["Porto Alegre", "Gramado", "Caxias do Sul", "Pelotas"],
      "Amazonas": ["Manaus", "Parintins", "Itacoatiara"],
      "Paraná": ["Curitiba", "Foz do Iguaçu", "Londrina", "Maringá"]
    }
  },
  "Brunei": {
    hasStates: false,
    cities: ["Bandar Seri Begawan", "Kuala Belait", "Seria", "Tutong"]
  },
  "Bulgaria": {
    hasStates: false,
    cities: ["Sofia", "Plovdiv", "Varna", "Burgas", "Ruse", "Stara Zagora"]
  },
  "Burkina Faso": {
    hasStates: false,
    cities: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora"]
  },
  "Burundi": {
    hasStates: false,
    cities: ["Gitega", "Bujumbura", "Muyinga", "Ngozi", "Rumonge"]
  },
  "Cabo Verde": {
    hasStates: false,
    cities: ["Praia", "Mindelo", "Santa Maria", "Assomada"]
  },
  "Cambodia": {
    hasStates: false,
    cities: ["Phnom Penh", "Siem Reap", "Sihanoukville", "Battambang", "Kampot"]
  },
  "Cameroon": {
    hasStates: false,
    cities: ["Douala", "Yaoundé", "Garoua", "Bamenda", "Maroua", "Bafoussam"]
  },
  "Canada": {
    hasStates: true,
    stateLabel: "Province / Territory",
    states: ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba", "Saskatchewan", "Nova Scotia"],
    cities: {
      "Ontario": ["Toronto", "Ottawa", "Mississauga", "Hamilton", "London", "Windsor", "Markham", "Vaughan"],
      "Quebec": ["Montreal", "Quebec City", "Laval", "Gatineau", "Sherbrooke", "Trois-Rivières"],
      "British Columbia": ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond", "Kelowna", "Nanaimo", "Whistler"],
      "Alberta": ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "Banff"],
      "Manitoba": ["Winnipeg", "Brandon"],
      "Saskatchewan": ["Saskatoon", "Regina"],
      "Nova Scotia": ["Halifax", "Sydney", "Dartmouth"]
    }
  },
  "Central African Republic": {
    hasStates: false,
    cities: ["Bangui", "Bimbo", "Mbaïki", "Berbérati"]
  },
  "Chad": {
    hasStates: false,
    cities: ["N'Djamena", "Moundou", "Sarh", "Abeche"]
  },
  "Chile": {
    hasStates: false,
    cities: ["Santiago", "Valparaíso", "Viña del Mar", "Concepción", "Antofagasta", "La Serena", "Punta Arenas"]
  },
  "China": {
    hasStates: true,
    stateLabel: "Province / Municipality",
    states: ["Beijing", "Shanghai", "Guangdong", "Zhejiang", "Sichuan", "Hubei", "Shaanxi"],
    cities: {
      "Beijing": ["Beijing"],
      "Shanghai": ["Shanghai"],
      "Guangdong": ["Guangzhou", "Shenzhen", "Dongguan", "Foshan", "Zhuhai", "Shantou"],
      "Zhejiang": ["Hangzhou", "Ningbo", "Wenzhou", "Shaoxing", "Yiwu"],
      "Sichuan": ["Chengdu", "Mianyang", "Leshan", "Jiuzhaigou"],
      "Hubei": ["Wuhan", "Yichang", "Xiangyang"],
      "Shaanxi": ["Xi'an", "Baoji", "Xianyang"]
    }
  },
  "Colombia": {
    hasStates: false,
    cities: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Santa Marta"]
  },
  "Comoros": {
    hasStates: false,
    cities: ["Moroni", "Mutsamudu", "Fomboni", "Domoni"]
  },
  "Congo": {
    hasStates: false,
    cities: ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi"]
  },
  "Costa Rica": {
    hasStates: false,
    cities: ["San José", "Alajuela", "Cartago", "Heredia", "Liberia", "Puntarenas", "Puerto Limón"]
  },
  "Croatia": {
    hasStates: false,
    cities: ["Zagreb", "Split", "Dubrovnik", "Rijeka", "Zadar", "Pula", "Hvar"]
  },
  "Cuba": {
    hasStates: false,
    cities: ["Havana", "Santiago de Cuba", "Camagüey", "Holguín", "Varadero", "Trinidad"]
  },
  "Cyprus": {
    hasStates: false,
    cities: ["Nicosia", "Limassol", "Larnaca", "Paphos", "Ayia Napa", "Kyrenia"]
  },
  "Czech Republic": {
    hasStates: false,
    cities: ["Prague", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "Karlovy Vary"]
  },
  "Democratic Republic of the Congo": {
    hasStates: false,
    cities: ["Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kisangani", "Goma", "Bukavu"]
  },
  "Denmark": {
    hasStates: false,
    cities: ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers"]
  },
  "Djibouti": {
    hasStates: false,
    cities: ["Djibouti City", "Ali Sabieh", "Tadjoura", "Dikhil"]
  },
  "Dominica": {
    hasStates: false,
    cities: ["Roseau", "Portsmouth", "Marigot", "Berekua"]
  },
  "Dominican Republic": {
    hasStates: false,
    cities: ["Santo Domingo", "Santiago de los Caballeros", "Punta Cana", "Puerto Plata", "La Romana"]
  },
  "Ecuador": {
    hasStates: false,
    cities: ["Quito", "Guayaquil", "Cuenca", "Manta", "Galapagos", "Loja", "Ambato"]
  },
  "Egypt": {
    hasStates: false,
    cities: ["Cairo", "Alexandria", "Giza", "Sharm El Sheikh", "Hurghada", "Luxor", "Aswan", "Dahab"]
  },
  "El Salvador": {
    hasStates: false,
    cities: ["San Salvador", "Santa Ana", "San Miguel", "Santa Tecla"]
  },
  "Equatorial Guinea": {
    hasStates: false,
    cities: ["Malabo", "Bata", "Oyala", "Ebebiyin"]
  },
  "Eritrea": {
    hasStates: false,
    cities: ["Asmara", "Keren", "Massawa", "Assab"]
  },
  "Estonia": {
    hasStates: false,
    cities: ["Tallinn", "Tartu", "Narva", "Pärnu", "Viljandi", "Kuressaare"]
  },
  "Eswatini": {
    hasStates: false,
    cities: ["Mbabane", "Manzini", "Lobamba", "Siteki"]
  },
  "Ethiopia": {
    hasStates: false,
    cities: ["Addis Ababa", "Dire Dawa", "Gondar", "Mekelle", "Bahir Dar", "Hawassa"]
  },
  "Fiji": {
    hasStates: false,
    cities: ["Suva", "Nadi", "Lautoka", "Labasa", "Savusavu"]
  },
  "Finland": {
    hasStates: false,
    cities: ["Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Rovaniemi", "Porvoo"]
  },
  "France": {
    hasStates: false,
    cities: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Bordeaux", "Cannes", "Chamonix"]
  },
  "Gabon": {
    hasStates: false,
    cities: ["Libreville", "Port-Gentil", "Franceville", "Oyem"]
  },
  "Gambia": {
    hasStates: false,
    cities: ["Banjul", "Serekunda", "Brikama", "Bakau"]
  },
  "Georgia": {
    hasStates: false,
    cities: ["Tbilisi", "Batumi", "Kutaisi", "Rustavi", "Gori"]
  },
  "Germany": {
    hasStates: true,
    stateLabel: "State",
    states: ["Bavaria", "Berlin", "Hamburg", "North Rhine-Westphalia", "Baden-Württemberg", "Hesse", "Saxony"],
    cities: {
      "Bavaria": ["Munich", "Nuremberg", "Augsburg", "Regensburg", "Garmisch-Partenkirchen"],
      "Berlin": ["Berlin"],
      "Hamburg": ["Hamburg"],
      "North Rhine-Westphalia": ["Cologne", "Düsseldorf", "Dortmund", "Essen", "Bonn", "Aachen"],
      "Baden-Württemberg": ["Stuttgart", "Heidelberg", "Karlsruhe", "Freiburg", "Baden-Baden"],
      "Hesse": ["Frankfurt", "Wiesbaden", "Kassel", "Darmstadt"],
      "Saxony": ["Dresden", "Leipzig", "Chemnitz"]
    }
  },
  "Ghana": {
    hasStates: false,
    cities: ["Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast", "Temale"]
  },
  "Greece": {
    hasStates: false,
    cities: ["Athens", "Thessaloniki", "Patras", "Heraklion", "Rhodes", "Mykonos", "Santorini", "Chania"]
  },
  "Grenada": {
    hasStates: false,
    cities: ["St. George's", "Gouyave", "Grenville", "Hillsborough"]
  },
  "Guatemala": {
    hasStates: false,
    cities: ["Guatemala City", "Antigua", "Quetzaltenango", "Flores", "Panajachel"]
  },
  "Guinea": {
    hasStates: false,
    cities: ["Conakry", "Nzérékoré", "Kankan", "Kindia"]
  },
  "Guyana": {
    hasStates: false,
    cities: ["Georgetown", "Linden", "New Amsterdam", "Anna Regina"]
  },
  "Haiti": {
    hasStates: false,
    cities: ["Port-au-Prince", "Cap-Haïtien", "Les Cayes", "Jacmel"]
  },
  "Honduras": {
    hasStates: false,
    cities: ["Tegucigalpa", "San Pedro Sula", "La Ceiba", "Roatán", "Copán Ruinas"]
  },
  "Hungary": {
    hasStates: false,
    cities: ["Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs", "Győr", "Siófok"]
  },
  "Iceland": {
    hasStates: false,
    cities: ["Reykjavík", "Kópavogur", "Hafnarfjörður", "Akureyri", "Keflavík", "Vík"]
  },
  "India": {
    hasStates: true,
    stateLabel: "State / UT",
    states: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana", "West Bengal", "Uttar Pradesh", "Rajasthan"],
    cities: {
      "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
      "Delhi": ["New Delhi", "Dwarka", "Rohini"],
      "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli"],
      "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Ooty"],
      "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
      "West Bengal": ["Kolkata", "Darjeeling", "Howrah", "Siliguri"],
      "Uttar Pradesh": ["Noida", "Agra", "Lucknow", "Varanasi", "Kanpur"],
      "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Jaisalmer"]
    }
  },
  "Indonesia": {
    hasStates: false,
    cities: ["Jakarta", "Bali", "Surabaya", "Bandung", "Medan", "Yogyakarta", "Semarang", "Ubud"]
  },
  "Iran": {
    hasStates: false,
    cities: ["Tehran", "Mashhad", "Isfahan", "Shiraz", "Tabriz", "Kish Island"]
  },
  "Iraq": {
    hasStates: false,
    cities: ["Baghdad", "Erbil", "Basra", "Sulaymaniyah", "Najaf", "Mosul"]
  },
  "Ireland": {
    hasStates: false,
    cities: ["Dublin", "Cork", "Galway", "Limerick", "Waterford", "Killarney", "Kilkenny"]
  },
  "Israel": {
    hasStates: false,
    cities: ["Tel Aviv", "Jerusalem", "Haifa", "Eilat", "Nazareth", "Netanya", "Herzliya"]
  },
  "Italy": {
    hasStates: false,
    cities: ["Rome", "Milan", "Venice", "Florence", "Naples", "Turin", "Amalfi", "Positano", "Como", "Palermo"]
  },
  "Jamaica": {
    hasStates: false,
    cities: ["Kingston", "Montego Bay", "Negril", "Ocho Rios", "Port Antonio"]
  },
  "Japan": {
    hasStates: true,
    stateLabel: "Prefecture",
    states: ["Tokyo", "Osaka", "Kyoto", "Kanagawa", "Hokkaido", "Okinawa", "Aichi"],
    cities: {
      "Tokyo": ["Tokyo", "Shibuya", "Shinjuku", "Chiyoda", "Roppongi"],
      "Osaka": ["Osaka", "Sakai", "Suita"],
      "Kyoto": ["Kyoto", "Uji", "Kameoka"],
      "Kanagawa": ["Yokohama", "Kamakura", "Hakone", "Kawasaki"],
      "Hokkaido": ["Sapporo", "Hakodate", "Otaru", "Niseko"],
      "Okinawa": ["Naha", "Okinawa City", "Ishigaki"],
      "Aichi": ["Nagoya", "Toyota", "Okazaki"]
    }
  },
  "Jordan": {
    hasStates: false,
    cities: ["Amman", "Aqaba", "Petra", "Jerash", "Madaba", "Irbid"]
  },
  "Kazakhstan": {
    hasStates: false,
    cities: ["Almaty", "Astana", "Shymkent", "Karaganda", "Aktau"]
  },
  "Kenya": {
    hasStates: false,
    cities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Naivasha"]
  },
  "Kiribati": {
    hasStates: false,
    cities: ["Tarawa", "Betio", "Bairiki", "London"]
  },
  "Kosovo": {
    hasStates: false,
    cities: ["Pristina", "Prizren", "Peja", "Mitrovica", "Gjakova"]
  },
  "Kuwait": {
    hasStates: false,
    cities: ["Kuwait City", "Salmiya", "Hawally", "Farwaniya", "Fahaheel"]
  },
  "Kyrgyzstan": {
    hasStates: false,
    cities: ["Bishkek", "Osh", "Jalal-Abad", "Karakol", "Cholpon-Ata"]
  },
  "Laos": {
    hasStates: false,
    cities: ["Vientiane", "Luang Prabang", "Vang Vieng", "Pakse", "Savannakhet"]
  },
  "Latvia": {
    hasStates: false,
    cities: ["Riga", "Jūrmala", "Liepāja", "Daugavpils", "Ventspils"]
  },
  "Lebanon": {
    hasStates: false,
    cities: ["Beirut", "Byblos", "Tripoli", "Sidon", "Tyre", "Baalbek", "Jounieh"]
  },
  "Lesotho": {
    hasStates: false,
    cities: ["Maseru", "Teyateyaneng", "Mafeteng", "Hlotse"]
  },
  "Liberia": {
    hasStates: false,
    cities: ["Monrovia", "Gbarnga", "Buchanan", "Kakata"]
  },
  "Libya": {
    hasStates: false,
    cities: ["Tripoli", "Benghazi", "Misrata", "Tobruk", "Ghadames"]
  },
  "Liechtenstein": {
    hasStates: false,
    cities: ["Vaduz", "Schaan", "Triesen", "Balzers", "Planken"]
  },
  "Lithuania": {
    hasStates: false,
    cities: ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Nida", "Druskininkai"]
  },
  "Luxembourg": {
    hasStates: false,
    cities: ["Luxembourg City", "Esch-sur-Alzette", "Differdange", "Echternach", "Vianden"]
  },
  "Madagascar": {
    hasStates: false,
    cities: ["Antananarivo", "Nosy Be", "Toamasina", "Antsirabe", "Mahajanga"]
  },
  "Malawi": {
    hasStates: false,
    cities: ["Lilongwe", "Blantyre", "Mzuzu", "Zomba"]
  },
  "Maldives": {
    hasStates: false,
    cities: ["Malé", "Maafushi", "Hulhumalé", "Addu City", "Fuvahmulah"]
  },
  "Mali": {
    hasStates: false,
    cities: ["Bamako", "Sikasso", "Mopti", "Timbuktu", "Segou"]
  },
  "Malta": {
    hasStates: false,
    cities: ["Valletta", "Sliema", "St. Julian's", "Mdina", "Mellieha", "Victoria"]
  },
  "Mauritania": {
    hasStates: false,
    cities: ["Nouakchott", "Nouadhibou", "Chinguetti", "Kiffa"]
  },
  "Mauritius": {
    hasStates: false,
    cities: ["Port Louis", "Grand Baie", "Flic en Flac", "Curepipe", "Mahebourg"]
  },
  "Mexico": {
    hasStates: true,
    stateLabel: "State",
    states: ["Ciudad de México", "Quintana Roo", "Jalisco", "Nuevo León", "Baja California", "Yucatán", "Oaxaca"],
    cities: {
      "Ciudad de México": ["Mexico City", "Coyoacán", "Polanco"],
      "Quintana Roo": ["Cancún", "Playa del Carmen", "Tulum", "Cozumel", "Isla Mujeres"],
      "Jalisco": ["Guadalajara", "Puerto Vallarta", "Tlaquepaque", "Tequila"],
      "Nuevo León": ["Monterrey", "San Pedro Garza García", "San Nicolás de los Garza"],
      "Baja California": ["Tijuana", "Cabo San Lucas", "San José del Cabo", "Ensenada"],
      "Yucatán": ["Mérida", "Valladolid", "Progreso", "Chichén Itzá"],
      "Oaxaca": ["Oaxaca City", "Puerto Escondido", "Huatulco"]
    }
  },
  "Moldova": {
    hasStates: false,
    cities: ["Chișinău", "Bălți", "Tiraspol", "Orhei", "Cahul"]
  },
  "Monaco": {
    hasStates: false,
    cities: ["Monaco", "Monte Carlo", "La Condamine", "Fontvieille"]
  },
  "Mongolia": {
    hasStates: false,
    cities: ["Ulaanbaatar", "Erdenet", "Darkhan", "Mörön"]
  },
  "Montenegro": {
    hasStates: false,
    cities: ["Podgorica", "Budva", "Kotor", "Tivat", "Herceg Novi", "Ulcinj"]
  },
  "Morocco": {
    hasStates: false,
    cities: ["Casablanca", "Marrakech", "Rabat", "Fes", "Tangier", "Agadir", "Chefchaouen", "Essaouira"]
  },
  "Mozambique": {
    hasStates: false,
    cities: ["Maputo", "Beira", "Nampula", "Inhambane", "Vilankulo"]
  },
  "Myanmar": {
    hasStates: false,
    cities: ["Yangon", "Mandalay", "Naypyidaw", "Bagan", "Inle Lake"]
  },
  "Namibia": {
    hasStates: false,
    cities: ["Windhoek", "Swakopmund", "Walvis Bay", "Lüderitz"]
  },
  "Nepal": {
    hasStates: false,
    cities: ["Kathmandu", "Pokhara", "Lalitpur", "Bhaktapur", "Chitwan"]
  },
  "Netherlands": {
    hasStates: false,
    cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Maastricht", "Groningen", "Haarlem"]
  },
  "New Zealand": {
    hasStates: false,
    cities: ["Auckland", "Wellington", "Christchurch", "Queenstown", "Rotorua", "Taupo", "Dunedin", "Wanaka"]
  },
  "Nicaragua": {
    hasStates: false,
    cities: ["Managua", "Granada", "León", "San Juan del Sur", "Estelí"]
  },
  "Niger": {
    hasStates: false,
    cities: ["Niamey", "Zinder", "Maradi", "Agadez"]
  },
  "Nigeria": {
    hasStates: false,
    cities: ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu"]
  },
  "North Korea": {
    hasStates: false,
    cities: ["Pyongyang", "Kaesong", "Wonsan", "Nampo", "Sinuiju"]
  },
  "North Macedonia": {
    hasStates: false,
    cities: ["Skopje", "Ohrid", "Bitola", "Tetovo", "Struga"]
  },
  "Norway": {
    hasStates: false,
    cities: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Tromsø", "Lofoten", "Flam"]
  },
  "Oman": {
    hasStates: false,
    cities: ["Muscat", "Salalah", "Sohar", "Nizwa", "Sur", "Seeb", "Mutrah"]
  },
  "Pakistan": {
    hasStates: false,
    cities: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Faisalabad", "Multan"]
  },
  "Palestine": {
    hasStates: false,
    cities: ["Ramallah", "East Jerusalem", "Gaza City", "Bethlehem", "Nablus", "Hebron", "Jericho"]
  },
  "Panama": {
    hasStates: false,
    cities: ["Panama City", "Bocas del Toro", "David", "Boquete", "Coronado", "Chitre"]
  },
  "Papua New Guinea": {
    hasStates: false,
    cities: ["Port Moresby", "Lae", "Mount Hagen", "Madang", "Kokopo"]
  },
  "Paraguay": {
    hasStates: false,
    cities: ["Asunción", "Ciudad del Este", "Encarnación", "Luque", "Villarrica"]
  },
  "Peru": {
    hasStates: false,
    cities: ["Lima", "Cusco", "Arequipa", "Mancora", "Iquitos", "Puno", "Huacachina"]
  },
  "Philippines": {
    hasStates: false,
    cities: ["Manila", "Quezon City", "Cebu City", "Davao City", "Boracay", "El Nido", "Siargao", "Makati"]
  },
  "Poland": {
    hasStates: false,
    cities: ["Warsaw", "Kraków", "Gdańsk", "Wrocław", "Poznań", "Sopot", "Zakopane"]
  },
  "Portugal": {
    hasStates: false,
    cities: ["Lisbon", "Porto", "Faro", "Sintra", "Cascais", "Lagos", "Funchal", "Albufeira", "Braga"]
  },
  "Qatar": {
    hasStates: false,
    cities: ["Doha", "Al Wakrah", "Al Khor", "Al Rayyan", "The Pearl", "Lusail"]
  },
  "Romania": {
    hasStates: false,
    cities: ["Bucharest", "Cluj-Napoca", "Brașov", "Sibiu", "Constanța", "Timișoara", "Iași"]
  },
  "Russia": {
    hasStates: false,
    cities: ["Moscow", "Saint Petersburg", "Sochi", "Kazan", "Novosibirsk", "Vladivostok", "Yekaterinburg"]
  },
  "Rwanda": {
    hasStates: false,
    cities: ["Kigali", "Gisenyi", "Musanze", "Butare", "Kibuye"]
  },
  "Samoa": {
    hasStates: false,
    cities: ["Apia", "Mulifanua", "Salelologa", "Lalomanu"]
  },
  "San Marino": {
    hasStates: false,
    cities: ["San Marino", "Borgo Maggiore", "Serravalle", "Domagnano"]
  },
  "Saudi Arabia": {
    hasStates: false,
    cities: ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Al Ula", "Taif", "Abha"]
  },
  "Senegal": {
    hasStates: false,
    cities: ["Dakar", "Saint-Louis", "Saly", "Ziguinchor", "Touba"]
  },
  "Serbia": {
    hasStates: false,
    cities: ["Belgrade", "Novi Sad", "Niš", "Kragujevac", "Zlatibor", "Subotica"]
  },
  "Seychelles": {
    hasStates: false,
    cities: ["Victoria", "La Digue", "Praslin", "Beau Vallon", "Eden Island"]
  },
  "Sierra Leone": {
    hasStates: false,
    cities: ["Freetown", "Bo", "Kenema", "Makeni"]
  },
  "Singapore": {
    hasStates: false,
    cities: ["Singapore", "Marina Bay", "Sentosa", "Changi", "Orchard", "Jurong"]
  },
  "Slovakia": {
    hasStates: false,
    cities: ["Bratislava", "Košice", "Vysoké Tatry", "Banská Bystrica", "Žilina"]
  },
  "Slovenia": {
    hasStates: false,
    cities: ["Ljubljana", "Bled", "Piran", "Maribor", "Portorož", "Postojna"]
  },
  "Somalia": {
    hasStates: false,
    cities: ["Mogadishu", "Hargeisa", "Garowe", "Bosaso", "Kismayo"]
  },
  "South Africa": {
    hasStates: false,
    cities: ["Cape Town", "Johannesburg", "Durban", "Pretoria", "Kruger", "Stellenbosch", "Port Elizabeth"]
  },
  "South Korea": {
    hasStates: false,
    cities: ["Seoul", "Busan", "Incheon", "Jeju Island", "Gyeongju", "Daegu", "Daejeon"]
  },
  "Spain": {
    hasStates: false,
    cities: ["Madrid", "Barcelona", "Seville", "Valencia", "Ibiza", "Mallorca", "Málaga", "Marbella", "Granada", "San Sebastián"]
  },
  "Sri Lanka": {
    hasStates: false,
    cities: ["Colombo", "Kandy", "Galle", "Ella", "Negombo", "Mirissa", "Sigiriya"]
  },
  "Sudan": {
    hasStates: false,
    cities: ["Khartoum", "Omdurman", "Port Sudan", "Kassala"]
  },
  "Suriname": {
    hasStates: false,
    cities: ["Paramaribo", "Lelydorp", "Nieuw Nickerie", "Groningen"]
  },
  "Sweden": {
    hasStates: false,
    cities: ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Visby", "Abisko", "Kiruna"]
  },
  "Switzerland": {
    hasStates: false,
    cities: ["Zurich", "Geneva", "Bern", "Lucerne", "Zermatt", "Lausanne", "Lugano", "Interlaken", "St. Moritz"]
  },
  "Syria": {
    hasStates: false,
    cities: ["Damascus", "Aleppo", "Latakia", "Homs", "Hama"]
  },
  "Taiwan": {
    hasStates: false,
    cities: ["Taipei", "Kaohsiung", "Taichung", "Tainan", "Hualien", "Jiufen"]
  },
  "Tajikistan": {
    hasStates: false,
    cities: ["Dushanbe", "Khujand", "Kulob", "Khorogh"]
  },
  "Tanzania": {
    hasStates: false,
    cities: ["Dar es Salaam", "Zanzibar City", "Arusha", "Stone Town", "Dodoma", "Mwanza"]
  },
  "Thailand": {
    hasStates: false,
    cities: ["Bangkok", "Phuket", "Chiang Mai", "Pattaya", "Koh Samui", "Krabi", "Hua Hin", "Phi Phi Islands"]
  },
  "Togo": {
    hasStates: false,
    cities: ["Lomé", "Sokodé", "Kpalimé", "Kara"]
  },
  "Tonga": {
    hasStates: false,
    cities: ["Nuku'alofa", "Neiafu", "Pangai", "Ohonua"]
  },
  "Trinidad and Tobago": {
    hasStates: false,
    cities: ["Port of Spain", "San Fernando", "Chaguanas", "Scarborough", "Crown Point"]
  },
  "Tunisia": {
    hasStates: false,
    cities: ["Tunis", "Sidi Bou Said", "Hammamet", "Sousse", "Djerba", "Carthage"]
  },
  "Turkey": {
    hasStates: false,
    cities: ["Istanbul", "Ankara", "Izmir", "Antalya", "Bodrum", "Cappadocia", "Fethiye", "Bursa", "Alaçatı"]
  },
  "Uganda": {
    hasStates: false,
    cities: ["Kampala", "Entebbe", "Jinja", "Mbarara", "Fort Portal"]
  },
  "Ukraine": {
    hasStates: false,
    cities: ["Kyiv", "Lviv", "Odesa", "Kharkiv", "Dnipro", "Chernivtsi"]
  },
  "United Arab Emirates": {
    hasStates: true,
    stateLabel: "Emirate",
    states: ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"],
    cities: {
      "Abu Dhabi": ["Abu Dhabi", "Al Ain", "Ruwais"],
      "Dubai": ["Dubai", "Hatta"],
      "Sharjah": ["Sharjah", "Khor Fakkan", "Kalba"],
      "Ajman": ["Ajman"],
      "Umm Al Quwain": ["Umm Al Quwain"],
      "Ras Al Khaimah": ["Ras Al Khaimah"],
      "Fujairah": ["Fujairah"]
    }
  },
  "United Kingdom": {
    hasStates: true,
    stateLabel: "Country / Region",
    states: ["England", "Scotland", "Wales", "Northern Ireland"],
    cities: {
      "England": ["London", "Manchester", "Birmingham", "Leeds", "Liverpool", "Newcastle", "Bristol", "Sheffield", "Nottingham", "Oxford", "Cambridge", "Bath"],
      "Scotland": ["Glasgow", "Edinburgh", "Aberdeen", "Dundee", "Inverness", "Stirling", "St Andrews"],
      "Wales": ["Cardiff", "Swansea", "Newport", "Bangor", "Conwy"],
      "Northern Ireland": ["Belfast", "Derry", "Lisburn", "Newry", "Armagh"]
    }
  },
  "United States": {
    hasStates: true,
    stateLabel: "State",
    states: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
      "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
      "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
      "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
      "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
    ],
    cities: {
      "Alabama": ["Birmingham", "Montgomery", "Mobile", "Huntsville", "Tuscaloosa"],
      "Alaska": ["Anchorage", "Juneau", "Fairbanks", "Sitka", "Ketchikan"],
      "Arizona": ["Phoenix", "Tucson", "Mesa", "Scottsdale", "Tempe", "Sedona"],
      "Arkansas": ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro"],
      "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Oakland", "Fresno", "Beverly Hills", "Malibu"],
      "Colorado": ["Denver", "Colorado Springs", "Boulder", "Aspen", "Aurora", "Fort Collins"],
      "Connecticut": ["Bridgeport", "New Haven", "Hartford", "Stamford", "Waterbury"],
      "Delaware": ["Wilmington", "Dover", "Newark", "Middletown", "Lewes"],
      "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "Tallahassee", "Key West", "Naples"],
      "Georgia": ["Atlanta", "Savannah", "Augusta", "Athens", "Columbus"],
      "Hawaii": ["Honolulu", "Maui", "Oahu", "Hilo", "Kailua", "Lahaina"],
      "Idaho": ["Boise", "Meridian", "Nampa", "Idaho Falls", "Pocatello"],
      "Illinois": ["Chicago", "Springfield", "Naperville", "Rockford", "Peoria", "Evanston"],
      "Indiana": ["Indianapolis", "Fort Wayne", "Bloomington", "South Bend", "Evansville"],
      "Iowa": ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City"],
      "Kansas": ["Wichita", "Overland Park", "Kansas City", "Topeka", "Lawrence"],
      "Kentucky": ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Frankfort"],
      "Louisiana": ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles"],
      "Maine": ["Portland", "Lewiston", "Bangor", "South Portland", "Augusta"],
      "Maryland": ["Baltimore", "Annapolis", "Ocean City", "Rockville", "Frederick"],
      "Massachusetts": ["Boston", "Cambridge", "Worcester", "Springfield", "Lowell"],
      "Michigan": ["Detroit", "Grand Rapids", "Ann Arbor", "Lansing", "Flint"],
      "Minnesota": ["Minneapolis", "Saint Paul", "Duluth", "Rochester", "Bloomington"],
      "Mississippi": ["Jackson", "Gulfport", "Biloxi", "Hattiesburg", "Meridian"],
      "Missouri": ["Kansas City", "St. Louis", "Springfield", "Columbia", "Jefferson City"],
      "Montana": ["Billings", "Missoula", "Great Falls", "Bozeman", "Helena"],
      "Nebraska": ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney"],
      "Nevada": ["Las Vegas", "Reno", "Carson City", "Henderson", "Sparks"],
      "New Hampshire": ["Manchester", "Nashua", "Concord", "Derry", "Portsmouth"],
      "New Jersey": ["Newark", "Jersey City", "Atlantic City", "Hoboken", "Princeton"],
      "New Mexico": ["Albuquerque", "Santa Fe", "Las Cruces", "Rio Rancho", "Roswell"],
      "New York": ["New York City", "Brooklyn", "Queens", "Manhattan", "Buffalo", "Rochester", "Syracuse", "Albany", "Yonkers"],
      "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Asheville", "Wilmington", "Durham"],
      "North Dakota": ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo"],
      "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"],
      "Oklahoma": ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Lawton"],
      "Oregon": ["Portland", "Eugene", "Salem", "Bend", "Hillsboro"],
      "Pennsylvania": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Harrisburg"],
      "Rhode Island": ["Providence", "Newport", "Warwick", "Cranston", "Pawtucket"],
      "South Carolina": ["Charleston", "Columbia", "Myrtle Beach", "Greenville", "Spartanburg"],
      "South Dakota": ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Pierre"],
      "Tennessee": ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"],
      "Texas": ["Houston", "Austin", "Dallas", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Plano"],
      "Utah": ["Salt Lake City", "Provo", "Park City", "West Valley City", "Ogdgen"],
      "Vermont": ["Burlington", "Montpelier", "Rutland", "South Burlington", "Barre"],
      "Virginia": ["Richmond", "Virginia Beach", "Norfolk", "Alexandria", "Chesapeake"],
      "Washington": ["Seattle", "Spokane", "Tacoma", "Bellevue", "Olympia", "Redmond"],
      "West Virginia": ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling"],
      "Wisconsin": ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Appleton"],
      "Wyoming": ["Cheyenne", "Casper", "Laramie", "Gillette", "Jackson"]
    }
  },
  "Uruguay": {
    hasStates: false,
    cities: ["Montevideo", "Punta del Este", "Colonia del Sacramento", "Maldonado", "Salto"]
  },
  "Uzbekistan": {
    hasStates: false,
    cities: ["Tashkent", "Samarkand", "Bukhara", "Khiva", "Nukus"]
  },
  "Vanuatu": {
    hasStates: false,
    cities: ["Port Vila", "Luganville", "Isangel", "Sola"]
  },
  "Vatican City": {
    hasStates: false,
    cities: ["Vatican City"]
  },
  "Venezuela": {
    hasStates: false,
    cities: ["Caracas", "Maracaibo", "Valencia", "Isla Margarita", "Mérida", "San Cristóbal"]
  },
  "Vietnam": {
    hasStates: false,
    cities: ["Ho Chi Minh City", "Hanoi", "Da Nang", "Nha Trang", "Ha Long", "Hoi An", "Hue", "Phu Quoc"]
  },
  "Yemen": {
    hasStates: false,
    cities: ["Sanaa", "Aden", "Taiz", "Al Hudaydah", "Socotra"]
  },
  "Zambia": {
    hasStates: false,
    cities: ["Lusaka", "Livingstone", "Ndola", "Kitwe", "Chingola"]
  },
  "Zimbabwe": {
    hasStates: false,
    cities: ["Harare", "Bulawayo", "Victoria Falls", "Mutare", "Gweru"]
  }
};
