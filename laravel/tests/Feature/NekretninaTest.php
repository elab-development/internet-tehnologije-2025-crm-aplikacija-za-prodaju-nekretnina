<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Nekretnina;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class NekretninaTest extends TestCase
{
    use RefreshDatabase;

    // Pomoćna metoda za kreiranje Bearer tokena za datu ulogu (bez factory-ja)
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

    // Test da public ruta /nekretnine vraća listu nekretnina
    public function test_index_returns_list_of_nekretnine()
    {
        Nekretnina::create([
            'adresa' => 'Bulevar 1',
            'tip' => 'stan',
            'cena' => 100000,
            'status' => 'dostupna',
            'atributi' => ['sprat' => 3],
        ]);

        Nekretnina::create([
            'adresa' => 'Ulica 2',
            'tip' => 'kuca',
            'cena' => 200000,
            'status' => 'prodata',
            'atributi' => null,
        ]);

        $response = $this->getJson('/api/nekretnine');

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    // Test da public ruta /nekretnine/{id} vraća jednu nekretninu kada postoji
    public function test_show_returns_single_nekretnina_when_exists()
    {
        $n = Nekretnina::create([
            'adresa' => 'Cara Dusana 10',
            'tip' => 'stan',
            'cena' => 99000,
            'status' => 'dostupna',
            'atributi' => ['kvadratura' => 55],
        ]);

        $response = $this->getJson('/api/nekretnine/' . $n->id);

        $response->assertStatus(200)
            ->assertJson([
                'id' => $n->id,
                'adresa' => 'Cara Dusana 10',
                'tip' => 'stan',
                'cena' => 99000,
                'status' => 'dostupna',
            ]);
    }

    // Test da /nekretnine/{id} vraća 404 kada nekretnina ne postoji
    public function test_show_returns_404_when_not_found()
    {
        $response = $this->getJson('/api/nekretnine/999999');

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Nekretnina nije pronađena',
            ]);
    }

    // Test da agent može da kreira nekretninu (POST /nekretnine) i dobije 201
    public function test_agent_can_store_nekretnina()
    {
        $headers = $this->authHeader('agent');

        $response = $this->postJson('/api/nekretnine', [
            'adresa' => 'Nemanjina 5',
            'tip' => 'stan',
            'cena' => 120000,
            'status' => 'dostupna',
            'atributi' => ['sprat' => 2, 'lift' => true],
        ], $headers);

        $response->assertStatus(201)
            ->assertJson([
                'adresa' => 'Nemanjina 5',
                'tip' => 'stan',
                'cena' => 120000,
                'status' => 'dostupna',
            ]);

        $this->assertDatabaseHas('nekretnine', [
            'adresa' => 'Nemanjina 5',
            'tip' => 'stan',
            'cena' => 120000,
            'status' => 'dostupna',
        ]);
    }

    // Test da store vraća 422 kada validacija ne prođe (npr. nema adrese)
    public function test_store_returns_422_on_validation_error()
    {
        $headers = $this->authHeader('agent');

        $response = $this->postJson('/api/nekretnine', [
            'tip' => 'stan',
            'cena' => 120000,
        ], $headers);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }

    // Test da guest ne može da kreira nekretninu jer je ruta zaštićena auth:sanctum
    public function test_guest_cannot_store_nekretnina()
    {
        $response = $this->postJson('/api/nekretnine', [
            'adresa' => 'Test 1',
            'tip' => 'stan',
            'cena' => 1000,
        ]);

        $response->assertStatus(401);
    }

    // Test da agent može da izmeni nekretninu (PUT /nekretnine/{id})
    public function test_agent_can_update_nekretnina()
    {
        $headers = $this->authHeader('agent');

        $n = Nekretnina::create([
            'adresa' => 'Stara adresa',
            'tip' => 'stan',
            'cena' => 50000,
            'status' => 'dostupna',
            'atributi' => null,
        ]);

        $response = $this->putJson('/api/nekretnine/' . $n->id, [
            'adresa' => 'Nova adresa',
            'cena' => 60000,
            'atributi' => ['kvadratura' => 60],
        ], $headers);

        $response->assertStatus(200)
            ->assertJson([
                'id' => $n->id,
                'adresa' => 'Nova adresa',
                'cena' => 60000,
            ]);

        $this->assertDatabaseHas('nekretnine', [
            'id' => $n->id,
            'adresa' => 'Nova adresa',
            'cena' => 60000,
        ]);
    }

    // Test da update vraća 404 kada nekretnina ne postoji
    public function test_update_returns_404_when_not_found()
    {
        $headers = $this->authHeader('agent');

        $response = $this->putJson('/api/nekretnine/999999', [
            'adresa' => 'Nova',
        ], $headers);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Nekretnina nije pronađena',
            ]);
    }

    // Test da update vraća 422 kada validacija ne prođe (npr. negativna cena)
    public function test_update_returns_422_on_validation_error()
    {
        $headers = $this->authHeader('agent');

        $n = Nekretnina::create([
            'adresa' => 'Adresa',
            'tip' => 'stan',
            'cena' => 50000,
            'status' => 'dostupna',
            'atributi' => null,
        ]);

        $response = $this->putJson('/api/nekretnine/' . $n->id, [
            'cena' => -1,
        ], $headers);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }

    // Test da agent može da obriše nekretninu (DELETE /nekretnine/{id})
    public function test_agent_can_delete_nekretnina()
    {
        $headers = $this->authHeader('agent');

        $n = Nekretnina::create([
            'adresa' => 'Za brisanje',
            'tip' => 'kuca',
            'cena' => 150000,
            'status' => 'dostupna',
            'atributi' => null,
        ]);

        $response = $this->deleteJson('/api/nekretnine/' . $n->id, [], $headers);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Nekretnina obrisana',
            ]);

        $this->assertDatabaseMissing('nekretnine', [
            'id' => $n->id,
        ]);
    }

    // Test da delete vraća 404 kada nekretnina ne postoji
    public function test_delete_returns_404_when_not_found()
    {
        $headers = $this->authHeader('agent');

        $response = $this->deleteJson('/api/nekretnine/999999', [], $headers);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Nekretnina nije pronađena',
            ]);
    }

    // Test da search vraća paginirane rezultate i podržava filtere (status i tip)
    public function test_search_returns_paginated_results_with_filters()
    {
        Nekretnina::create([
            'adresa' => 'A 1',
            'tip' => 'stan',
            'cena' => 90000,
            'status' => 'dostupna',
            'atributi' => null,
        ]);

        Nekretnina::create([
            'adresa' => 'B 2',
            'tip' => 'kuca',
            'cena' => 190000,
            'status' => 'prodata',
            'atributi' => null,
        ]);

        Nekretnina::create([
            'adresa' => 'C 3',
            'tip' => 'stan',
            'cena' => 110000,
            'status' => 'dostupna',
            'atributi' => null,
        ]);

        $response = $this->getJson('/api/nekretnine/search?status=dostupna&tip=stan&per_page=10&sort_by=cena&sort_dir=asc');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'current_page',
                'data',
                'per_page',
                'total',
            ]);

        $data = $response->json('data');
        $this->assertCount(2, $data);

        $this->assertEquals('A 1', $data[0]['adresa']);
        $this->assertEquals('C 3', $data[1]['adresa']);
    }

    // Test da search vraća 422 kada proslediš nevalidan sort_by parametar
    public function test_search_returns_422_on_invalid_sort_by()
    {
        $response = $this->getJson('/api/nekretnine/search?sort_by=nepostoji&sort_dir=asc');

        $response->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }
}