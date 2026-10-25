<?php

namespace Tests\Feature;

use Tests\TestCase;

class PreventIndexingTest extends TestCase
{
    public function test_home_discourages_indexing_and_does_not_send_referrers()
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        $response->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
        $response->assertHeader('Referrer-Policy', 'no-referrer');
        $response->assertSee('<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">', false);
    }

    public function test_robots_disallows_all_paths()
    {
        $this->assertSame("User-agent: *\nDisallow: /", trim(str_replace("\r\n", "\n", file_get_contents(public_path('robots.txt')))));
    }
}
