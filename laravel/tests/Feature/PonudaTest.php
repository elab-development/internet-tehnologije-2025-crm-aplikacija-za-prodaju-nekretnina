<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Kupac;
use App\Models\Nekretnina;
use App\Models\Ponuda;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class PonudaTest extends TestCase
{
    use RefreshDatabase;

    // Pomoćna metoda koja pravi auth header (Bearer token) za korisnika sa datom ulogom (bez factory-ja)
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

    // Pomoćna metoda koja kreira kupca i nekretninu da bi store validacija (exists) prošla
    private function seedKupacINekretnina(): array
    {
        $kupac = Kupac::create([
            'ime' => 'Pera',
            'prezime' => 'Peric',
            'telefon' => '061111111',
            'email' => 'pera@test.com',
            'budzet' => 100000,
            'lokacija' => 'Beograd',
            'napomena' => 'Test kupac',
        ]);

        $nekretnina = Nekretnina::create([
            'adresa' => 'Bulevar 1',
            'tip' => 'stan',
            'cena' => 120000,
            'status' => 'dostupna',
            'atributi' => null,
        ]);

        return [$kupac, $nekretnina];
    }

    // Test da index vraća listu ponuda (za prijavljenog korisnika)
    public function test_index_returns_list_of_ponude()
    {
        $headers = $this->authHeader('agent');
        [$kupac, $nekretnina] = $this->seedKupacINekretnina();

        Ponuda::create([
            'kupac_id' => $kupac->id,
            'nekretnina_id' => $nekretnina->id,
            'iznos' => 95000,
            'status' => 'u_toku',
            'napomena' => 'Ponuda 1',
            'korisnik_id' => 1,
            'datum' => '2026-02-01',
        ]);

        Ponuda::create([
            'kupac_id' => $kupac->id,
            'nekretnina_id' => $nekretnina->id,
            'iznos' => 97000,
            'status' => 'prihvacena',
            'napomena' => 'Ponuda 2',
            'korisnik_id' => 1,
            'datum' => '2026-02-02',
        ]);

        $response = $this->getJson('/api/ponude', $headers);

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    // Test da show vraća ponudu kada postoji
    public function test_show_returns_single_ponuda_when_exists()
    {
        $headers = $this->authHeader('agent');
        [$kupac, $nekretnina] = $this->seedKupacINekretnina();

        $p = Ponuda::create([
            'kupac_id' => $kupac->id,
            'nekretnina_id' => $nekretnina->id,
            'iznos' => 99000,
            'status' => 'u_toku',
            'napomena' => 'Test ponuda',
            'korisnik_id' => 1,
            'datum' => '2026-02-03',
        ]);

        $response = $this->getJson('/api/ponude/' . $p->id, $headers);

        $response->assertStatus(200)
            ->assertJson([
                'id' => $p->id,
                'kupac_id' => $kupac->id,
                'nekretnina_id' => $nekretnina->id,
                'status' => 'u_toku',
            ]);
    }

    // Test da show vraća 404 kada ponuda ne postoji
    public function test_show_returns_404_when_not_found()
    {
        $headers = $this->authHeader('agent');

        $response = $this->getJson('/api/ponude/999999', $headers);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Ponuda nije pronađena',
            ]);
    }

    // Test da store vraća 422 kada validacija ne prođe (npr. nema datum)
    public function test_store_returns_422_on_validation_error()
    {
        $headers = $this->authHeader('agent');
        [$kupac, $nekretnina] = $this->seedKupacINekretnina();

        $response = $this->postJson('/api/ponude', [
            'kupac_id' => $kupac->id,
            'nekretnina_id' => $nekretnina->id,
            'cena' => 1000,
        ], $headers);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }

    // Test da guest ne može da kreira ponudu jer su rute zaštićene auth:sanctum
    public function test_guest_cannot_store_ponuda()
    {
        $response = $this->postJson('/api/ponude', [
            'kupac_id' => 1,
            'nekretnina_id' => 1,
            'cena' => 1000,
            'datum' => '2026-02-10',
        ]);

        $response->assertStatus(401);
    }

    // Test da update vraća 404 kada ponuda ne postoji
    public function test_update_returns_404_when_not_found()
    {
        $headers = $this->authHeader('agent');

        $response = $this->putJson('/api/ponude/999999', [
            'status' => 'odbijena',
        ], $headers);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Ponuda nije pronađena',
            ]);
    }

    // Test da update vraća 422 kada validacija ne prođe (npr. cena negativna)
    public function test_update_returns_422_on_validation_error()
    {
        $headers = $this->authHeader('agent');
        [$kupac, $nekretnina] = $this->seedKupacINekretnina();

        $p = Ponuda::create([
            'kupac_id' => $kupac->id,
            'nekretnina_id' => $nekretnina->id,
            'iznos' => 90000,
            'status' => 'u_toku',
            'napomena' => null,
            'korisnik_id' => 1,
            'datum' => '2026-02-05',
        ]);

        $response = $this->putJson('/api/ponude/' . $p->id, [
            'cena' => -1,
        ], $headers);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }

    // Test da destroy briše ponudu i vraća poruku o brisanju
    public function test_destroy_deletes_ponuda()
    {
        $headers = $this->authHeader('agent');
        [$kupac, $nekretnina] = $this->seedKupacINekretnina();

        $p = Ponuda::create([
            'kupac_id' => $kupac->id,
            'nekretnina_id' => $nekretnina->id,
            'iznos' => 91000,
            'status' => 'u_toku',
            'napomena' => 'Brisanje',
            'korisnik_id' => 1,
            'datum' => '2026-02-06',
        ]);

        $response = $this->deleteJson('/api/ponude/' . $p->id, [], $headers);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Ponuda obrisana',
            ]);

        $this->assertDatabaseMissing('ponude', [
            'id' => $p->id,
        ]);
    }

    // Test da destroy vraća 404 kada ponuda ne postoji
    public function test_destroy_returns_404_when_not_found()
    {
        $headers = $this->authHeader('agent');

        $response = $this->deleteJson('/api/ponude/999999', [], $headers);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Ponuda nije pronađena',
            ]);
    }

    // Test da search vraća 422 kada proslediš nevalidan sort_by parametar
    public function test_search_returns_422_on_invalid_sort_by()
    {
        $headers = $this->authHeader('agent');

        $response = $this->getJson('/api/ponude/search?sort_by=nepostoji&sort_dir=asc', $headers);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }
}