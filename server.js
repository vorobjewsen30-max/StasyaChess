const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Статические файлы
app.use(express.static('public'));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API для Stockfish (если нужно)
app.get('/api/stockfish', (req, res) => {
    res.json({ 
        status: 'ok',
        version: '16',
        message: 'Stockfish WebAssembly загружен'
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Откройте http://localhost:${PORT}`);
});
