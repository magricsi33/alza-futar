<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AddressInfoController extends Controller
{
    private function directory($id)
    {
        abort_unless(preg_match('/^AB[0-9]{3,6}$/D', $id), 404);
        $directory = config('address-info.path', storage_path('app/address-info')).'/'.$id;
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            throw new \RuntimeException('Cannot create address storage.');
        }
        return $directory;
    }

    private function locked($id, $callback)
    {
        $directory = $this->directory($id);
        $lock = fopen($directory.'/.lock', 'c');
        if (!$lock) {
            throw new \RuntimeException('Cannot open address lock.');
        }
        try {
            if (!flock($lock, LOCK_EX)) {
                throw new \RuntimeException('Cannot lock address.');
            }
            $path = $directory.'/record.json';
            $record = file_exists($path)
                ? json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR)
                : ['id' => $id, 'note' => '', 'photos' => [], 'revision' => 0];
            return $callback($directory, $record);
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    private function responseRecord($record)
    {
        $record['photos'] = array_map(function ($photo) use ($record) {
            return [
                'id' => $photo['id'],
                'name' => $photo['name'],
                'url' => route('address-info.photo', ['id' => $record['id'], 'photo' => $photo['id']], false),
            ];
        }, $record['photos']);
        return response()->json($record)->header('Cache-Control', 'no-store, private');
    }

    public function show($id)
    {
        return $this->locked($id, function ($directory, $record) {
            return $this->responseRecord($record);
        });
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'note' => 'nullable|string|max:10000',
            'revision' => 'required|integer|min:0',
            'keep' => 'nullable|array|max:12',
            'keep.*' => 'required|uuid|distinct',
            'photos' => 'nullable|array|max:12',
            'photos.*' => 'file|max:20480|mimetypes:image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/avif',
        ]);
        return $this->locked($id, function ($directory, $record) use ($request, $data) {
            if ($record['revision'] !== (int) $data['revision']) {
                return response()->json(['message' => 'Ezt a címet közben másik eszközön módosították. Nyisd meg újra az információkat, majd ismételd meg a módosítást.'], 409);
            }
            $keep = $data['keep'] ?? [];
            $existingIds = array_column($record['photos'], 'id');
            if (array_diff($keep, $existingIds)) {
                throw ValidationException::withMessages(['keep' => 'Ismeretlen képazonosító.']);
            }
            $photos = array_values(array_filter($record['photos'], function ($photo) use ($keep) {
                return in_array($photo['id'], $keep, true);
            }));
            $uploads = $request->file('photos', []);
            if (count($photos) + count($uploads) > 12) {
                throw ValidationException::withMessages(['photos' => 'Címenként legfeljebb 12 kép tölthető fel.']);
            }
            $created = [];
            $temporary = $directory.'/record-'.Str::uuid().'.tmp';
            try {
                foreach ($uploads as $upload) {
                    $photoId = (string) Str::uuid();
                    $created[] = $directory.'/'.$photoId;
                    if (!copy($upload->getRealPath(), $directory.'/'.$photoId)) {
                        throw new \RuntimeException('Cannot save uploaded photo.');
                    }
                    $photos[] = [
                        'id' => $photoId,
                        'name' => mb_substr(basename($upload->getClientOriginalName()), 0, 200),
                        'mime' => mime_content_type($directory.'/'.$photoId),
                    ];
                }
                $next = [
                    'id' => $record['id'],
                    'note' => $data['note'] ?? '',
                    'photos' => $photos,
                    'revision' => $record['revision'] + 1,
                ];
                if (file_put_contents($temporary, json_encode($next, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)) === false ||
                    !rename($temporary, $directory.'/record.json')) {
                    throw new \RuntimeException('Cannot save address information.');
                }
            } catch (\Throwable $error) {
                foreach ($created as $path) { if (is_file($path)) unlink($path); }
                if (is_file($temporary)) unlink($temporary);
                throw $error;
            }
            foreach ($record['photos'] as $photo) {
                if (!in_array($photo['id'], $keep, true) && is_file($directory.'/'.$photo['id'])) {
                    unlink($directory.'/'.$photo['id']);
                }
            }
            return $this->responseRecord($next);
        });
    }

    public function photo($id, $photo)
    {
        return $this->locked($id, function ($directory, $record) use ($photo) {
            $entry = collect($record['photos'])->firstWhere('id', $photo);
            abort_unless($entry && is_file($directory.'/'.$photo), 404);
            $stream = fopen($directory.'/'.$photo, 'rb');
            abort_unless($stream, 404);
            return response()->stream(function () use ($stream) {
                try { fpassthru($stream); } finally { fclose($stream); }
            }, 200, [
                'Content-Type' => $entry['mime'],
                'X-Content-Type-Options' => 'nosniff',
                'Cache-Control' => 'no-store, private',
            ]);
        });
    }
}
