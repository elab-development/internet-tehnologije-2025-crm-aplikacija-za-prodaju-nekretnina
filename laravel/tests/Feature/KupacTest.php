<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Kupac;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class KupacTest extends TestCase
{
    use RefreshDatabase;

    // Pomoćna metoda koja pravi auth header za korisnika sa datom ulogom (bez factory-ja)
    private function authHeader(string $uloga = 'agent'): array
    {
        $user = User::create([
            'ime' => 'Test',
            'prezime' => 'User',
            'email' => 'user_' . uniqid() . '@test.com',
            'password' => Hash::make('123456'),
            'uloga' => $uloga,
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ];
    }

    // Test da prijavljen korisnik može da dobije listu kupaca
    public function test_index_returns_list_of_kupci()
    {
        $headers = $this->authHeader('agent');

        Kupac::create([
            'ime' => 'Pera',
            'prezime' => 'Peric',
            'telefon' => '061111111',
            'email' => 'pera@test.com',
            'budzet' => 100000,
            'lokacija' => 'Beograd',
            'napomena' => 'Napomena 1',
        ]);

        Kupac::create([
            'ime' => 'Mika',
            'prezime' => 'Mikic',
            'telefon' => null,
            'email' => null,
            'budzet' => null,
            'lokacija' => null,
            'napomena' => null,
        ]);

        $response = $this->getJson('/api/kupci', $headers);

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    // Test da show vraća kupca kada postoji
    public function test_show_returns_single_kupac_when_exists()
    {
        $headers = $this->authHeader('agent');

        $k = Kupac::create([
            'ime' => 'Ana',
            'prezime' => 'Anic',
            'telefon' => '062222222',
            'email' => 'ana@test.com',
            'budzet' => 80000,
            'lokacija' => 'Novi Sad',
            'napomena' => 'Zeli stan',
        ]);

        $response = $this->getJson('/api/kupci/' . $k->id, $headers);

        $response->assertStatus(200)
            ->assertJson([
                'id' => $k->id,
                'ime' => 'Ana',
                'prezime' => 'Anic',
                'email' => 'ana@test.com',
            ]);
    }

    // Test da show vraća 404 kada kupac ne postoji
    public function test_show_returns_404_when_not_found()
    {
        $headers = $this->authHeader('agent');

        $response = $this->getJson('/api/kupci/999999', $headers);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Kupac nije pronađen',
            ]);
    }

    // Test da store kreira kupca i vraća 201 kada je payload validan
    public function test_store_creates_kupac()
    {
        $headers = $this->authHeader('agent');

        $payload = [
            'ime' => 'Marko',
            'prezime' => 'Markovic',
            'telefon' => '063333333',
            'email' => 'marko@test.com',
            'budzet' => 120000,
            'lokacija' => 'Kragujevac',
            'napomena' => 'Zeli kucu',
        ];

        $response = $this->postJson('/api/kupci', $payload, $headers);

        $response->assertStatus(201)
            ->assertJson([
                'ime' => 'Marko',
                'prezime' => 'Markovic',
                'email' => 'marko@test.com',
                'lokacija' => 'Kragujevac',
            ]);

        $this->assertDatabaseHas('kupci', [
            'ime' => 'Marko',
            'prezime' => 'Markovic',
            'email' => 'marko@test.com',
        ]);
    }

    // Test da store vraća 422 kada validacija ne prođe (npr. nema imena)
    public function test_store_returns_422_on_validation_error()
    {
        $headers = $this->authHeader('agent');

        $response = $this->postJson('/api/kupci', [
            'prezime' => 'BezImena',
        ], $headers);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }

    // Test da update menja kupca i vraća 200 kada kupac postoji
    public function test_update_updates_kupac()
    {
        $headers = $this->authHeader('agent');

        $k = Kupac::create([
            'ime' => 'Jovan',
            'prezime' => 'Jovic',
            'telefon' => '064444444',
            'email' => 'jovan@test.com',
            'budzet' => 70000,
            'lokacija' => 'Nis',
            'napomena' => 'Zeli garsonjeru',
        ]);

        $response = $this->putJson('/api/kupci/' . $k->id, [
            'lokacija' => 'Nis - centar',
            'budzet' => 90000,
        ], $headers);

        $response->assertStatus(200)
            ->assertJson([
                'id' => $k->id,
                'lokacija' => 'Nis - centar',
                'budzet' => 90000,
            ]);

        $this->assertDatabaseHas('kupci', [
            'id' => $k->id,
            'lokacija' => 'Nis - centar',
            'budzet' => 90000,
        ]);
    }

    // Test da update vraća 404 kada kupac ne postoji
    public function test_update_returns_404_when_not_found()
    {
        $headers = $this->authHeader('agent');

        $response = $this->putJson('/api/kupci/999999', [
            'lokacija' => 'Nesto',
        ], $headers);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Kupac nije pronađen',
            ]);
    }

    // Test da update vraća 422 kada je email nevalidan
    public function test_update_returns_422_on_validation_error()
    {
        $headers = $this->authHeader('agent');

        $k = Kupac::create([
            'ime' => 'Milica',
            'prezime' => 'Milic',
            'telefon' => null,
            'email' => 'milica@test.com',
            'budzet' => null,
            'lokacija' => null,
            'napomena' => null,
        ]);

        $response = $this->putJson('/api/kupci/' . $k->id, [
            'email' => 'nije-email',
        ], $headers);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }

    // Test da destroy briše kupca i vraća poruku o brisanju
    public function test_destroy_deletes_kupac()
    {
        $headers = $this->authHeader('agent');

        $k = Kupac::create([
            'ime' => 'Sara',
            'prezime' => 'Saric',
            'telefon' => '065555555',
            'email' => 'sara@test.com',
            'budzet' => 50000,
            'lokacija' => 'Jagodina',
            'napomena' => 'Hitno',
        ]);

        $response = $this->deleteJson('/api/kupci/' . $k->id, [], $headers);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Kupac obrisan',
            ]);

        $this->assertDatabaseMissing('kupci', [
            'id' => $k->id,
        ]);
    }

    // Test da destroy vraća 404 kada kupac ne postoji
    public function test_destroy_returns_404_when_not_found()
    {
        $headers = $this->authHeader('agent');

        $response = $this->deleteJson('/api/kupci/999999', [], $headers);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Kupac nije pronađen',
            ]);
    }

    // Test da search vraća paginirane rezultate i filtrira po q parametru
    public function test_search_returns_paginated_results_and_filters_by_q()
    {
        $headers = $this->authHeader('agent');

        Kupac::create([
            'ime' => 'Petar',
            'prezime' => 'Petrovic',
            'telefon' => '061111111',
            'email' => 'petar@test.com',
            'budzet' => 100000,
            'lokacija' => 'Beograd',
            'napomena' => 'Trazi stan',
        ]);

        Kupac::create([
            'ime' => 'Milan',
            'prezime' => 'Milic',
            'telefon' => '062222222',
            'email' => 'milan@test.com',
            'budzet' => 150000,
            'lokacija' => 'Novi Sad',
            'napomena' => 'Trazi kucu',
        ]);

        $response = $this->getJson('/api/kupci/search?q=Petar&per_page=10&sort_by=ime&sort_dir=asc', $headers);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'current_page',
                'data',
                'per_page',
                'total',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Petar', $data[0]['ime']);
    }

    // Test da search vraća 422 kada proslediš nevalidan sort_by parametar
    public function test_search_returns_422_on_invalid_sort_by()
    {
        $headers = $this->authHeader('agent');

        $response = $this->getJson('/api/kupci/search?sort_by=nepostoji&sort_dir=asc', $headers);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }

    // Test da guest ne može da pristupi kupcima jer su rute zaštićene auth:sanctum
    public function test_guest_cannot_access_kupci_routes()
    {
        $response = $this->getJson('/api/kupci');

        $response->assertStatus(401);
    }
}