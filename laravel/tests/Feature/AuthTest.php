<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // Test da se korisnik uspešno registruje i dobije token
    public function test_user_can_register()
    {
        $response = $this->postJson('/api/register', [
            'ime' => 'Petar',
            'prezime' => 'Petrovic',
            'email' => 'petar@test.com',
            'password' => '123456',
            'password_confirmation' => '123456',
            'uloga' => 'agent',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => ['id', 'ime', 'prezime', 'email', 'uloga'],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'petar@test.com',
            'ime' => 'Petar',
            'prezime' => 'Petrovic',
            'uloga' => 'agent',
        ]);
    }

    // Test da registracija pada ako email već postoji
    public function test_register_fails_if_email_exists()
    {
        User::create([
            'ime' => 'Neko',
            'prezime' => 'Postojeci',
            'email' => 'postoji@test.com',
            'password' => Hash::make('123456'),
            'uloga' => 'agent',
        ]);

        $response = $this->postJson('/api/register', [
            'ime' => 'Marko',
            'prezime' => 'Markovic',
            'email' => 'postoji@test.com',
            'password' => '123456',
            'password_confirmation' => '123456',
            'uloga' => 'agent',
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['message', 'errors']);
    }

    // Test da korisnik može da se uloguje sa ispravnim podacima i dobije token
    public function test_user_can_login()
    {
        $user = User::create([
            'ime' => 'Mila',
            'prezime' => 'Milic',
            'email' => 'mila@test.com',
            'password' => Hash::make('123456'),
            'uloga' => 'agent',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => '123456',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => ['id', 'ime', 'prezime', 'email', 'uloga'],
            ]);
    }

    // Test da login vraća 401 kada je lozinka pogrešna
    public function test_login_fails_with_wrong_password()
    {
        $user = User::create([
            'ime' => 'Jovan',
            'prezime' => 'Jovic',
            'email' => 'jovan@test.com',
            'password' => Hash::make('123456'),
            'uloga' => 'agent',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => '000000',
        ]);

        $response->assertStatus(401)
            ->assertJsonStructure(['message', 'errors']);
    }

    // Test da prijavljeni korisnik može da pristupi /me i dobije svoje podatke
    public function test_authenticated_user_can_access_me()
    {
        $user = User::create([
            'ime' => 'Ana',
            'prezime' => 'Anic',
            'email' => 'ana@test.com',
            'password' => Hash::make('123456'),
            'uloga' => 'agent',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJson([
                'id' => $user->id,
                'ime' => 'Ana',
                'prezime' => 'Anic',
                'email' => 'ana@test.com',
                'uloga' => 'agent',
            ]);
    }

    // Test da neprijavljeni korisnik dobija 401 na /me
    public function test_guest_cannot_access_me()
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401);
    }

    // Test da odjava briše trenutni token i vraća poruku o uspešnoj odjavi
    public function test_user_can_logout()
    {
        $user = User::create([
            'ime' => 'Sara',
            'prezime' => 'Saric',
            'email' => 'sara@test.com',
            'password' => Hash::make('123456'),
            'uloga' => 'agent',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Uspešna odjava.',
            ]);
    }
}