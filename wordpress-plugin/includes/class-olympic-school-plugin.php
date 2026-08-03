<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Olympic_School_Plugin
{
    public static function boot(): void
    {
        add_action('admin_init', [Olympic_School_Settings::class, 'register']);
        add_action('admin_menu', [Olympic_School_Settings::class, 'add_menu']);
        add_action('wp_enqueue_scripts', [self::class, 'register_assets']);
        add_filter('script_loader_tag', [self::class, 'mark_script_as_module'], 10, 3);
        add_shortcode('olympic_school_app', [self::class, 'render_app']);
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

    public static function render_app(): string
    {
        wp_enqueue_script('olympic-school-app');
        wp_enqueue_style('olympic-school-app');

        $runtime = [
            'config' => Olympic_School_Settings::get_public_config(),
            'settingsUrl' => current_user_can('manage_options')
                ? admin_url('options-general.php?page=olympic-school')
                : '',
        ];

        wp_add_inline_script(
            'olympic-school-app',
            'window.OlympicSchoolSettings = ' . wp_json_encode($runtime) . ';',
            'before'
        );

        return '<div class="os-app" data-olympic-school-app><noscript>Ative o JavaScript para usar o Olympic School.</noscript></div>';
    }
}
