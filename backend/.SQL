set search_path to oriontour;

CREATE TABLE country (
    id               SERIAL PRIMARY KEY,
    name_ru          TEXT NOT NULL,
    name_en          TEXT NOT NULL,
    iso_code         CHAR(2) NOT NULL UNIQUE,
    lat              DOUBLE PRECISION NOT NULL,
    lng              DOUBLE PRECISION NOT NULL,
    flag_url         TEXT,
    is_popular       BOOLEAN DEFAULT FALSE,
    popularity_score INTEGER DEFAULT 0
);



CREATE table tour (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    short_desc  TEXT,
    country_id  INTEGER NOT NULL REFERENCES country(id) ON DELETE CASCADE,
    price_from  NUMERIC(10,2),
    rating      NUMERIC(2,1),
    is_hot      BOOLEAN DEFAULT FALSE,
    image_url   TEXT
);



CREATE VIEW globe_markers AS
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
    c.popularity_score;



INSERT INTO country (name_ru, name_en, iso_code, lat, lng, flag_url, is_popular, popularity_score)
VALUES
    ('Турция',      'Turkey',        'TR', 38.9637,  35.2433, 'https://flagcdn.com/w80/tr.png', TRUE, 100),
    ('Египет',      'Egypt',        'EG', 26.8206,  30.8025, 'https://flagcdn.com/w80/eg.png', TRUE, 90),
    ('Греция',      'Greece',       'GR', 39.0742,  21.8243, 'https://flagcdn.com/w80/gr.png', TRUE, 80),
    ('Италия',      'Italy',        'IT', 41.8719,  12.5674, 'https://flagcdn.com/w80/it.png', TRUE, 85),
    ('Испания',     'Spain',        'ES', 40.4637,  -3.7492, 'https://flagcdn.com/w80/es.png', TRUE, 75),
    ('ОАЭ',         'United Arab Emirates', 'AE', 23.4241, 53.8478, 'https://flagcdn.com/w80/ae.png', TRUE, 70),
    ('Таиланд',     'Thailand',     'TH', 15.8700, 100.9925, 'https://flagcdn.com/w80/th.png', TRUE, 65),
    ('Россия',      'Russia',       'RU', 61.5240, 105.3188, 'https://flagcdn.com/w80/ru.png', FALSE, 50)
ON CONFLICT (iso_code) DO NOTHING;



INSERT INTO tour (title, short_desc, country_id, price_from, rating, is_hot, image_url)
VALUES
(
    'Анталия All Inclusive 7 ночей',
    'Пляжный отдых в Анталии: отель 4*, питание "всё включено", перелёт, трансфер.',
    (SELECT id FROM country WHERE iso_code = 'TR'),
    65000.00,
    4.6,
    TRUE,
    'https://example.com/images/antalya1.jpg'
),
(
    'Стамбул: уикенд в двух частях света',
    '3 ночи в Стамбуле, экскурсии по европейской и азиатской части города.',
    (SELECT id FROM country WHERE iso_code = 'TR'),
    55000.00,
    4.8,
    FALSE,
    'https://example.com/images/istanbul_weekend.jpg'
);



INSERT INTO tour (title, short_desc, country_id, price_from, rating, is_hot, image_url)
VALUES
(
    'Хургада: Красное море и кораллы',
    '7 ночей в Хургаде, отель 4*, первая линия, снорклинг и дайвинг.',
    (SELECT id FROM country WHERE iso_code = 'EG'),
    72000.00,
    4.7,
    TRUE,
    'https://example.com/images/hurghada1.jpg'
),
(
    'Шарм-эль-Шейх: отдых для двоих',
    'Романтический отдых, отель 5*, SPA-процедуры и ужины при свечах.',
    (SELECT id FROM country WHERE iso_code = 'EG'),
    89000.00,
    4.9,
    FALSE,
    'https://example.com/images/sharm_couple.jpg'
);



