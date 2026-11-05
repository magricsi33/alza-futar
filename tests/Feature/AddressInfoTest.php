<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class AddressInfoTest extends TestCase
{
    private $directory;

    protected function setUp(): void
    {
        parent::setUp();
        $this->directory = storage_path('framework/testing/address-info-'.uniqid());
        config(['address-info.path' => $this->directory]);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->directory);
        parent::tearDown();
    }

    public function test_shared_notes_and_photos_can_be_read_and_deleted()
    {
        $image = UploadedFile::fake()->createWithContent('box.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='));
        $saved = $this->post('/address-info/AB9087', [
            'revision' => 0, 'note' => 'Bejárat jobbra', 'photos' => [$image],
        ], ['Accept' => 'application/json'])->assertOk()->assertJsonPath('revision', 1)->json();

        $this->flushSession();
        $this->getJson('/address-info/AB9087')->assertOk()->assertJsonPath('note', 'Bejárat jobbra')->assertJsonCount(1, 'photos');
        $this->get($saved['photos'][0]['url'])->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->getJson('/address-info/AB9815')->assertJsonPath('note', '')->assertJsonCount(0, 'photos');
        $this->postJson('/address-info/AB9087', ['revision' => 0, 'note' => 'Régi eszköz'])->assertStatus(409);
        $this->postJson('/address-info/AB9087', ['revision' => 1, 'note' => 'Megmarad'])->assertOk()->assertJsonCount(0, 'photos');
        $this->get($saved['photos'][0]['url'])->assertNotFound();
        $this->getJson('/address-info/AB9087')->assertJsonPath('note', 'Megmarad');
    }

    public function test_non_images_and_unknown_photo_ids_are_rejected()
    {
        $this->post('/address-info/AB9087', [
            'revision' => 0, 'photos' => [UploadedFile::fake()->createWithContent('script.svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>')],
        ], ['Accept' => 'application/json'])->assertStatus(422);
        $this->postJson('/address-info/AB9087', [
            'revision' => 0, 'keep' => ['12345678-1234-4234-8234-123456789012'],
        ])->assertStatus(422);
    }
}
