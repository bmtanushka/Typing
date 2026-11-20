<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Config;
use App\Core\Request;
use App\Core\Response;
use App\Core\View;
use App\Services\Auth;
use App\Services\LessonRepository;

final class PageController
{
    /** Sections not built yet: path => [title, phase, blurb]. */
    public const PLACEHOLDERS = [
        '/games'    => ['Games', 6, 'Key Drops, Balloon Pop and more – using only the keys you know.'],
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

    public function practice(Request $request): Response
    {
        return Response::html(View::page('pages/practice', [
            'title' => 'Practice',
            'description' => 'Practise your problem keys, word sets or your own text.',
            'bodyClass' => 'page-practice',
            'pageScript' => 'js/pages/practice.js',
            'pageStyles' => ['css/typing.css', 'css/practice.css'],
            'mode' => in_array($request->query['mode'] ?? '', ['problem', 'words', 'own'], true) ? $request->query['mode'] : 'problem',
        ]));
    }

    public function typingTest(Request $request): Response
    {
        return Response::html(View::page('pages/test', [
            'title' => 'Typing test',
            'description' => 'Take a one, three or five minute typing test and track your speed over time.',
            'bodyClass' => 'page-test',
            'pageScript' => 'js/pages/test.js',
            'pageStyles' => ['css/typing.css', 'css/practice.css', 'css/progress.css'],
        ]));
    }

    public function placement(Request $request): Response
    {
        return Response::html(View::page('pages/placement', [
            'title' => 'Placement test',
            'description' => 'Already a confident typist? Take a one-minute test to skip ahead.',
            'bodyClass' => 'page-placement',
            'pageScript' => 'js/pages/placement.js',
            'pageStyles' => ['css/typing.css', 'css/practice.css'],
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

    public function progress(Request $request): Response
    {
        return Response::html(View::page('pages/progress', [
            'title' => 'Your progress',
            'description' => 'Your typing speed and accuracy over time, problem keys, badges and streaks.',
            'bodyClass' => 'page-progress',
            'pageScript' => 'js/pages/progress.js',
            'pageStyles' => ['css/typing.css', 'css/progress.css'],
            'course' => (new LessonRepository())->index(),
        ]));
    }

    private function authPage(string $view, string $title, array $extra = []): Response
    {
        return Response::html(View::page("pages/auth/{$view}", $extra + [
            'title' => $title,
            'bodyClass' => 'page-auth',
            'pageScript' => 'js/pages/auth.js',
            'pageStyles' => ['css/account.css'],
            'noindex' => true,
        ]));
    }

    private function safeNext(Request $request): string
    {
        $next = (string) ($request->query['next'] ?? '');
        return preg_match('#^/[A-Za-z0-9/_-]{0,100}$#', $next) && !str_starts_with($next, '//') ? $next : '/progress';
    }

    public function login(Request $request): Response
    {
        if (Auth::user()) {
            return Response::redirect(url('/account'));
        }
        return $this->authPage('login', 'Log in', ['next' => $this->safeNext($request)]);
    }

    public function register(Request $request): Response
    {
        if (Auth::user()) {
            return Response::redirect(url('/account'));
        }
        return $this->authPage('register', 'Create your free account', ['next' => $this->safeNext($request)]);
    }

    public function forgot(Request $request): Response
    {
        return $this->authPage('forgot', 'Forgotten your password?');
    }

    public function reset(Request $request): Response
    {
        $token = (string) ($request->query['token'] ?? '');
        return $this->authPage('reset', 'Choose a new password', ['token' => preg_match('/^[a-f0-9]{64}$/', $token) ? $token : '']);
    }

    public function account(Request $request): Response
    {
        $user = Auth::user();
        if (!$user) {
            return Response::redirect(url('/login') . '?next=/account');
        }
        return $this->authPage('account', 'Your account', ['user' => $user]);
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
