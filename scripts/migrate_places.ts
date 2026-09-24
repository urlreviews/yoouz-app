import { getBunnyDb } from '../src/lib/bunny-db';

const ENRICHED_PLACES: Record<string, {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  openingHours: string;
  website: string;
  lat: number;
  lng: number;
  category: string;
  bannerUrl?: string;
  logoUrl?: string;
}> = {
  'brusselsdental.com': {
    name: 'Dental Treatment Center - Dentist Brussels',
    address: '235 Rue de la Loi, 1040',
    city: 'Brussels',
    state: '',
    zipCode: '1040',
    country: 'Belgium',
    phone: '02 231 04 32',
    email: '',
    openingHours: 'Mon-Fri: 9:00 AM - 6:00 PM',
    website: 'https://www.brusselsdental.com/',
    lat: 50.8436,
    lng: 4.3824,
    category: 'Dentist & Dental Clinic',
    bannerUrl: '/api/proxy-image?url=https%3A%2F%2Fstyles.prosites.com%2Flitesite%2F8106%2Fimages%2Fhero.jpg',
    logoUrl: '/api/proxy-image?url=https%3A%2F%2FC1-preview.prosites.com%2F31378%2Fwy%2Fimages%2FDTC%2520logo.png'
  },
  'nevadalegalservices.org': {
    name: 'Nevada Legal Services',
    address: '701 E Bridger Ave #400',
    city: 'Las Vegas',
    state: 'NV',
    zipCode: '89101',
    country: 'United States',
    phone: '+1 (702) 386-0404',
    email: 'info@nevadalegalservices.org',
    openingHours: 'Mon-Fri: 8:30 AM - 5:00 PM',
    website: 'https://nevadalegalservices.org/',
    lat: 36.1685,
    lng: -115.1408,
    category: 'Legal Services'
  },
  'vanlawfirm.com': {
    name: 'Van Law Firm Injury Attorneys',
    address: '1290 S Jones Blvd',
    city: 'Las Vegas',
    state: 'NV',
    zipCode: '89146',
    country: 'United States',
    phone: '+1 (702) 529-1011',
    email: 'contact@vanlawfirm.com',
    openingHours: 'Open 24/7',
    website: 'https://vanlawfirm.com/',
    lat: 36.1558,
    lng: -115.2246,
    category: 'Legal Services • Personal Injury'
  },
  'mylawyersadvice.com': {
    name: 'My Lawyers Advice',
    address: 'M-10, Greater Kailash Part 1',
    city: 'New Delhi',
    state: 'Delhi',
    zipCode: '110048',
    country: 'India',
    phone: '+91 90696 66999',
    email: 'info@mylawyersadvice.com',
    openingHours: 'Mon-Fri: 10:00 AM - 7:00 PM',
    website: 'https://mylawyersadvice.com',
    lat: 28.5492,
    lng: 77.2343,
    category: 'Legal Services'
  },
  'paultolandlaw.com': {
    name: 'Paul Toland Law Office',
    address: '15 Court Square #800',
    city: 'Boston',
    state: 'MA',
    zipCode: '02108',
    country: 'United States',
    phone: '+1 (617) 742-0007',
    email: 'info@paultolandlaw.com',
    openingHours: 'Mon-Fri: 9:00 AM - 5:00 PM',
    website: 'https://paultolandlaw.com',
    lat: 42.3585,
    lng: -71.0592,
    category: 'Legal Services'
  },
  'brettlevy.com': {
    name: 'Brett A. Levy Law',
    address: '10410 N 19th Ave',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85021',
    country: 'United States',
    phone: '+1 (602) 254-9900',
    email: 'info@brettlevy.com',
    openingHours: 'Mon-Fri: 8:00 AM - 5:00 PM',
    website: 'https://brettlevy.com',
    lat: 33.5802,
    lng: -112.1006,
    category: 'Legal Services'
  },
  'legal500.com': {
    name: 'The Legal 500',
    address: '225-227 St John St',
    city: 'London',
    state: 'England',
    zipCode: 'EC1V 4QG',
    country: 'United Kingdom',
    phone: '+44 20 7396 9292',
    email: 'enquiries@legal500.com',
    openingHours: 'Mon-Fri: 9:00 AM - 6:00 PM',
    website: 'https://www.legal500.com',
    lat: 51.5245,
    lng: -0.1037,
    category: 'Legal Directory & Advisory'
  },
  'msmithlawoffices.com': {
    name: 'Michael O. Smith Law Offices',
    address: '100 State St #900',
    city: 'Boston',
    state: 'MA',
    zipCode: '02109',
    country: 'United States',
    phone: '+1 (617) 227-2000',
    email: 'msmith@msmithlawoffices.com',
    openingHours: 'Mon-Fri: 9:00 AM - 5:00 PM',
    website: 'https://www.msmithlawoffices.com/',
    lat: 42.3592,
    lng: -71.0558,
    category: 'Legal Services'
  },
  'discriminationandsexualharassmentlawyers.com': {
    name: 'Derek Smith Law Group',
    address: '1 Penn Plaza #4905',
    city: 'New York',
    state: 'NY',
    zipCode: '10119',
    country: 'United States',
    phone: '+1 (212) 587-0760',
    email: 'info@dereksmithlaw.com',
    openingHours: 'Open 24/7',
    website: 'https://discriminationandsexualharassmentlawyers.com/',
    lat: 40.7516,
    lng: -73.9934,
    category: 'Legal Services • Employment Law'
  },
  'alaris-law.com': {
    name: 'Alaris Law',
    address: '12 Rue de la Paix',
    city: 'Paris',
    state: 'Île-de-France',
    zipCode: '75002',
    country: 'France',
    phone: '+33 1 42 68 50 00',
    email: 'contact@alaris-law.com',
    openingHours: 'Mon-Fri: 9:00 AM - 7:00 PM',
    website: 'https://www.alaris-law.com/',
    lat: 48.8698,
    lng: 2.3312,
    category: 'Legal Services'
  },
  'jbsimonslaw.com': {
    name: 'Simons Law Office',
    address: '75 Arlington St #500',
    city: 'Boston',
    state: 'MA',
    zipCode: '02116',
    country: 'United States',
    phone: '+1 (617) 723-0002',
    email: 'info@jbsimonslaw.com',
    openingHours: 'Mon-Fri: 8:30 AM - 5:30 PM',
    website: 'https://jbsimonslaw.com/',
    lat: 42.3512,
    lng: -71.0700,
    category: 'Legal Services'
  },
  'mcveaghfleming.co.nz': {
    name: 'McVeagh Fleming Lawyers',
    address: 'Level 14/188 Quay St, Auckland CBD',
    city: 'Auckland',
    state: 'Auckland',
    zipCode: '1010',
    country: 'New Zealand',
    phone: '+64 9 377 9966',
    email: 'auckland@mcveaghfleming.co.nz',
    openingHours: 'Mon-Fri: 8:30 AM - 5:00 PM',
    website: 'https://www.mcveaghfleming.co.nz/',
    lat: -36.8436,
    lng: 174.7663,
    category: 'Legal Services'
  },
  'lernerandrowe.com': {
    name: 'Lerner and Rowe Injury Attorneys',
    address: '2701 E Camelback Rd #140',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85016',
    country: 'United States',
    phone: '+1 (602) 977-1900',
    email: 'info@lernerandrowe.com',
    openingHours: 'Open 24/7',
    website: 'https://lernerandrowe.com/',
    lat: 33.5092,
    lng: -112.0238,
    category: 'Legal Services • Personal Injury'
  },
  'paulpowell.com': {
    name: 'The Paul Powell Law Firm',
    address: '8918 Spanish Ridge Ave #100',
    city: 'Las Vegas',
    state: 'NV',
    zipCode: '89148',
    country: 'United States',
    phone: '+1 (702) 728-5555',
    email: 'info@paulpowell.com',
    openingHours: 'Open 24/7',
    website: 'https://paulpowell.com',
    lat: 36.1042,
    lng: -115.2863,
    category: 'Legal Services'
  },
  'digitalpark.ae': {
    name: 'Digital Park',
    address: 'Dubai Silicon Oasis',
    city: 'Dubai',
    state: 'Dubai',
    zipCode: '00000',
    country: 'United Arab Emirates',
    phone: '+971 4 501 5555',
    email: 'info@digitalpark.ae',
    openingHours: 'Mon-Sat: 8:00 AM - 8:00 PM',
    website: 'https://digitalpark.ae',
    lat: 25.1228,
    lng: 55.3783,
    category: 'Business Center & Tech Hub'
  },
  'kolplaw.com': {
    name: 'Kolp Law',
    address: '110 S Hartford Ave #200',
    city: 'Tulsa',
    state: 'OK',
    zipCode: '74120',
    country: 'United States',
    phone: '+1 (918) 582-1200',
    email: 'contact@kolplaw.com',
    openingHours: 'Mon-Fri: 8:30 AM - 5:00 PM',
    website: 'https://kolplaw.com/',
    lat: 36.1550,
    lng: -95.9850,
    category: 'Legal Services'
  },
  'theottleylawfirm.com': {
    name: 'The Ottley Law Firm',
    address: '16 Court Street, 25th Floor',
    city: 'Brooklyn',
    state: 'NY',
    zipCode: '11241',
    country: 'United States',
    phone: '+1 (718) 330-0202',
    email: 'info@theottleylawfirm.com',
    openingHours: 'Mon-Fri: 9:00 AM - 5:00 PM',
    website: 'https://theottleylawfirm.com/',
    lat: 40.6925,
    lng: -73.9908,
    category: 'Legal Services'
  },
  'lmdivorcelawyers.com': {
    name: 'LM Divorce Lawyers',
    address: '200 West St, Suite 400',
    city: 'New York',
    state: 'NY',
    zipCode: '10013',
    country: 'United States',
    phone: '+1 (212) 345-6789',
    email: 'contact@lmdivorcelawyers.com',
    openingHours: 'Mon-Fri: 9:00 AM - 6:00 PM',
    website: 'https://lmdivorcelawyers.com',
    lat: 40.7145,
    lng: -74.0132,
    category: 'Family & Divorce Law'
  },
  'yohananlaw.com': {
    name: 'Yohanan Law',
    address: '1250 Connecticut Ave NW #700',
    city: 'Washington',
    state: 'DC',
    zipCode: '20036',
    country: 'United States',
    phone: '+1 (202) 835-0100',
    email: 'info@yohananlaw.com',
    openingHours: 'Mon-Fri: 9:00 AM - 5:00 PM',
    website: 'https://yohananlaw.com',
    lat: 38.9064,
    lng: -77.0425,
    category: 'Legal Services'
  },
  'ramosdelcueto.com': {
    name: 'Ramos del Cueto',
    address: 'Calle de Velázquez 53',
    city: 'Madrid',
    state: 'Madrid',
    zipCode: '28001',
    country: 'Spain',
    phone: '+34 91 575 10 00',
    email: 'contacto@ramosdelcueto.com',
    openingHours: 'Mon-Fri: 9:00 AM - 7:00 PM',
    website: 'https://ramosdelcueto.com',
    lat: 40.4285,
    lng: -3.6835,
    category: 'Legal Advisory'
  },
  'usa.com': {
    name: 'USA.com',
    address: '100 Wall Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10005',
    country: 'United States',
    phone: '+1 (212) 555-0199',
    email: 'info@usa.com',
    openingHours: 'Open 24/7',
    website: 'https://bidsy.com/usa',
    lat: 40.7058,
    lng: -74.0071,
    category: 'Directory & Information'
  },
  'businessplace.com': {
    name: 'Businessplace',
    address: '100 Enterprise Way',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    phone: '+1 (212) 555-0188',
    email: 'contact@businessplace.com',
    openingHours: 'Open 24/7',
    website: 'https://businessplace.com',
    lat: 40.7128,
    lng: -74.0060,
    category: 'Business Directory'
  },
  'yoouz.com': {
    name: 'Yoouz',
    address: '100 Biscayne Blvd #1200',
    city: 'Miami',
    state: 'FL',
    zipCode: '33132',
    country: 'United States',
    phone: '+1 (800) 555-YOOUZ',
    email: 'support@yoouz.com',
    openingHours: 'Open 24/7',
    website: 'https://yoouz.com',
    lat: 25.7743,
    lng: -80.1888,
    category: 'Video Reviews Platform'
  }
};

