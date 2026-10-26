const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');
const User = require('../models/User');

const movies = [
  {
    title: 'Deadpool & Wolverine',
    description: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary Deadpool behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit up again with an even more reluctant Wolverine.',
    genre: ['Action', 'Comedy', 'Sci-Fi'],
    language: 'English', duration: 128, rating: 8.9,
    director: 'Shawn Levy',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Matthew Macfadyen'],
    posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&q=80',
    trailerUrl: 'https://www.youtube.com/embed/73_1biulkYk',
    releaseDate: new Date('2024-07-26'), isActive: true, featured: true
  },
  {
    title: 'Gladiator II',
    description: 'Years after witnessing the death of revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome with an iron fist. With rage in his heart and the future of the Empire at stake.',
    genre: ['Action', 'Adventure', 'Drama'],
    language: 'English', duration: 148, rating: 8.7,
    director: 'Ridley Scott',
    cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington', 'Connie Nielsen'],
    posterUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&q=80',
    trailerUrl: 'https://www.youtube.com/embed/4rgYUipGJNo',
    releaseDate: new Date('2024-11-22'), isActive: true, featured: true
  },
  {
    title: 'Spider-Man: Across the Spider-Verse',
    description: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.',
    genre: ['Animation', 'Action', 'Adventure'],
    language: 'English', duration: 140, rating: 9.1,
    director: 'Joaquim Dos Santos',
    cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac', 'Daniel Kaluuya'],
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=500&q=80',
    trailerUrl: 'https://www.youtube.com/embed/cqGjhVJWtEg',
    releaseDate: new Date('2023-06-02'), isActive: true, featured: true
  },
  {
    title: 'Dune: Part Two',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he must prevent a terrible future only he can foresee.',
    genre: ['Sci-Fi', 'Adventure', 'Drama'],
    language: 'English', duration: 166, rating: 8.8,
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Josh Brolin'],
    posterUrl: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=500&q=80',
    trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
    releaseDate: new Date('2024-03-01'), isActive: true, featured: true
  },
  {
    title: 'Oppenheimer',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II. A cinematic masterpiece of tension, moral weight, and IMAX 70mm visual brilliance.',
    genre: ['Drama', 'History', 'Thriller'],
    language: 'English', duration: 180, rating: 9.0,
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80',
    trailerUrl: 'https://www.youtube.com/embed/uYPbbksJxIg',
    releaseDate: new Date('2023-07-21'), isActive: true, featured: true
  },
  {
    title: 'The Batman',
    description: "When the Riddler, a sadistic serial killer, begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and confront his own dark family past.",
    genre: ['Action', 'Crime', 'Drama'],
    language: 'English', duration: 176, rating: 8.2,
    director: 'Matt Reeves',
    cast: ['Robert Pattinson', 'Zoë Kravitz', 'Jeffrey Wright', 'Colin Farrell'],
    posterUrl: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=500&q=80',
    trailerUrl: 'https://www.youtube.com/embed/mqqft2x_Aa4',
    releaseDate: new Date('2022-03-04'), isActive: true, featured: false
  },
  {
    title: 'Interstellar',
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival. An epic journey through time and space that challenges our understanding of physics, love, and gravity.",
    genre: ['Sci-Fi', 'Drama', 'Adventure'],
    language: 'English', duration: 169, rating: 9.2,
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    posterUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80',
    trailerUrl: 'https://www.youtube.com/embed/zSWdZVtXT7E',
    releaseDate: new Date('2014-11-07'), isActive: true, featured: true
  },
  {
    title: 'Avatar: The Way of Water',
    description: "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. When a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the Na'vi army.",
    genre: ['Action', 'Adventure', 'Fantasy'],
    language: 'English', duration: 192, rating: 7.8,
    director: 'James Cameron',
    cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver', 'Kate Winslet'],
    posterUrl: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=500&q=80',
    trailerUrl: 'https://www.youtube.com/embed/d9MyW72ELq0',
    releaseDate: new Date('2022-12-16'), isActive: true, featured: false
  },
  {
    title: 'Inception',
    description: 'Dom Cobb is a skilled thief, the absolute best in the dangerous art of extraction, stealing valuable secrets from deep within the subconscious during the dream state. Given a chance at redemption, he must pull off the reverse: inception.',
    genre: ['Action', 'Sci-Fi', 'Thriller'],
    language: 'English', duration: 148, rating: 9.0,
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy'],
    posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&q=80',
    trailerUrl: 'https://www.youtube.com/embed/YoHD9XEInc0',
    releaseDate: new Date('2010-07-16'), isActive: true, featured: false
  },
  {
    title: 'Joker: Folie à Deux',
    description: 'Failed comedian Arthur Fleck meets the love of his life, Harley Quinn, while incarcerated at Arkham State Hospital. Upon his release, the two embark on a doomed, musical romantic misadventure through the corrupt streets of Gotham City.',
    genre: ['Crime', 'Drama', 'Thriller'],
    language: 'English', duration: 138, rating: 8.4,
    director: 'Todd Phillips',
    cast: ['Joaquin Phoenix', 'Lady Gaga', 'Brendan Gleeson', 'Catherine Keener'],
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80',
    trailerUrl: 'https://www.youtube.com/embed/_OKAwz2NiJs',
    releaseDate: new Date('2024-10-04'), isActive: true, featured: false
  },
  {
    title: 'Top Gun: Maverick',
    description: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN’s elite graduates on an impossible mission demanding the ultimate sacrifice.',
    genre: ['Action', 'Drama'],
    language: 'English', duration: 130, rating: 8.6,
    director: 'Joseph Kosinski',
    cast: ['Tom Cruise', 'Miles Teller', 'Jennifer Connelly', 'Jon Hamm'],
    posterUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4ea16e6f4?w=500&q=80',
    trailerUrl: 'https://www.youtube.com/embed/giXco2jaZ_4',
    releaseDate: new Date('2022-05-27'), isActive: true, featured: false
  },
  {
    title: 'Guardians of the Galaxy Vol. 3',
    description: 'Still reeling from the loss of Gamora, Peter Quill rallies his team on a mission to protect Rocket. A mission that could quite possibly spell the end of the Guardians if not completed successfully.',
    genre: ['Action', 'Adventure', 'Comedy'],
    language: 'English', duration: 150, rating: 7.9,
    director: 'James Gunn',
    cast: ['Chris Pratt', 'Zoe Saldana', 'Bradley Cooper', 'Vin Diesel'],
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&q=80',
    trailerUrl: 'https://www.youtube.com/embed/u3V5KDHRQvk',
    releaseDate: new Date('2023-05-05'), isActive: true, featured: false
  }
];

