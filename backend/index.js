const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  database: 'postgres',
  password: '1234',
  port: 5432,
  options: '-c search_path=oriontour'
});

app.get('/', (req, res) => {
  res.send('OrionTour Globe API is running');
});

app.get('/api/globe/markers', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        name_ru,
        name_en,
        iso_code,
        lat,
        lng,
        flag_url,
        is_popular,
        popularity_score,
        hotels_count,
        offers_count
      FROM globe_markers
      ORDER BY popularity_score DESC, name_en ASC;
    `);

    res.json(rows);
  } catch (error) {
    console.error('Ошибка при получении маркеров:', error);
    res.status(500).json({ message: 'Ошибка при получении маркеров' });
  }
});

app.get('/api/globe/country/:id/tours', async (req, res) => {
  const countryId = Number(req.params.id);

  if (!Number.isFinite(countryId)) {
    return res.status(400).json({ message: 'Некорректный id страны' });
  }

  try {
    const { rows } = await pool.query(`
      SELECT
        t.id,
        t.title,
        t.short_desc,
        t.image_url,
        t.is_hot,

        COALESCE(MIN(o.price), 0) AS price_from,
        COALESCE(AVG(hl.rating_avg), 0)::numeric(3,1) AS rating_avg,
        COUNT(o.id) AS offers_count

      FROM tour t
      LEFT JOIN tour_offer o
        ON o.tour_id = t.id
       AND o.is_available = TRUE
      LEFT JOIN hotel_listing hl
        ON hl.hotel_id = o.hotel_id

      WHERE t.country_id = $1
      GROUP BY t.id
      ORDER BY t.is_hot DESC, rating_avg DESC NULLS LAST, price_from ASC;
    `, [countryId]);

    res.json(rows);
  } catch (error) {
    console.error('Ошибка при получении туров для страны:', error);
    res.status(500).json({ message: 'Ошибка при получении туров для страны' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
