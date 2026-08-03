<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Olympic_School_Settings
{
    public const OPTION_NAME = 'olympic_school_settings';

    private const FIELDS = [
        'apiKey' => 'Firebase API Key',
        'authDomain' => 'Firebase Auth Domain',
        'projectId' => 'Firebase Project ID',
        'storageBucket' => 'Firebase Storage Bucket',
        'messagingSenderId' => 'Firebase Messaging Sender ID',
        'appId' => 'Firebase App ID',
        'measurementId' => 'Firebase Measurement ID',
        'databaseId' => 'Firestore Database ID',
        'recaptchaSiteKey' => 'reCAPTCHA Enterprise Site Key',
        'geminiModel' => 'Modelo Gemini',
    ];

    public static function register(): void
    {
        register_setting(
            'olympic_school',
            self::OPTION_NAME,
            [
                'type' => 'array',
                'sanitize_callback' => [self::class, 'sanitize'],
                'default' => self::defaults(),
            ]
        );

        add_settings_section(
            'olympic_school_firebase',
            'Conexão com o Firebase',
            [self::class, 'render_section'],
            'olympic-school'
        );

        foreach (self::FIELDS as $key => $label) {
            add_settings_field(
                'olympic_school_' . $key,
                $label,
                [self::class, 'render_field'],
                'olympic-school',
                'olympic_school_firebase',
                ['key' => $key]
            );
        }
    }

    public static function add_menu(): void
    {
        add_options_page(
            'Olympic School',
            'Olympic School',
            'manage_options',
            'olympic-school',
            [self::class, 'render_page']
        );
    }

    public static function defaults(): array
    {
        return [
            'apiKey' => '',
            'authDomain' => '',
            'projectId' => '',
            'storageBucket' => '',
            'messagingSenderId' => '',
            'appId' => '',
            'measurementId' => '',
            'databaseId' => 'biodoraia',
            'recaptchaSiteKey' => '',
            'geminiModel' => 'gemini-3.6-flash',
        ];
    }

    public static function get_public_config(): array
    {
        $saved = get_option(self::OPTION_NAME, []);
        return array_merge(self::defaults(), is_array($saved) ? $saved : []);
    }

    public static function sanitize($input): array
    {
        $clean = self::defaults();
        if (!is_array($input)) {
            return $clean;
        }

        foreach (array_keys(self::FIELDS) as $key) {
            if (isset($input[$key])) {
                $clean[$key] = sanitize_text_field(wp_unslash($input[$key]));
            }
        }

        return $clean;
    }

    public static function render_section(): void
    {
        echo '<p>Copie os identificadores públicos do aplicativo Web “Olympic School Web”. O nome visível do projeto pode ser Olympic School enquanto o Project ID permanece <code>biodoraia</code>. Não informe senhas, tokens pessoais ou chaves de conta de serviço.</p>';
    }

    public static function render_field(array $args): void
    {
        $key = $args['key'];
        $values = self::get_public_config();
        printf(
            '<input class="regular-text" type="text" name="%1$s[%2$s]" value="%3$s" autocomplete="off">',
            esc_attr(self::OPTION_NAME),
            esc_attr($key),
            esc_attr($values[$key] ?? '')
        );
    }

    public static function render_page(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }
        ?>
        <div class="wrap">
            <h1>Olympic School</h1>
            <p>Configure o Firebase e adicione o shortcode <code>[olympic_school_app]</code> a uma página.</p>
            <form action="options.php" method="post">
                <?php
                settings_fields('olympic_school');
                do_settings_sections('olympic-school');
                submit_button('Salvar configuração');
                ?>
            </form>
        </div>
        <?php
    }
}
