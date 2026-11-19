<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Config;
use App\Core\Request;
use App\Core\Response;
use App\Core\View;
use App\Services\LessonRepository;

final class PageController
{
    /** Sections not built yet: path => [title, phase, blurb]. */
    public const PLACEHOLDERS = [
        '/practice' => ['Practice', 5, 'Problem-key drills and free practice with your own text.'],
        '/test'     => ['Typing test', 5, 'One, three and five minute tests with a history chart.'],
        '/games'    => ['Games', 6, 'Key Drops, Balloon Pop and more – using only the keys you know.'],
        '/progress' => ['Your progress', 4, 'Charts, problem-key heatmap, streaks and badges.'],
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

    public function demo(Request $request): Response
    {
        return Response::html(View::page('pages/demo', [
            'title' => 'Typing playground',
            'description' => 'Try the typing engine with the on-screen keyboard and hands guide.',
            'bodyClass' => 'page-demo',
            'pageScript' => 'js/pages/demo.js',
            'pageStyles' => ['css/typing.css'],
        ]));
    }

    public function lessons(Request $request): Response
    {
        return Response::html(View::page('pages/lessons', [
            'title' => 'Lessons',
            'description' => 'Step-by-step touch-typing lessons, from the home row upwards.',
            'bodyClass' => 'page-lessons',
            'pageScript' => 'js/pages/lessons.js',
            'pageStyles' => ['css/lessons.css'],
            'course' => (new LessonRepository())->index(),
        ]));
    }

    public function lesson(Request $request, array $params): Response
    {
        $repo = new LessonRepository();
        $lesson = $repo->lesson($params['id']);
        if ($lesson === null) {
            return $this->notFound($request);
        }
        $unitTitle = '';
        foreach ($repo->index()['units'] as $u) {
            if ($u['id'] === $lesson['unit']) {
                $unitTitle = $u['title'];
            }
        }
        return Response::html(View::page('pages/lesson', [
            'title' => $lesson['title'],
            'description' => $lesson['intro']['text'] ?? '',
            'bodyClass' => 'page-lesson',
            'pageScript' => 'js/pages/lesson.js',
            'pageStyles' => ['css/typing.css', 'css/lessons.css'],
            'lesson' => $lesson,
            'unitTitle' => $unitTitle,
        ]));
    }

    public function badges(Request $request): Response
    {
        $defs = json_decode((string) file_get_contents(KQ_ROOT . '/content/badges.json'), true, 16, JSON_THROW_ON_ERROR);
        return Response::html(View::page('pages/badges', [
            'title' => 'Badges',
            'description' => 'Badges you can earn for milestones, streaks, speed and accuracy.',
            'bodyClass' => 'page-badges',
            'pageScript' => 'js/pages/badges.js',
            'pageStyles' => ['css/progress.css'],
            'badges' => $defs['badges'],
        ]));
    }

    public function settings(Request $request): Response
    {
        return Response::html(View::page('pages/settings', [
            'title' => 'Settings',
            'description' => 'Keyboard layout, sound, theme, text size and more.',
            'bodyClass' => 'page-settings',
            'pageScript' => 'js/pages/settings.js',
            'pageStyles' => ['css/progress.css'],
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
