<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Olympic_School_Plugin
{
    private const SHORTCODE_VIEWS = [
        'olympic_school_login' => 'dashboard',
        'olympic_school_dashboard' => 'dashboard',
        'olympic_school_diagnostic' => 'diagnostic',
        'olympic_school_training' => 'training',
        'olympic_school_progress' => 'progress',
        'olympic_school_plans' => 'plans',
        'olympic_school_notebooks' => 'notebooks',
        'olympic_school_artifacts' => 'artifacts',
        'olympic_school_assistant' => 'assistant',
        'olympic_school_teacher' => 'teacher',
    ];

    private const ALLOWED_VIEWS = [
        'dashboard',
        'diagnostic',
        'training',
        'progress',
        'plans',
        'notebooks',
        'artifacts',
        'assistant',
        'teacher',
    ];

    public static function boot(): void
    {
        add_action('admin_init', [Olympic_School_Settings::class, 'register']);
        add_action('admin_menu', [Olympic_School_Settings::class, 'add_menu']);
        add_action('wp_enqueue_scripts', [self::class, 'register_assets']);
        add_filter('script_loader_tag', [self::class, 'mark_script_as_module'], 10, 3);
        add_shortcode('olympic_school_app', [self::class, 'render_app']);
        foreach (array_keys(self::SHORTCODE_VIEWS) as $shortcode) {
            add_shortcode($shortcode, [self::class, 'render_app']);
        }
    }

    public static function register_assets(): void
    {
        $script_path = OLYMPIC_SCHOOL_DIR . 'src/main.js';
        $style_path = OLYMPIC_SCHOOL_DIR . 'src/styles.css';

        if (file_exists($script_path)) {
            wp_register_script(
                'olympic-school-app',
                OLYMPIC_SCHOOL_URL . 'src/main.js',
                [],
                (string) filemtime($script_path),
                true
            );
        }

        if (file_exists($style_path)) {
            wp_register_style(
                'olympic-school-app',
                OLYMPIC_SCHOOL_URL . 'src/styles.css',
                [],
                (string) filemtime($style_path)
            );
        }
    }

    public static function mark_script_as_module(string $tag, string $handle, string $src): string
    {
        if ('olympic-school-app' !== $handle) {
            return $tag;
        }

        return sprintf(
            '<script type="module" src="%s" id="%s-js"></script>',
            esc_url($src),
            esc_attr($handle)
        );
    }

    public static function render_app(array $attributes = [], ?string $content = null, string $tag = 'olympic_school_app'): string
    {
        wp_enqueue_script('olympic-school-app');
        wp_enqueue_style('olympic-school-app');

        $attributes = shortcode_atts(
            [
                'view' => 'dashboard',
                'navigation' => 'yes',
            ],
            $attributes,
            $tag
        );
        $requested_view = self::SHORTCODE_VIEWS[$tag] ?? sanitize_key($attributes['view']);
        $view = in_array($requested_view, self::ALLOWED_VIEWS, true) ? $requested_view : 'dashboard';
        $navigation = !in_array(strtolower((string) $attributes['navigation']), ['no', 'false', '0'], true);

        $runtime = [
            'config' => Olympic_School_Settings::get_public_config(),
            'settingsUrl' => current_user_can('manage_options')
                ? admin_url('options-general.php?page=olympic-school')
                : '',
        ];

        $runtime_json = wp_json_encode(
            $runtime,
            JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
        );

        return sprintf(
            '<div data-olympic-school-root><script type="application/json" data-olympic-school-settings>%1$s</script><div class="os-app" data-olympic-school-app data-os-view="%2$s" data-os-navigation="%3$s" aria-live="polite"><noscript>Ative o JavaScript para usar o Olympic School.</noscript></div></div>',
            $runtime_json,
            esc_attr($view),
            $navigation ? 'true' : 'false'
        );
    }
}
