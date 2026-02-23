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

    private ?User $authUser = null;

    private function authHeader(string $uloga = 'agent'): array
    {
        $user = User::create([
            'ime' => 'Test',
            'prezime' => 'User',
            'email' => 'user_' . uniqid() . '@test.com',
            'password' => Hash::make('123456'),
            'uloga' => $uloga,
        ]);

        $this->authUser = $user;

        $token = $user->createToken('test-token')->plainTextToken;

        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ];
    }

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

    public function test_index_returns_list_of_ponude()
    {
        $headers = $this->authHeader('agent');
        [$kupac, $nekretnina] = $this->seedKupacINekretnina();

        Ponuda::create([
            'kupac_id' => $kupac->id,
            'nekretnina_id' => $nekretnina->id,
            'iznos' => 95000,
            'status' => 'u_toku',
            'korisnik_id' => $this->authUser->id,
            'datum' => '2026-02-01',
        ]);

        Ponuda::create([
            'kupac_id' => $kupac->id,
            'nekretnina_id' => $nekretnina->id,
            'iznos' => 97000,
            'status' => 'prihvacena',
            'korisnik_id' => $this->authUser->id,
            'datum' => '2026-02-02',
        ]);

        $response = $this->getJson('/api/ponude', $headers);

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    public function test_show_returns_single_ponuda_when_exists()
    {
        $headers = $this->authHeader('agent');
        [$kupac, $nekretnina] = $this->seedKupacINekretnina();

        $p = Ponuda::create([
            'kupac_id' => $kupac->id,
            'nekretnina_id' => $nekretnina->id,
            'iznos' => 99000,
            'status' => 'u_toku',
            'korisnik_id' => $this->authUser->id,
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

    public function test_show_returns_404_when_not_found()
    {
        $headers = $this->authHeader('agent');

        $response = $this->getJson('/api/ponude/999999', $headers);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Ponuda nije pronađena',
            ]);
    }

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

    public function test_update_returns_422_on_validation_error()
    {
        $headers = $this->authHeader('agent');
        [$kupac, $nekretnina] = $this->seedKupacINekretnina();

        $p = Ponuda::create([
            'kupac_id' => $kupac->id,
            'nekretnina_id' => $nekretnina->id,
            'iznos' => 90000,
            'status' => 'u_toku',
            'korisnik_id' => $this->authUser->id,
            'datum' => '2026-02-05',
        ]);

        $response = $this->putJson('/api/ponude/' . $p->id, [
            'cena' => -1,
        ], $headers);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }

    public function test_destroy_deletes_ponuda()
    {
        $headers = $this->authHeader('agent');
        [$kupac, $nekretnina] = $this->seedKupacINekretnina();

        $p = Ponuda::create([
            'kupac_id' => $kupac->id,
            'nekretnina_id' => $nekretnina->id,
            'iznos' => 91000,
            'status' => 'u_toku',
            'korisnik_id' => $this->authUser->id,
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

    public function test_destroy_returns_404_when_not_found()
    {
        $headers = $this->authHeader('agent');

        $response = $this->deleteJson('/api/ponude/999999', [], $headers);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Ponuda nije pronađena',
            ]);
    }

    public function test_search_returns_422_on_invalid_sort_by()
    {
        $headers = $this->authHeader('agent');

        $response = $this->getJson('/api/ponude/search?sort_by=nepostoji&sort_dir=asc', $headers);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }
}