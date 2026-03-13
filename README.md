
# CRM NEKRETNINE  

## Opis projekta

CRM Nekretnine je web aplikacija namenjena upravljanju nekretninama, kupcima i zakazanim pregledima. Sistem omogućava autentifikaciju korisnika, CRUD operacije nad glavnim entitetima, naprednu pretragu i filtriranje podataka, kao i upravljanje slikama nekretnina.

Aplikacija je podeljena na:
- Frontend (React)
- Backend (Laravel REST API)
- MySQL bazu podataka

Kompletan sistem je dockerizovan i pokreće se pomoću Docker Compose alata.

---

## Tehnologije

- Backend: Laravel (PHP 8, REST API, Sanctum autentifikacija)
- Frontend: React (Create React App, Axios)
- Baza podataka: MySQL 8
- Web server: Nginx
- API dokumentacija: Swagger / OpenAPI (L5-Swagger)
- Docker + Docker Compose

---

## Struktura projekta

CRM NEKRETNINE/

- laravel/              – Backend aplikacija
- reactfront/           – Frontend aplikacija
- docker/nginx/default.conf
- docker-compose.yml
- README.md

---

## Docker servisi

U docker-compose.yml definisani su sledeći servisi:

- mysql – MySQL baza podataka
- laravel – Laravel backend (PHP-FPM)
- nginx – Web server za API
- reactfront – React frontend aplikacija
- phpmyadmin – Administracija baze podataka

---

## Portovi

Frontend: http://localhost:3008  
Backend API: http://localhost:8088  
Swagger: http://localhost:8088/api/documentation  
phpMyAdmin: http://localhost:8089  
MySQL (host): 3308  

---

## Pokretanje aplikacije (Docker)

### 1. Build i pokretanje svih servisa

docker compose up -d --build

### 2. Provera da li kontejneri rade

docker ps

### 3. Generisanje Laravel APP_KEY

docker compose exec laravel php artisan key:generate

### 4. Pokretanje migracija

docker compose exec laravel php artisan migrate

### 5. Ubacivanje test podataka (opciono)

docker compose exec laravel php artisan db:seed

### 6. Storage link (za upload slika)

docker compose exec laravel php artisan storage:link

### 7. Regeneracija Swagger dokumentacije

docker compose exec laravel php artisan l5-swagger:generate

### 8. Testiranje

docker compose exec laravel php artisan test

---

## Zaustavljanje sistema

docker compose down

---

## Autentifikacija

API koristi Bearer token autentifikaciju (Laravel Sanctum).

Authorization header:

Authorization: Bearer <token>

---

## Glavne API rute

### Autentifikacija

- POST /api/register
- POST /api/login
- GET /api/me
- POST /api/logout

### Kupci

- GET /api/kupci
- GET /api/kupci/{id}
- POST /api/kupci
- PUT /api/kupci/{id}
- DELETE /api/kupci/{id}
- GET /api/kupci/search

### Nekretnine

- GET /api/nekretnine
- GET /api/nekretnine/{id}
- POST /api/nekretnine
- PUT /api/nekretnine/{id}
- DELETE /api/nekretnine/{id}
- GET /api/nekretnine/search

---

 