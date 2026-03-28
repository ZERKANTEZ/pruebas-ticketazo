/**
 * data.js
 * Datos estáticos de la aplicación Ticketazo.
 * En producción estos vendrían de una API REST.
 */

const CATEGORIES = [
  'Todos', 'Conciertos', 'Música Electrónica', 'Música en Vivo',
  'Festivales', 'Teatro', 'Musicales', 'Comedia',
  'Deportes', 'Arte y Cultura', 'Conferencias', 'Familiar',
];

const ARTISTS = [
  {
    id: 'a1',
    name: 'Bad Bunny',
    genre: 'Reggaeton / Trap Latino',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
    bio: 'El conejo malo más famoso del mundo. Sus giras agotan estadios en minutos.',
    isOnTour: true,
  },
  {
    id: 'a2',
    name: 'The Midnight',
    genre: 'Synthwave / Dreampop',
    image: 'https://images.unsplash.com/photo-1607313029691-fa108ddf807d?w=800&q=80',
    bio: 'Dúo americano de synthwave con sonido retrofuturista de los 80s.',
    isOnTour: true,
  },
  {
    id: 'a3',
    name: 'DJs Varios',
    genre: 'Música Electrónica',
    image: 'https://images.unsplash.com/photo-1762537132884-cc6bbde0667a?w=800&q=80',
    bio: 'Lineup internacional de los mejores DJs del circuito underground.',
    isOnTour: false,
  },
  {
    id: 'a4',
    name: 'Compañía Teatral Elite',
    genre: 'Teatro / Musicales',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80',
    bio: 'La compañía teatral más reconocida de México con 20 años de trayectoria.',
    isOnTour: true,
  },
];

