<?php
/**
 * Plugin Name: Olympic School
 * Description: Área de estudos e assistente educacional da Olympic School integrada ao Firebase.
 * Version: 0.4.0
 * Requires at least: 6.4
 * Requires PHP: 7.4
 * Author: Olympic School
 * Text Domain: olympic-school
 */

if (!defined('ABSPATH')) {
    exit;
}

define('OLYMPIC_SCHOOL_VERSION', '0.4.0');
define('OLYMPIC_SCHOOL_FILE', __FILE__);
define('OLYMPIC_SCHOOL_DIR', plugin_dir_path(__FILE__));
define('OLYMPIC_SCHOOL_URL', plugin_dir_url(__FILE__));

require_once OLYMPIC_SCHOOL_DIR . 'includes/class-olympic-school-settings.php';
require_once OLYMPIC_SCHOOL_DIR . 'includes/class-olympic-school-plugin.php';

Olympic_School_Plugin::boot();
