const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Раздаем статические файлы
app.use(express.static('public'));
app.use(express.json());

// Проверяем наличие Stockfish
const stockfishPath = path.join(__dirname, 'stockfish', 'stockfish');

if (!fs.existsSync(stockfishPath)) {
    console.error('Stockfish binary not found at:', stockfishPath);
    console.log('Please make sure stockfish binary is in the stockfish/ folder');
    console.log('Make it executable: chmod +x stockfish/stockfish');
}

// Маршрут для получения хода от Stockfish
app.post('/api/move', (req, res) => {
    const { fen, level = 10 } = req.body;
    
    if (!fen) {
        return res.status(400).json({ error: 'FEN required' });
    }
    
    // Проверяем доступность Stockfish
    if (!fs.existsSync(stockfishPath)) {
        console.log('Using fallback random engine');
        return res.json(getRandomMove(fen));
    }
    
    const stockfish = spawn(stockfishPath);
    
    let output = '';
    let bestMove = null;
    let evaluation = null;
    
    // Настраиваем таймаут
    const timeout = setTimeout(() => {
        stockfish.kill();
        if (!res.headersSent) {
            res.json(getRandomMove(fen));
        }
    }, 10000);
    
    stockfish.stdout.on('data', (data) => {
        output += data.toString();
        const lines = output.split('\n');
        
        // Ищем лучший ход
        for (const line of lines) {
            if (line.startsWith('bestmove')) {
                const match = line.match(/bestmove (\S+)/);
                if (match && match[1] !== '(none)') {
                    bestMove = match[1];
                }
            }
            
            // Ищем оценку
            if (line.includes('score cp')) {
                const cpMatch = line.match(/score cp (-?\d+)/);
                if (cpMatch) {
                    evaluation = parseInt(cpMatch[1]) / 100;
                }
            } else if (line.includes('score mate')) {
                const mateMatch = line.match(/score mate (-?\d+)/);
                if (mateMatch) {
                    const mateIn = parseInt(mateMatch[1]);
                    evaluation = mateIn > 0 ? 1000 : -1000;
                }
            }
        }
        
        if (bestMove) {
            clearTimeout(timeout);
            stockfish.kill();
            res.json({ 
                move: bestMove,
                evaluation: evaluation,
                analysis: output
            });
        }
    });
    
    stockfish.stderr.on('data', (data) => {
        console.error('Stockfish error:', data.toString());
    });
    
    stockfish.on('close', (code) => {
        if (!res.headersSent) {
            clearTimeout(timeout);
            res.json(getRandomMove(fen));
        }
    });
    
    // Отправляем команды Stockfish
    stockfish.stdin.write('uci\n');
    stockfish.stdin.write(`setoption name Skill Level value ${level}\n`);
    stockfish.stdin.write(`position fen ${fen}\n`);
    stockfish.stdin.write('go depth 12\n');
});

// Функция для случайных ходов (fallback)
function getRandomMove(fen) {
    // Простой рандомный движок
    const moves = ['e2e4', 'd2d4', 'g1f3', 'c2c4', 'e7e5', 'd7d5', 'g8f6', 'c7c5'];
    return {
        move: moves[Math.floor(Math.random() * moves.length)],
        evaluation: 0,
        analysis: 'Random move (Stockfish not available)'
    };
}

// Проверка здоровья API
app.get('/api/health', (req, res) => {
    const stockfishAvailable = fs.existsSync(stockfishPath);
    res.json({
        status: 'ok',
        stockfish_available: stockfishAvailable,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Stockfish path: ${stockfishPath}`);
    console.log(`Stockfish available: ${fs.existsSync(stockfishPath)}`);
});