INSERT INTO tour (title, short_desc, country_id, price_from, rating, is_hot, image_url)
VALUES
(
    'Афины + острова Саронического залива',
    'Исторические Афины и круиз по греческим островам Эгина, Порос, Гидра.',
    (SELECT id FROM country WHERE iso_code = 'GR'),
    95000.00,
    4.8,
    FALSE,
    'https://example.com/images/athens_islands.jpg'
),
(
    'Крит: семейный отдых',
    '7 ночей на Крите, отель с анимацией для детей и песчаным пляжем.',
    (SELECT id FROM country WHERE iso_code = 'GR'),
    88000.00,
    4.5,
    TRUE,
    'https://example.com/images/crete_family.jpg'
);



INSERT INTO tour (title, short_desc, country_id, price_from, rating, is_hot, image_url)
VALUES
(
    'Рим + Ватикан: классика Италии',
    'Экскурсионный тур по Риму, Колизей, Ватикан, вкуснейшая итальянская кухня.',
    (SELECT id FROM country WHERE iso_code = 'IT'),
    105000.00,
    4.9,
    FALSE,
    'https://example.com/images/rome_vatican.jpg'
),
(
    'Венеция и романтика каналов',
    '3 ночи в Венеции, прогулка на гондоле, дегустация местных вин.',
    (SELECT id FROM country WHERE iso_code = 'IT'),
    110000.00,
    4.7,
    TRUE,
    'https://example.com/images/venice_romantic.jpg'
);



INSERT INTO tour (title, short_desc, country_id, price_from, rating, is_hot, image_url)
VALUES
(
    'Барселона: Гауди и море',
    '5 дней в Барселоне, Саграда Фамилия, парк Гуэля и пляжи Коста-Бравы.',
    (SELECT id FROM country WHERE iso_code = 'ES'),
    99000.00,
    4.8,
    TRUE,
    'https://example.com/images/barcelona_gaudi.jpg'
),
(
    'Мадрид: искусство и гастрономия',
    'Музеи Прадо и Рейна София, тапас-бары и аутентичные районы Мадрида.',
    (SELECT id FROM country WHERE iso_code = 'ES'),
    97000.00,
    4.6,
    FALSE,
    'https://example.com/images/madrid_food.jpg'
);



INSERT INTO tour (title, short_desc, country_id, price_from, rating, is_hot, image_url)
VALUES
(
    'Дубай: небоскрёбы и шопинг',
    '5 ночей в Дубае,Бурдж-Халифа, сафар по пустыне и шопинг в Dubai Mall.',
    (SELECT id FROM country WHERE iso_code = 'AE'),
    115000.00,
    4.9,
    TRUE,
    'https://example.com/images/dubai_skyline.jpg'
),
(
    'Абу-Даби: восточная роскошь',
    'Посещение мечети шейха Зайда, отдых на побережье Персидского залива.',
    (SELECT id FROM country WHERE iso_code = 'AE'),
    108000.00,
    4.7,
    FALSE,
    'https://example.com/images/abudhabi_luxury.jpg'
);



INSERT INTO tour (title, short_desc, country_id, price_from, rating, is_hot, image_url)
VALUES
(
    'Пхукет: тропический рай',
    '7 ночей на Пхукете, лазурное море, экскурсии по островам Пхи-Пхи.',
    (SELECT id FROM country WHERE iso_code = 'TH'),
    98000.00,
    4.8,
    TRUE,
    'https://example.com/images/phuket_islands.jpg'
),
(
    'Бангкок + пляжи Паттайи',
    'Контрастный тур: мегаполис Бангкок и пляжный отдых в Паттайе.',
    (SELECT id FROM country WHERE iso_code = 'TH'),
    93000.00,
    4.5,
    FALSE,
    'https://example.com/images/bangkok_pattaya.jpg'
);



INSERT INTO tour (title, short_desc, country_id, price_from, rating, is_hot, image_url)
VALUES
(
    'Сочи: отдых на Чёрном море',
    '7 ночей в Сочи, набережная, Красная Поляна, экскурсии в горы.',
    (SELECT id FROM country WHERE iso_code = 'RU'),
    65000.00,
    4.4,
    FALSE,
    'https://example.com/images/sochi_sea.jpg'
),
(
    'Санкт-Петербург: белые ночи',
    'Экскурсионный тур: Эрмитаж, Невский проспект, развод мостов.',
    (SELECT id FROM country WHERE iso_code = 'RU'),
    70000.00,
    4.9,
    TRUE,
    'https://example.com/images/spb_white_nights.jpg'
);

