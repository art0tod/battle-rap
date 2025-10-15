# Battle Rap API – Bruno Collection

Эта папка содержит коллекцию запросов для Bruno, отражающую основные эндпоинты Battle Rap API.

## Быстрый старт

- Установите [Bruno](https://www.usebruno.com/) и выберите `Open Collection`.
- Укажите путь `docs/bruno/battle-rap-api` — коллекция и окружение будут импортированы автоматически.
- В файле окружения `local` задайте значения для аккаунтов, токенов и идентификаторов перед запуском защищённых запросов (см. таблицу ниже).
- Выполните `Auth / Login` — скрипт сохранит `token` в окружение; при необходимости перенесите его в `adminToken`/`artistToken`/`judgeToken`, чтобы проверять права разных ролей.

## Переменные окружения

- `baseUrl` — адрес API (по умолчанию `http://localhost:3000/api`).
- `email` / `password` — учётные данные для входа через `Auth / Login`.
- `token`, `adminToken`, `artistToken`, `judgeToken` — JWT для запросов с разными ролями.
- `targetUserId`, `artistUserId`, `tournamentId`, `participantId`, `judgeUserId`, `roundId`, `matchId`, `submissionId`, `audioId` — идентификаторы записей в базе.
- `mediaStorageKey` — путь в стораже для загрузки медиа при создании ассетов.

## Структура

- `collection.bru` — описание коллекции.
- `bruno.json` — конфигурация Bruno (ссылки на окружения и общие настройки).
- `environments/local.bru` — переменные для локального запуска (`baseUrl` по умолчанию указывает на `http://localhost:3000/api`).
- `requests/*` — тематические папки с отдельными `.bru` файлами для Auth, Users, Admin, Tournaments, Submissions, Matches, Evaluations и Meta.

При добавлении новых эндпоинтов держите структуру зеркальной к папкам в `src/` и дублируйте переменные в окружении при необходимости.

# Документация

Samples

Here are a few sample Bru files.
GET

get {
url: https://api.github.com/users/usebruno
}

GET with headers

get {
url: https://api.textlocal.in/send?apiKey=secret&numbers=9988776655&message=hello
}

headers {
content-type: application/json
Authorization: Bearer topsecret
}

POST with body

post {
url: https://api.textlocal.in/send
}

body {
{
"apiKey": "secret",
"numbers": "9988776655",
"message": "Woof! lets play with some apis"
}
}

headers {
content-type: application/json
Authorization: Bearer topsecret
}

Scripting

post {
url: https://api.textlocal.in/login
}

body {
{
"username": "johnnash",
"password": "governingdynamics"
}
}

script:post-response {
bru.setVar("token", res.body.token);
}

Testing

post {
url: https://api.textlocal.in/login
}

body {
{
"username": "johnnash",
"password": "governingdynamics"
}
}

tests {
test("should be able to login", function() {
expect(res.status).to.equal(201);
});

test("should receive the token", function() {
expect(res.body.token).to.be.a('string');
});
}

Language Design

A Bru file is made up of blocks. There are three kinds of blocks

    Dictionary block
    Text block
    Array block

Dictionary block

A dictionary block contains a set of key value pairs.

get {
url: https://api.textlocal.in/send
}

headers {
content-type: application/json
Authorization: Bearer 123
~transaction-id: {{transactionId}}
}

Any key in the dictionary block can be prefixed with ~ to indicate that it is disabled.
Text block

A text block is a set of lines

body {
{
"hello": "world"
}
}

tests {
expect(res.status).to.equal(200);
}

Array block

An array block is a list of strings

vars:secret [
access_key,
access_secret,
~transactionId
]

Any key in the array block can be prefixed with ~ to indicate that it is disabled.

Bru Tag Reference
meta

Store metadata about your request

meta {
name: Get users
type: http
seq: 1
tags: [
smoke
sanity
]
}

The seq is used to store the sequence number. This decides the sort position of your request in the UI. The type can be either http or graphql The tags is an array of strings that can be used to filter requests during collection runs. Tags are useful for organizing and selectively running requests based on categories like environment, functionality, or priority.
get

Make a GET http call

get {
url: https://api.github.com/users/usebruno
}

post

Make a POST http call

post {
url: https://api.github.com/users/usebruno
}

put

Make a PUT http call

put {
url: https://api.github.com/users/usebruno
}

delete

Make a DELETE http call

delete {
url: https://api.github.com/users/usebruno
}

options

Make a get OPTIONS call

options {
url: https://api.github.com/users/usebruno
}

trace

Make a TRACE http call

trace {
url: https://api.github.com/users/usebruno
}

connect

Make a CONNECT http call

connect {
url: https://api.github.com/users/usebruno
}

head

Make a HEAD http call

head {
url: https://api.github.com/users/usebruno
}

query

The request query params

get {
url: https://api.textlocal.in/send?apiKey=secret&numbers=9988776655&message=hello
}

params:query {
apiKey: secret
numbers: 9988776655
message: hello
}

path

The request path params

get {
url: https://api.textlocal.in/user/:userId
}

params:path {
userId: 13
}

headers

The request query headers

get {
url: https://api.textlocal.in/send?apiKey=secret&numbers=9988776655&message=hello
}

headers {
content-type: application/json
Authorization: Bearer topsecret
}

body

The request body (defaults to json)

body {
{
username: 'john',
password: 'governingdynamics'
}
}

body:text

The request body as text

body:text {
This is a text body
}

body:xml

The request body as xml

body:xml {
<xml>
<name>John</name>
<age>30</age>
</xml>
}

body:form-urlencoded

The request body as form-urlencoded

body:form-urlencoded {
apikey: secret
numbers: +91998877665
~message: hello
}

body:multipart-form

The request body as multipart-form

body:multipart-form {
apikey: secret
numbers: +91998877665
~message: hello
}

body:graphql

The request body as graphql

body:graphql {
{
launchesPast {
launch_site {
site_name
}
launch_success
}
}
}

body:graphql:vars

The request body as graphql vars

body:graphql:vars {
{
"limit": 5
}
}

script:pre-request

The request body as pre-request

script:pre-request {
req.setHeader("Authorization", "{{token}}");
}

script:post-response

The request body as post-response

script:post-response {
bru.setVar("token", res.body.token);
}

test

The tests

body:test {
expect(res.status).to.equal(200);
}
