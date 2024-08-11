const fs = require('fs');

// Пути к вашим файлам
const groupIdUsersPath = '/Users/pavel/Projects/telethon/core.json';

// Функция для поиска и вывода дубликатов
function findDuplicates(groupIdUsersPath) {
    fs.readFile(groupIdUsersPath, 'utf8', (err, groupIdUsersData) => {
        if (err) {
            console.error(`Ошибка чтения файла groupIdUsers: ${err.message}`);
            return;
        }

        // Парсим JSON данные
        const groupIdUsers = JSON.parse(groupIdUsersData);

        // Объект для хранения встречающихся комбинаций g и u
        const seen = {};
        const duplicates = [];

        // Итерируемся по массиву и ищем дубликаты
        groupIdUsers.forEach(groupUser => {
            const key = `${groupUser.g}-${groupUser.u}`;

            if (seen[key]) {
                // Если ключ уже встречался, добавляем в массив дубликатов
                duplicates.push(groupUser);
            } else {
                // Если ключ не встречался, сохраняем его
                seen[key] = true;
            }
        });

        // Выводим дубликаты в консоль
        if (duplicates.length > 0) {
            console.log('Найдены дубликаты:');
            console.log(duplicates);
        } else {
            console.log('Дубликаты не найдены.');
        }
    });
}

// Вызов функции
findDuplicates(groupIdUsersPath);