const EVENTS = [
  {
    id: 'e1', artistId: 'a1',
    title: 'Bad Bunny — Most Wanted Tour', artist: 'Bad Bunny',
    date: '2026-05-10', city: 'Ciudad de México', venue: 'Foro Sol',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
    category: 'Conciertos', recommended: true, bestSeller: true, adultsOnly: false,
    prices: { vip: 3500, oro: 2000, plata: 1200 }, status: 'active',
    tourName: 'Most Wanted Tour 2026',
    about: 'Bad Bunny llega a México con su espectacular Most Wanted Tour. Un show de producción mundial con más de 2 horas de música, efectos visuales únicos y los éxitos que lo convirtieron en el artista más escuchado del planeta.',
    reviews: [
      { user: 'Carlos M.', rating: 5, comment: 'El mejor concierto de mi vida. Bad Bunny lo dio todo.', date: '2025-06-10' },
      { user: 'Sofía R.',   rating: 5, comment: 'Increíble producción, valió cada peso.',             date: '2025-06-11' },
    ],
  },
  {
    id: 'e1b', artistId: 'a1',
    title: 'Bad Bunny — Most Wanted Tour', artist: 'Bad Bunny',
    date: '2026-05-13', city: 'Guadalajara', venue: 'Estadio Akron',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
    category: 'Conciertos', recommended: true, bestSeller: true, adultsOnly: false,
    prices: { vip: 3200, oro: 1800, plata: 1000 }, status: 'active',
    tourName: 'Most Wanted Tour 2026',
    about: 'La segunda parada de Bad Bunny en México. El Estadio Akron recibirá al conejo malo con el show completo del Most Wanted Tour.',
    reviews: [],
  },
  {
    id: 'e1c', artistId: 'a1',
    title: 'Bad Bunny — Most Wanted Tour', artist: 'Bad Bunny',
    date: '2026-05-16', city: 'Monterrey', venue: 'Estadio BBVA',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
    category: 'Conciertos', recommended: false, bestSeller: true, adultsOnly: false,
    prices: { vip: 3200, oro: 1800, plata: 1000 }, status: 'active',
    tourName: 'Most Wanted Tour 2026',
    about: 'Monterrey cierra la gira mexicana de Bad Bunny en el imponente Estadio BBVA.',
    reviews: [],
  },
  {
    id: 'e2', artistId: 'a2',
    title: 'Synthwave Dreams', artist: 'The Midnight',
    date: '2026-06-20', city: 'Guadalajara', venue: 'Teatro Diana',
    image: 'https://images.unsplash.com/photo-1607313029691-fa108ddf807d?w=800&q=80',
    category: 'Música en Vivo', recommended: true, bestSeller: false, adultsOnly: false,
    prices: { vip: 2000, oro: 1200, plata: 800 }, status: 'active',
    tourName: 'Synthwave Dreams Tour',
    about: 'The Midnight trae su icónico sonido retrofuturista a México por primera vez.',
    reviews: [
      { user: 'Ana L.',   rating: 5, comment: 'The Midnight en vivo es una experiencia que no tiene igual.', date: '2025-07-05' },
      { user: 'Marco P.', rating: 5, comment: 'Sonido increíble, producción muy cuidada.',               date: '2025-07-06' },
    ],
  },
  {
    id: 'e2b', artistId: 'a2',
    title: 'Synthwave Dreams', artist: 'The Midnight',
    date: '2026-06-22', city: 'Ciudad de México', venue: 'Pepsi Center WTC',
    image: 'https://images.unsplash.com/photo-1607313029691-fa108ddf807d?w=800&q=80',
    category: 'Música en Vivo', recommended: true, bestSeller: false, adultsOnly: false,
    prices: { vip: 2200, oro: 1400, plata: 900 }, status: 'active',
    tourName: 'Synthwave Dreams Tour',
    about: 'La segunda parada de The Midnight en México.',
    reviews: [],
  },
  {
    id: 'e3', artistId: 'a3',
    title: 'Neon Nights Festival', artist: 'DJs Varios',
    date: '2026-07-05', city: 'Ciudad de México', venue: 'Parque Bicentenario',
    image: 'https://images.unsplash.com/photo-1762537132884-cc6bbde0667a?w=800&q=80',
    category: 'Música Electrónica', recommended: false, bestSeller: true, adultsOnly: true,
    prices: { vip: 800, oro: 500, plata: 300 }, status: 'active',
    tourName: null,
    about: 'El festival de música electrónica más esperado del año. 12 horas de música non-stop con los mejores DJs del circuito internacional.',
    reviews: [
      { user: 'Lupita G.',  rating: 4, comment: 'Increíble ambiente, lo mejor del año.', date: '2025-05-20' },
      { user: 'Roberto S.', rating: 5, comment: 'Producción de primer nivel.',           date: '2025-05-21' },
    ],
  },
  {
    id: 'e4', artistId: 'a4',
    title: 'El Fantasma de la Ópera', artist: 'Compañía Teatral Elite',
    date: '2026-07-10', city: 'Ciudad de México', venue: 'Palacio de Bellas Artes',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80',
    category: 'Musicales', recommended: true, bestSeller: true, adultsOnly: false,
    prices: { vip: 2500, oro: 1500, plata: 900 }, status: 'active',
    tourName: 'Gira Nacional 2026',
    about: 'La producción más aclamada regresa al Palacio de Bellas Artes con elenco renovado y efectos especiales de última generación.',
    reviews: [
      { user: 'Patricia H.', rating: 5, comment: 'Una obra majestuosa.',              date: '2025-08-15' },
      { user: 'Fernando T.', rating: 5, comment: 'La escenografía es impresionante.', date: '2025-08-16' },
    ],
  },
  {
    id: 'e4b', artistId: 'a4',
    title: 'El Fantasma de la Ópera', artist: 'Compañía Teatral Elite',
    date: '2026-07-18', city: 'Guadalajara', venue: 'Teatro Degollado',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80',
    category: 'Musicales', recommended: true, bestSeller: false, adultsOnly: false,
    prices: { vip: 2200, oro: 1300, plata: 800 }, status: 'active',
    tourName: 'Gira Nacional 2026',
    about: 'El Fantasma de la Ópera llega al histórico Teatro Degollado de Guadalajara.',
    reviews: [],
  },
  {
    id: 'e5', artistId: 'a3',
    title: 'Clásico de Leyendas', artist: 'Equipos All-Star',
    date: '2026-08-12', city: 'Guadalajara', venue: 'Estadio Akron',
    image: 'https://images.unsplash.com/photo-1565483276060-e6730c0cc6a1?w=800&q=80',
    category: 'Deportes', recommended: false, bestSeller: false, adultsOnly: false,
    prices: { vip: 3000, oro: 1800, plata: 1000 }, status: 'expired',
    tourName: null,
    about: 'Un partido histórico que reunirá a las leyendas más grandes del fútbol mexicano.',
    reviews: [
      { user: 'Jorge N.', rating: 5, comment: 'Ver a mis ídolos juntos fue un sueño.', date: '2025-09-05' },
    ],
  },
];

const HERO_SLIDES = [
  { title: 'Vive la Música al Máximo',  sub: 'Consigue tus boletos para los mejores festivales del año.', eventId: 'e1',  cta: 'Ver Bad Bunny Tour' },
  { title: 'El Arte en su Esplendor',   sub: 'Descubre musicales y obras de teatro exclusivas.',          eventId: 'e4',  cta: 'Ver El Fantasma'   },
  { title: 'Synthwave Dreams Tour',     sub: 'The Midnight llega a México por primera vez.',              eventId: 'e2',  cta: 'Ver The Midnight'  },
];

const CITIES = [...new Set(EVENTS.map(e => e.city))].sort();
