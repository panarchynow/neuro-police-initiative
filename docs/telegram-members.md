# Telegram Members
Сервис для получения списка участников в группе Telegram.

## Команды

### Получить список пользователей в группе
```bash
curl -X GET --location "https://<base-url>/chats/<chat-id>" \
    -H "Authorization: Bearer <token>"
```

### Список групп пользователя
```bash
curl -X GET --location "https://<base-url>/users/<user-id>" \
    -H "Authorization: Bearer <token>"
```