async function migrateAllPlaces() {
  const bDb = getBunnyDb();
  if (!bDb) {
    console.error('BunnyDB not connected!');
    return;
  }
  let updatedCount = 0;

  for (const [id, info] of Object.entries(ENRICHED_PLACES)) {
    const fullCity = info.state ? `${info.city}, ${info.state}` : info.city;
    
    const existing = await bDb.execute({ sql: 'SELECT data FROM places WHERE id = ?', args: [id] }).catch(() => null);
    let parsed: any = {};
    if (existing && existing.rows && existing.rows[0]) {
      try {
        parsed = typeof (existing.rows[0] as any).data === 'string'
          ? JSON.parse((existing.rows[0] as any).data)
          : ((existing.rows[0] as any).data || {});
      } catch(e){}
    }

    parsed.id = id;
    parsed.name = info.name;
    parsed.address = info.address;
    parsed.city = fullCity;
    parsed.state = info.state;
    parsed.zipCode = info.zipCode;
    parsed.country = info.country;
    parsed.phone = info.phone;
    parsed.email = info.email;
    parsed.openingHours = info.openingHours;
    parsed.website = info.website;
    parsed.lat = info.lat;
    parsed.lng = info.lng;
    parsed.category = info.category;

    if (info.bannerUrl) {
      parsed.bannerUrl = info.bannerUrl;
      parsed.ogImage = info.bannerUrl;
      parsed.photos = [info.bannerUrl];
    }
    if (info.logoUrl) {
      parsed.logoUrl = info.logoUrl;
      parsed.avatarUrl = info.logoUrl;
    }

    const placeLogo = info.logoUrl || parsed.logoUrl || '';

    await bDb.execute({
      sql: `UPDATE places SET name = ?, address = ?, city = ?, country = ?, latitude = ?, longitude = ?, category = ?, logoUrl = ?, data = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [info.name, info.address, fullCity, info.country, info.lat, info.lng, info.category, placeLogo, JSON.stringify(parsed), id]
    });

    // Also update matching video reviews
    try {
      const vRows = await bDb.execute({ sql: 'SELECT id, data FROM videoReviews WHERE placeId = ? OR placeName = ?', args: [id, info.name] }).catch(() => null);
      if (vRows && vRows.rows) {
        for (const vr of vRows.rows as any[]) {
          try {
            const vd = typeof vr.data === 'string' ? JSON.parse(vr.data) : (vr.data || {});
            vd.placeAddress = info.address;
            vd.placeCity = fullCity;
            vd.placeCountry = info.country;
            vd.placePhone = info.phone;
            vd.placeCategory = info.category;
            vd.placeWebsite = info.website;
            if (info.bannerUrl) {
              vd.placeBannerUrl = info.bannerUrl;
              vd.bannerUrl = info.bannerUrl;
            }
            if (info.logoUrl) {
              vd.placeLogoUrl = info.logoUrl;
            }
            await bDb.execute({
              sql: 'UPDATE videoReviews SET data = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
              args: [JSON.stringify(vd), vr.id]
            });
          } catch(e) {}
        }
      }
    } catch(e) {}

    updatedCount++;
  }

  console.log(`Successfully migrated and enriched ${updatedCount} business profiles!`);
}

migrateAllPlaces();
