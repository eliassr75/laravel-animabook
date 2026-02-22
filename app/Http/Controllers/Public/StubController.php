<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class StubController extends Controller
{
    public function __invoke(string $title, ?string $description = null): Response
    {
        return Inertia::render('StubPage', [
            'title' => $title,
            'description' => $description,
        ]);
    }
}
