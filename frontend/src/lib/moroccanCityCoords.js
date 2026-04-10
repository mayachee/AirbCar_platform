/**
 * Static lat/lng coordinates for Moroccan cities.
 * Keys are lowercase for case-insensitive lookup.
 * Covers all cities in the MOROCCAN_CITIES constant plus common API spelling variants.
 */
export const MOROCCAN_CITY_COORDS = {
  'agadir':          { lat: 30.4278,  lng: -9.5981  },
  'al hoceima':      { lat: 35.2517,  lng: -3.9372  },
  'al-hoceima':      { lat: 35.2517,  lng: -3.9372  },
  'alhucemas':       { lat: 35.2517,  lng: -3.9372  },
  'azemmour':        { lat: 33.2876,  lng: -8.3416  },
  'azrou':           { lat: 33.4338,  lng: -5.2219  },
  'beni mellal':     { lat: 32.3372,  lng: -6.3498  },
  'beni-mellal':     { lat: 32.3372,  lng: -6.3498  },
  'berkane':         { lat: 34.9220,  lng: -2.3197  },
  'berrechid':       { lat: 33.2655,  lng: -7.5874  },
  'boujdour':        { lat: 26.1256,  lng: -14.4853 },
  'casablanca':      { lat: 33.5731,  lng: -7.5898  },
  'chefchaouen':     { lat: 35.1688,  lng: -5.2636  },
  'chaouen':         { lat: 35.1688,  lng: -5.2636  },
  'dakhla':          { lat: 23.7136,  lng: -15.9355 },
  'el jadida':       { lat: 33.2549,  lng: -8.5064  },
  'el-jadida':       { lat: 33.2549,  lng: -8.5064  },
  'errachidia':      { lat: 31.9314,  lng: -4.4248  },
  'essaouira':       { lat: 31.5085,  lng: -9.7595  },
  'fes':             { lat: 34.0181,  lng: -5.0078  },
  'fez':             { lat: 34.0181,  lng: -5.0078  },
  'fès':             { lat: 34.0181,  lng: -5.0078  },
  'figuig':          { lat: 32.1063,  lng: -1.2293  },
  'guelmim':         { lat: 28.9870,  lng: -10.0574 },
  'ifrane':          { lat: 33.5228,  lng: -5.1107  },
  'imzouren':        { lat: 35.1450,  lng: -3.8464  },
  'kenitra':         { lat: 34.2610,  lng: -6.5802  },
  'kénitra':         { lat: 34.2610,  lng: -6.5802  },
  'khemisset':       { lat: 33.8239,  lng: -6.0657  },
  'khenifra':        { lat: 32.9342,  lng: -5.6670  },
  'khouribga':       { lat: 32.8814,  lng: -6.9063  },
  'laayoune':        { lat: 27.1536,  lng: -13.2033 },
  'laâyoune':        { lat: 27.1536,  lng: -13.2033 },
  'larache':         { lat: 35.1932,  lng: -6.1560  },
  'marrakech':       { lat: 31.6295,  lng: -7.9811  },
  'marrakesh':       { lat: 31.6295,  lng: -7.9811  },
  'meknes':          { lat: 33.8935,  lng: -5.5473  },
  'meknès':          { lat: 33.8935,  lng: -5.5473  },
  'mohammedia':      { lat: 33.6866,  lng: -7.3830  },
  'nador':           { lat: 35.1680,  lng: -2.9335  },
  'ouarzazate':      { lat: 30.9189,  lng: -6.8936  },
  'oujda':           { lat: 34.6814,  lng: -1.9086  },
  'rabat':           { lat: 33.9716,  lng: -6.8498  },
  'safi':            { lat: 32.2994,  lng: -9.2372  },
  'sale':            { lat: 34.0366,  lng: -6.8013  },
  'salé':            { lat: 34.0366,  lng: -6.8013  },
  'sefrou':          { lat: 33.8306,  lng: -4.8327  },
  'settat':          { lat: 32.9928,  lng: -7.6211  },
  'sidi ifni':       { lat: 29.3796,  lng: -10.1728 },
  'sidi kacem':      { lat: 34.2234,  lng: -5.7127  },
  'tangier':         { lat: 35.7595,  lng: -5.8340  },
  'tanger':          { lat: 35.7595,  lng: -5.8340  },
  'taroudant':       { lat: 30.4702,  lng: -8.8749  },
  'taroudannte':     { lat: 30.4702,  lng: -8.8749  },
  'taza':            { lat: 34.2138,  lng: -3.9968  },
  'tetouan':         { lat: 35.5785,  lng: -5.3684  },
  'tétouan':         { lat: 35.5785,  lng: -5.3684  },
  'tiznit':          { lat: 29.6974,  lng: -9.7316  },
  'zagora':          { lat: 30.3316,  lng: -5.8379  },
};

/**
 * Look up coordinates for a city name (case-insensitive, trims whitespace).
 * Returns null if the city is not in the lookup table.
 * @param {string} cityName
 * @returns {{ lat: number, lng: number } | null}
 */
export function getCityCoords(cityName) {
  if (!cityName || typeof cityName !== 'string') return null;
  return MOROCCAN_CITY_COORDS[cityName.toLowerCase().trim()] ?? null;
}
