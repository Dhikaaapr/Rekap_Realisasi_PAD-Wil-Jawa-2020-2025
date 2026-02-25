const express = require('express');
const cors = require('cors');
const padRoutes = require('./routes/padRoutes');
const pajakRoutes = require('./routes/pajakRoutes');
const retribusiRoutes = require('./routes/retribusiRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/pad', padRoutes);
app.use('/api/pajak', pajakRoutes);
app.use('/api/retribusi', retribusiRoutes);

app.get('/', (req, res) => {
  res.send('Rekap PAD Backend API is running');
});

module.exports = app;
