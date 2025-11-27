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
        const result = await pool.query(`
      SELECT 
        c.id,
        c.name_ru,
        c.name_en,
        c.iso_code,
        c.lat,
        c.lng,
        c.flag_url,
        c.is_popular,
        c.popularity_score,
        COALESCE(COUNT(t.id), 0) AS tours_count
      FROM country c
      LEFT JOIN tour t ON t.country_id = c.id
      GROUP BY 
        c.id,
        c.name_ru,
        c.name_en,
        c.iso_code,
        c.lat,
        c.lng,
        c.flag_url,
        c.is_popular,
        c.popularity_score
      ORDER BY c.popularity_score DESC, c.name_en ASC;
    `);

        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении маркеров:', error);
        res.status(500).json({ message: 'Ошибка при получении маркеров' });
    }
});

app.get('/api/globe/country/:id/tours', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `
      SELECT 
        id,
        title,
        short_desc,
        price_from,
        rating,
        is_hot,
        image_url
      FROM tour
      WHERE country_id = $1
      ORDER BY is_hot DESC, rating DESC NULLS LAST;
      `,
            [id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении туров для страны:', error);
        res.status(500).json({ message: 'Ошибка при получении туров для страны' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
