const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Раздаем статические файлы
app.use(express.static('public'));
app.use(express.json());

// Маршрут для получения хода от Stockfish
app.post('/api/move', (req, res) => {
    const { fen, level } = req.body;
    
    // Путь к Stockfish
    const stockfishPath = path.join(__dirname, 'stockfish', 'stockfish');
    
    const stockfish = spawn(stockfishPath);
    
    let output = '';
    
    // Настраиваем Stockfish
    stockfish.stdin.write('uci\n');
    stockfish.stdin.write(`setoption name Skill Level value ${level || 20}\n`);
    stockfish.stdin.write(`position fen ${fen}\n`);
    stockfish.stdin.write(`go depth 10\n`);
    
    stockfish.stdout.on('data', (data) => {
        output += data.toString();
        
        // Ищем лучший ход
        if (data.toString().includes('bestmove')) {
            const match = data.toString().match(/bestmove (\S+)/);
            if (match) {
                stockfish.kill();
                res.json({ 
                    move: match[1],
                    analysis: output
                });
            }
        }
    });
    
    stockfish.stderr.on('data', (data) => {
        console.error('Stockfish error:', data.toString());
    });
    
    // Таймаут на случай ошибки
    setTimeout(() => {
        if (!res.headersSent) {
            stockfish.kill();
            res.status(500).json({ error: 'Stockfish timeout' });
        }
    }, 5000);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
