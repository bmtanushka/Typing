<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Config;
use App\Core\Request;
use App\Core\Response;
use App\Core\View;

final class PageController
{
    /** Sections not built yet: path => [title, phase, blurb]. */
    public const PLACEHOLDERS = [
        '/lessons'  => ['Lessons', 2, 'Step-by-step lessons from the home row to symbols.'],
        '/practice' => ['Practice', 5, 'Problem-key drills and free practice with your own text.'],
        '/test'     => ['Typing test', 5, 'One, three and five minute tests with a history chart.'],
        '/games'    => ['Games', 6, 'Key Drops, Balloon Pop and more – using only the keys you know.'],
        '/progress' => ['Your progress', 4, 'Charts, problem-key heatmap, streaks and badges.'],
        '/badges'   => ['Badges', 3, 'Earn badges for milestones, streaks and accuracy.'],
        '/settings' => ['Settings', 3, 'Keyboard layout, sound, theme, font size and more.'],
        '/login'    => ['Log in', 4, 'Save your progress on any device with a free account.'],
        '/register' => ['Create an account', 4, 'A free account keeps your progress safe on any device.'],
        '/help'     => ['Help and technique', 7, 'Posture, home position and tips for touch typing.'],
        '/privacy'  => ['Privacy', 7, 'What we store, why, and how to delete it.'],
    ];

    public function home(Request $request): Response
    {
        return Response::html(View::page('pages/home', [
            'title' => 'Learn to touch type',
            'description' => 'Learn to touch type with friendly step-by-step lessons, games and tests. Free, no account needed.',
            'bodyClass' => 'page-home',
        ]));
    }

    public function styleguide(Request $request): Response
    {
        if (!Config::isDev()) {
            return $this->notFound($request);
        }
        return Response::html(View::page('pages/styleguide', [
            'title' => 'Style guide',
            'bodyClass' => 'page-styleguide',
            'pageScript' => 'js/pages/styleguide.js',
            'noindex' => true,
        ]));
    }

    public function placeholder(Request $request): Response
    {
        [$title, $phase, $blurb] = self::PLACEHOLDERS[$request->path];
        return Response::html(View::page('pages/placeholder', [
            'title' => $title,
            'phase' => $phase,
            'blurb' => $blurb,
        ]));
    }

    public function notFound(Request $request): Response
    {
        return Response::html(View::page('errors/404', [
            'title' => 'Page not found',
            'noindex' => true,
        ]), 404);
    }
}
