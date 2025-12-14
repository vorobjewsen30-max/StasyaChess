#!/bin/bash
# Простой шахматный движок для тестирования
echo "uci"
echo "id name SimpleChessEngine 1.0"
echo "id author StasyaChess"
echo "option name Hash type spin default 32 min 1 max 1024"
echo "option name Threads type spin default 1 min 1 max 8"
echo "option name Skill Level type spin default 20 min 0 max 20"
echo "uciok"

# Ожидаем команду isready
while IFS= read -r line; do
    if [[ "$line" == "isready" ]]; then
        echo "readyok"
    elif [[ "$line" == "quit" ]]; then
        exit 0
    elif [[ "$line" == "uci" ]]; then
        echo "uciok"
    elif [[ "$line" == "setoption"* ]]; then
        # Игнорируем настройки для простоты
        continue
    elif [[ "$line" == "position fen"* ]]; then
        # Сохраняем позицию
        current_fen=$(echo "$line" | cut -d' ' -f3-)
    elif [[ "$line" == "go"* ]]; then
        # Генерируем случайный ход из списка возможных
        possible_moves=("e2e4" "d2d4" "g1f3" "c2c4" "e7e5" "d7d5" "g8f6" "c7c5" 
                       "b1c3" "f1c4" "f1b5" "e1g1" "b2b3" "g2g3" "a2a3" "h2h3")
        random_move=${possible_moves[$RANDOM % ${#possible_moves[@]}]}
        
        # Небольшая задержка для реалистичности
        sleep 0.3
        
        # Отправляем оценку и ход
        random_score=$((RANDOM % 400 - 200))
        echo "info depth 1 score cp $random_score"
        echo "bestmove $random_move"
    fi
done
