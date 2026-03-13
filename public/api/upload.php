<?php
// ============================================
// PROSPERUS CLUB — FILE UPLOAD ENDPOINT
// ============================================
// POST /api/upload.php
// Auth: Supabase JWT (validates via Supabase REST API)
// Storage: /var/www/pdf/uploads/{year}/{month}/{filename}
// Response: { success: true, url: "https://prosperusclub.com.br/pdf/uploads/..." }

// --- CORS ---
$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://prosperusclub.com.br',
    'https://www.prosperusclub.com.br'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// --- CONFIGURATION ---
$SUPABASE_URL = 'https://ptvsctwwonvirdwprugv.supabase.co';
$UPLOAD_BASE_DIR = '/var/www/pdf/uploads';
$PUBLIC_BASE_URL = 'https://prosperusclub.com.br/pdf/uploads';
$MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

$ALLOWED_TYPES = [
    'image/jpeg'      => 'jpg',
    'image/png'       => 'png',
    'image/webp'      => 'webp',
    'image/gif'       => 'gif',
    'application/pdf' => 'pdf',
];

// --- AUTH: Validate Supabase JWT ---
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Token de autenticação ausente']);
    exit;
}

$token = $matches[1];

// Validate token by calling Supabase auth endpoint
$ch = curl_init("$SUPABASE_URL/auth/v1/user");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $token",
        "apikey: $token",
    ],
    CURLOPT_TIMEOUT => 5,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Token inválido ou expirado']);
    exit;
}

$user = json_decode($response, true);
if (!isset($user['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Usuário não identificado']);
    exit;
}

// Optional: check role (only ADMIN or TEAM can upload)
$role = $user['user_metadata']['role'] ?? $user['app_metadata']['role'] ?? null;
// Uncomment the lines below to enforce role check:
// if (!in_array($role, ['ADMIN', 'TEAM'])) {
//     http_response_code(403);
//     echo json_encode(['success' => false, 'error' => 'Sem permissão para upload']);
//     exit;
// }

// --- VALIDATE FILE ---
if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Nenhum arquivo enviado']);
    exit;
}

$file = $_FILES['file'];

// Check for upload errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    $errors = [
        UPLOAD_ERR_INI_SIZE   => 'Arquivo excede o tamanho máximo do servidor',
        UPLOAD_ERR_FORM_SIZE  => 'Arquivo excede o tamanho máximo do formulário',
        UPLOAD_ERR_PARTIAL    => 'Upload incompleto',
        UPLOAD_ERR_NO_FILE    => 'Nenhum arquivo enviado',
        UPLOAD_ERR_NO_TMP_DIR => 'Erro de configuração do servidor',
        UPLOAD_ERR_CANT_WRITE => 'Erro ao gravar arquivo',
    ];
    $msg = $errors[$file['error']] ?? 'Erro desconhecido no upload';
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
}

// Check size
if ($file['size'] > $MAX_FILE_SIZE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Arquivo excede 10MB']);
    exit;
}

// Check MIME type
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!isset($ALLOWED_TYPES[$mimeType])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => "Tipo de arquivo não permitido: $mimeType. Permitidos: JPG, PNG, WebP, GIF, PDF"
    ]);
    exit;
}

$extension = $ALLOWED_TYPES[$mimeType];

// --- SAVE FILE ---
$year = date('Y');
$month = date('m');
$targetDir = "$UPLOAD_BASE_DIR/$year/$month";

// Create directory if needed
if (!is_dir($targetDir)) {
    if (!mkdir($targetDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erro ao criar diretório de upload']);
        exit;
    }
}

// Generate unique filename
$uniqueName = bin2hex(random_bytes(12)) . '.' . $extension;
$targetPath = "$targetDir/$uniqueName";

// Move file
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro ao salvar arquivo']);
    exit;
}

// Build public URL
$publicUrl = "$PUBLIC_BASE_URL/$year/$month/$uniqueName";

// --- RESPONSE ---
echo json_encode([
    'success'   => true,
    'url'       => $publicUrl,
    'filename'  => $uniqueName,
    'original'  => $file['name'],
    'size'      => $file['size'],
    'mime'      => $mimeType,
    'extension' => $extension,
]);