const generateShowtimes = (movieIds) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  const slots = [['10:00', '12:30'], ['13:30', '16:00'], ['16:30', '19:00'], ['19:30', '22:00'], ['22:30', '01:00']];
  const halls = ['Audi 1 (IMAX 3D)', 'Audi 2 (Dolby Atmos)', 'Audi 3 (4DX)', 'Audi 4 (Prime Luxe)'];
  const showtimes = [];

  movieIds.forEach((movieId, mi) => {
    dates.forEach(date => {
      slots.slice(0, 4).forEach(([start, end], ti) => {
        showtimes.push({
          movie: movieId, hall: halls[ti % halls.length],
          date, startTime: start, endTime: end, totalSeats: 60,
          bookedSeats: [], lockedSeats: [],
          price: { standard: 150 + mi * 20, premium: 250 + mi * 30, vip: 400 + mi * 50 }
        });
      });
    });
  });
  return showtimes;
};

const seedData = async (force = false) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const count = await Movie.countDocuments();
    if (count < movies.length || force) {
      await Movie.deleteMany({});
      await Showtime.deleteMany({});
      await User.deleteMany({});

      const createdMovies = await Movie.insertMany(movies);
      console.log(`✅ Seeded ${createdMovies.length} blockbuster movies`);

      const movieIds = createdMovies.map(m => m._id);
      const showtimes = generateShowtimes(movieIds);
      await Showtime.insertMany(showtimes);
      console.log(`✅ Seeded ${showtimes.length} scheduled showtimes across all halls`);

      await User.create({ name: 'Admin Cinephile', email: 'admin@imovies.com', password: 'admin123', role: 'admin' });
      await User.create({ name: 'Demo User', email: 'demo@imovies.com', password: 'demo123', role: 'user' });
      await User.create({ name: 'Guest Cinephile', email: 'guest@imovies.com', password: 'guestpassword123', role: 'user' });
      console.log('✅ Created demo accounts: admin@imovies.com / admin123 | demo@imovies.com / demo123');

      // Write physical JSON files so user can see real backend records
      fs.writeFileSync(path.join(dataDir, 'movies.json'), JSON.stringify(createdMovies, null, 2));
      fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify([
        { email: 'admin@imovies.com', role: 'admin', name: 'Admin Cinephile' },
        { email: 'demo@imovies.com', role: 'user', name: 'Demo User' },
        { email: 'guest@imovies.com', role: 'user', name: 'Guest Cinephile' }
      ], null, 2));
      console.log('📁 Synced database records to physical disk: Service now/data/');
    } else {
      console.log(`📀 Database already seeded with ${count} movies`);
    }

    console.log('🎬 Database ready and operational!\n');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  }
};

module.exports = { seedData };
