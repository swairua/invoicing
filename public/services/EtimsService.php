<?php
/**
 * EtimsService.php - KRA eTIMS Integration Service
 * 
 * Handles all communication with KRA's e-Tax Invoice Management System (eTIMS)
 * Features:
 *  - Secure server-to-server communication via cURL
 *  - Offline support with automatic retry
 *  - Complete audit logging
 *  - Config-based environment switching
 * 
 * All KRA API calls must originate from this class only
 * Frontend never communicates directly with KRA API
 */

class EtimsService {
    
    private $conn;
    private $config;
    
    /**
     * Initialize eTIMS Service
     * @param mysqli $conn Database connection
     * @param array $env Environment variables
     */
    public function __construct($conn, $env = []) {
        $this->conn = $conn;
        $this->config = $this->loadConfig($env);
    }
    
    /**
     * Load configuration from environment
     * @param array $env Environment variables
     * @return array Configuration array
     */
    private function loadConfig($env) {
        $environment = $env['ETIMS_ENV'] ?? 'sandbox';
        $prefix = strtoupper($environment);
        
        return [
            'enabled' => ($env['ETIMS_ENABLED'] ?? 'true') === 'true',
            'environment' => $environment,
            'url' => $env["ETIMS_{$prefix}_URL"] ?? '',
            'tin' => $env["ETIMS_{$prefix}_TIN"] ?? '',
            'bhf_id' => $env["ETIMS_{$prefix}_BHF_ID"] ?? '001',
            'vscu_id' => $env["ETIMS_{$prefix}_VSCU_ID"] ?? '001',
            'api_key' => $env["ETIMS_{$prefix}_API_KEY"] ?? '',
            'max_retries' => (int)($env['ETIMS_MAX_RETRIES'] ?? 5),
            'retry_delay_minutes' => (int)($env['ETIMS_RETRY_DELAY_MINUTES'] ?? 15),
            'timeout_seconds' => (int)($env['ETIMS_REQUEST_TIMEOUT_SECONDS'] ?? 30),
            'auto_retry' => ($env['ETIMS_AUTO_RETRY'] ?? 'true') === 'true'
        ];
    }
    
    /**
     * MAIN SUBMISSION ENDPOINT
     * Submit a sale/invoice to KRA eTIMS
     * 
     * @param int $invoice_id Invoice ID
     * @param string $company_id Company ID
     * @param array $sale_data Sale data to submit
     * @param string $user_id User ID (for audit)
     * @return array Result with status, cu_invoice_number, receipt_number, qr_code
     */
    public function submitSale($invoice_id, $company_id, $sale_data, $user_id = null) {
        // Validate configuration
        if (!$this->config['enabled']) {
            return $this->error('eTIMS integration is disabled', 'ETIMS_DISABLED');
        }
        
        if (!$this->validateConfig()) {
            return $this->error('eTIMS configuration incomplete', 'CONFIG_INVALID');
        }
        
        // Check if already synced
        $existingSync = $this->getEtimsStatus($invoice_id, $company_id);
        if ($existingSync && $existingSync['status'] === 'SYNCED') {
            return $this->error('Invoice already synced to eTIMS', 'ALREADY_SYNCED');
        }
        
        // Validate sale data
        $validation = $this->validateSaleData($sale_data);
        if (!$validation['valid']) {
            return $this->error($validation['message'], 'VALIDATION_FAILED');
        }
        
        // Format payload for KRA
        $kra_payload = $this->formatKRAPayload($sale_data);
        
        try {
            // Create or update etims_sales record with SUBMITTED status
            $etims_sale_id = $this->createOrUpdateEtimsRecord($invoice_id, $company_id, $kra_payload, 'SUBMITTED', $user_id);
            
            // Send to KRA
            $kra_response = $this->sendToKRA($kra_payload);
            
            // Log the request
            $this->logSync($company_id, $etims_sale_id, 'submit', 'completed', 'Sale submitted to KRA', $kra_payload, $kra_response);
            
            // Process response
            if ($kra_response['success']) {
                // Success - update record with SYNCED status and KRA response
                $this->updateEtimsRecord($etims_sale_id, [
                    'status' => 'SYNCED',
                    'cu_invoice_number' => $kra_response['cu_invoice_number'],
                    'receipt_number' => $kra_response['receipt_number'],
                    'qr_code' => $kra_response['qr_code'],
                    'error_message' => null,
                    'error_code' => null,
                    'http_status_code' => $kra_response['http_code']
                ]);
                
                // Mark invoice as synced
                $this->conn->query("UPDATE invoices SET etims_synced = 1 WHERE id = $invoice_id");
                
                // Store response in etims_responses table
                $this->storeResponse($etims_sale_id, $kra_response);
                
                return [
                    'success' => true,
                    'status' => 'SYNCED',
                    'cu_invoice_number' => $kra_response['cu_invoice_number'],
                    'receipt_number' => $kra_response['receipt_number'],
                    'qr_code' => $kra_response['qr_code'],
                    'message' => 'Invoice successfully synced to eTIMS'
                ];
            } else {
                // Failure - mark as FAILED and schedule retry
                $next_retry = $this->calculateNextRetry();
                $this->updateEtimsRecord($etims_sale_id, [
                    'status' => 'FAILED',
                    'error_message' => $kra_response['error_message'],
                    'error_code' => $kra_response['error_code'],
                    'http_status_code' => $kra_response['http_code'],
                    'next_retry_at' => $next_retry,
                    'retry_reason' => $kra_response['error_message']
                ]);
                
                // Store failed response
                $this->storeResponse($etims_sale_id, $kra_response);
                
                return [
                    'success' => false,
                    'status' => 'FAILED',
                    'error_code' => $kra_response['error_code'],
                    'error_message' => $kra_response['error_message'],
                    'next_retry_at' => $next_retry,
                    'message' => 'Failed to sync with eTIMS. Will retry automatically.'
                ];
            }
        } catch (Exception $e) {
            $this->logSync($company_id, $etims_sale_id ?? null, 'submit', 'error', $e->getMessage(), null, null, $e->getTraceAsString());
            return $this->error('Exception during submission: ' . $e->getMessage(), 'EXCEPTION');
        }
    }
    
    /**
     * RETRY MECHANISM
     * Automatically retry failed submissions
     * Called by cron job or manual trigger
     * 
     * @param string $company_id Optional - limit to specific company
     * @param int $limit Maximum number of submissions to retry
     * @return array Summary of retry results
     */
    public function retryFailedSubmissions($company_id = null, $limit = 10) {
        // Find submissions that are due for retry
        $query = "
            SELECT es.id, es.invoice_id, es.company_id, es.sale_payload, es.submission_count
            FROM etims_sales es
            WHERE es.status = 'FAILED'
              AND es.next_retry_at IS NOT NULL
              AND es.next_retry_at <= NOW()
              AND es.submission_count < " . $this->config['max_retries'];
        
        if ($company_id) {
            $query .= " AND es.company_id = '$company_id'";
        }
        
        $query .= " ORDER BY es.next_retry_at ASC LIMIT $limit";
        
        $result = $this->conn->query($query);
        $retried = [];
        $failed = [];
        
        while ($row = $result->fetch_assoc()) {
            $etims_id = $row['id'];
            $invoice_id = $row['invoice_id'];
            $company_id = $row['company_id'];
            $sale_payload = json_decode($row['sale_payload'], true);
            $submission_count = $row['submission_count'];
            
            // Increment submission count
            $submission_count++;
            $this->conn->query("
                UPDATE etims_sales 
                SET submission_count = $submission_count,
                    status = 'RETRYING',
                    last_submission_at = NOW()
                WHERE id = '$etims_id'
            ");
            
            // Send to KRA
            $kra_response = $this->sendToKRA($sale_payload);
            
            if ($kra_response['success']) {
                // Success
                $this->updateEtimsRecord($etims_id, [
                    'status' => 'SYNCED',
                    'cu_invoice_number' => $kra_response['cu_invoice_number'],
                    'receipt_number' => $kra_response['receipt_number'],
                    'qr_code' => $kra_response['qr_code'],
                    'error_message' => null,
                    'error_code' => null,
                    'http_status_code' => $kra_response['http_code'],
                    'submission_count' => $submission_count
                ]);
                
                $this->conn->query("UPDATE invoices SET etims_synced = 1 WHERE id = $invoice_id");
                $this->storeResponse($etims_id, $kra_response);
                $this->logSync($company_id, $etims_id, 'retry', 'completed', 'Retry successful after ' . $submission_count . ' attempts');
                
                $retried[] = ['id' => $etims_id, 'status' => 'SYNCED'];
            } else {
                // Still failing
                if ($submission_count >= $this->config['max_retries']) {
                    // Max retries reached - give up
                    $this->updateEtimsRecord($etims_id, [
                        'status' => 'FAILED',
                        'error_message' => 'Max retries (' . $this->config['max_retries'] . ') reached: ' . $kra_response['error_message'],
                        'error_code' => 'MAX_RETRIES_EXCEEDED',
                        'http_status_code' => $kra_response['http_code'],
                        'next_retry_at' => null,
                        'submission_count' => $submission_count
                    ]);
                    
                    $this->logSync($company_id, $etims_id, 'retry', 'error', 'Max retries reached, giving up', null, $kra_response);
                    $failed[] = ['id' => $etims_id, 'error' => 'Max retries exceeded', 'attempts' => $submission_count];
                } else {
                    // Schedule next retry
                    $next_retry = $this->calculateNextRetry();
                    $this->updateEtimsRecord($etims_id, [
                        'status' => 'FAILED',
                        'error_message' => $kra_response['error_message'],
                        'error_code' => $kra_response['error_code'],
                        'http_status_code' => $kra_response['http_code'],
                        'next_retry_at' => $next_retry,
                        'submission_count' => $submission_count,
                        'retry_reason' => 'Automatic retry attempt ' . $submission_count . ': ' . $kra_response['error_message']
                    ]);
                    
                    $this->logSync($company_id, $etims_id, 'retry', 'error', 'Retry attempt ' . $submission_count . ' failed, next retry scheduled', null, $kra_response);
                    $failed[] = ['id' => $etims_id, 'error' => $kra_response['error_message'], 'next_retry' => $next_retry];
                }
            }
            
            $this->storeResponse($etims_id, $kra_response);
        }
        
        return [
            'success' => count($failed) === 0,
            'total_processed' => count($retried) + count($failed),
            'successful' => $retried,
            'failed' => $failed
        ];
    }
    
    /**
     * CORE: Send data to KRA via cURL
     * Server-to-server HTTPS communication
     * 
     * @param array $payload Sale data formatted for KRA
     * @return array Response with success flag and parsed data
     */
    private function sendToKRA($payload) {
        // Prepare URL and headers
        $url = $this->config['url'];
        $api_key = $this->config['api_key'];
        
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $api_key,
            'X-Client-ID: MedPHP',
            'X-Request-ID: ' . uniqid()
        ];
        
        // Initialize cURL
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->config['timeout_seconds']);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        
        // Execute
        $start_time = microtime(true);
        $response_body = curl_exec($ch);
        $duration_ms = round((microtime(true) - $start_time) * 1000);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);
        
        // Handle cURL errors
        if ($curl_error) {
            return [
                'success' => false,
                'http_code' => 0,
                'error_code' => 'CURL_ERROR',
                'error_message' => 'Connection error: ' . $curl_error,
                'response_body' => null,
                'duration_ms' => $duration_ms
            ];
        }
        
        // Parse response
        $response_data = json_decode($response_body, true);
        
        // Determine success
        $is_success = ($http_code === 200 || $http_code === 201) && $response_data && isset($response_data['status']);
        
        return [
            'success' => $is_success,
            'http_code' => $http_code,
            'response_body' => $response_data,
            'cu_invoice_number' => $response_data['cu_invoice_number'] ?? null,
            'receipt_number' => $response_data['receipt_number'] ?? null,
            'qr_code' => $response_data['qr_code'] ?? null,
            'error_code' => !$is_success ? ($response_data['error_code'] ?? 'UNKNOWN_ERROR') : null,
            'error_message' => !$is_success ? ($response_data['message'] ?? 'Unknown error from KRA API') : null,
            'duration_ms' => $duration_ms
        ];
    }
    
    /**
     * Format data into KRA-expected payload structure
     * @param array $sale_data Sale data from system
     * @return array KRA-formatted payload
     */
    private function formatKRAPayload($sale_data) {
        return [
            'tin' => $this->config['tin'],
            'bhf_id' => $this->config['bhf_id'],
            'vscu_id' => $this->config['vscu_id'],
            'invoice_number' => $sale_data['invoice_number'] ?? '',
            'invoice_date' => $sale_data['invoice_date'] ?? date('Y-m-d'),
            'customer_name' => $sale_data['customer_name'] ?? '',
            'customer_id' => $sale_data['customer_id'] ?? '',
            'customer_pin' => $sale_data['customer_pin'] ?? '',
            'items' => $sale_data['items'] ?? [],
            'subtotal' => $sale_data['subtotal'] ?? 0,
            'tax_amount' => $sale_data['tax_amount'] ?? 0,
            'total_amount' => $sale_data['total_amount'] ?? 0,
            'currency' => $sale_data['currency'] ?? 'KES',
            'payment_method' => $sale_data['payment_method'] ?? 'CASH'
        ];
    }
    
    /**
     * Validate sale data before submission
     * @param array $sale_data Data to validate
     * @return array Validation result with 'valid' flag and 'message'
     */
    private function validateSaleData($sale_data) {
        if (empty($sale_data['invoice_number'])) {
            return ['valid' => false, 'message' => 'Invoice number is required'];
        }
        if (empty($sale_data['customer_name'])) {
            return ['valid' => false, 'message' => 'Customer name is required'];
        }
        if (empty($sale_data['items']) || !is_array($sale_data['items'])) {
            return ['valid' => false, 'message' => 'Items list is required and must be an array'];
        }
        if (!isset($sale_data['total_amount']) || $sale_data['total_amount'] <= 0) {
            return ['valid' => false, 'message' => 'Total amount must be greater than 0'];
        }
        return ['valid' => true, 'message' => 'Validation passed'];
    }
    
    /**
     * Check configuration validity
     * @return bool True if all required config is present
     */
    private function validateConfig() {
        return !empty($this->config['url']) 
            && !empty($this->config['tin']) 
            && !empty($this->config['api_key']);
    }
    
    /**
     * Get eTIMS status for an invoice
     * @param int $invoice_id Invoice ID
     * @param string $company_id Company ID
     * @return array eTIMS record or null
     */
    public function getEtimsStatus($invoice_id, $company_id) {
        $result = $this->conn->query("
            SELECT * FROM etims_sales 
            WHERE invoice_id = $invoice_id AND company_id = '$company_id'
            LIMIT 1
        ");
        return $result ? $result->fetch_assoc() : null;
    }
    
    /**
     * Create or update eTIMS record
     */
    private function createOrUpdateEtimsRecord($invoice_id, $company_id, $payload, $status, $user_id = null) {
        $existing = $this->getEtimsStatus($invoice_id, $company_id);
        $etims_id = $existing ? $existing['id'] : bin2hex(random_bytes(18));
        $payload_json = $this->conn->real_escape_string(json_encode($payload));
        $user_id_sql = $user_id ? "'" . $this->conn->real_escape_string($user_id) . "'" : 'NULL';
        
        if ($existing) {
            $this->conn->query("
                UPDATE etims_sales SET 
                    status = '$status',
                    sale_payload = '$payload_json',
                    last_submission_at = NOW(),
                    submission_count = submission_count + 1
                WHERE id = '$etims_id'
            ");
        } else {
            $this->conn->query("
                INSERT INTO etims_sales 
                    (id, company_id, invoice_id, status, sale_payload, created_by, submission_count, last_submission_at)
                VALUES 
                    ('$etims_id', '$company_id', $invoice_id, '$status', '$payload_json', $user_id_sql, 1, NOW())
            ");
        }
        
        return $etims_id;
    }
    
    /**
     * Update eTIMS record with response data
     */
    private function updateEtimsRecord($etims_id, $updates) {
        $set_clauses = [];
        foreach ($updates as $field => $value) {
            if ($value === null) {
                $set_clauses[] = "$field = NULL";
            } elseif (is_numeric($value)) {
                $set_clauses[] = "$field = $value";
            } else {
                $value = $this->conn->real_escape_string($value);
                $set_clauses[] = "$field = '$value'";
            }
        }
        
        $sql = "UPDATE etims_sales SET " . implode(', ', $set_clauses) . " WHERE id = '$etims_id'";
        $this->conn->query($sql);
    }
    
    /**
     * Store response record
     */
    private function storeResponse($etims_sale_id, $kra_response) {
        $response_id = bin2hex(random_bytes(18));
        $response_body = $this->conn->real_escape_string(json_encode($kra_response['response_body'] ?? []));
        $http_code = (int)$kra_response['http_code'];
        $status = $kra_response['success'] ? 'SUCCESS' : 'FAILED';
        
        $this->conn->query("
            INSERT INTO etims_responses 
                (id, etims_sale_id, http_status_code, response_body, status, response_time_ms)
            VALUES 
                ('$response_id', '$etims_sale_id', $http_code, '$response_body', '$status', " . (int)($kra_response['duration_ms'] ?? 0) . ")
        ");
    }
    
    /**
     * Log eTIMS operation for audit trail
     */
    private function logSync($company_id, $etims_sale_id, $action, $status, $message, $request_payload = null, $response_payload = null, $error_stack = null) {
        $log_id = bin2hex(random_bytes(18));
        $company_id = $this->conn->real_escape_string($company_id);
        $etims_sale_id = $etims_sale_id ? "'" . $this->conn->real_escape_string($etims_sale_id) . "'" : 'NULL';
        $action = $this->conn->real_escape_string($action);
        $status = $this->conn->real_escape_string($status);
        $message = $this->conn->real_escape_string($message);
        
        $request_json = $request_payload ? "'" . $this->conn->real_escape_string(json_encode($request_payload)) . "'" : 'NULL';
        $response_json = $response_payload ? "'" . $this->conn->real_escape_string(json_encode($response_payload)) . "'" : 'NULL';
        $error_stack = $error_stack ? "'" . $this->conn->real_escape_string($error_stack) . "'" : 'NULL';
        
        $this->conn->query("
            INSERT INTO etims_sync_logs 
                (id, company_id, etims_sale_id, action, action_status, log_message, environment, log_level, request_payload, response_payload, error_stack)
            VALUES 
                ('$log_id', '$company_id', $etims_sale_id, '$action', '$status', '$message', '{$this->config['environment']}', 'INFO', $request_json, $response_json, $error_stack)
        ");
    }
    
    /**
     * Calculate next retry time based on delay config
     */
    private function calculateNextRetry() {
        $delay_minutes = $this->config['retry_delay_minutes'];
        return date('Y-m-d H:i:s', time() + ($delay_minutes * 60));
    }
    
    /**
     * Helper function to return error response
     */
    private function error($message, $code) {
        return [
            'success' => false,
            'error_code' => $code,
            'error_message' => $message,
            'message' => $message
        ];
    }
    
    /**
     * Get configuration status (for diagnostics)
     */
    public function getStatus() {
        return [
            'enabled' => $this->config['enabled'],
            'environment' => $this->config['environment'],
            'configured' => $this->validateConfig(),
            'config_keys' => [
                'url' => !empty($this->config['url']),
                'tin' => !empty($this->config['tin']),
                'api_key' => !empty($this->config['api_key']),
                'bhf_id' => !empty($this->config['bhf_id']),
                'vscu_id' => !empty($this->config['vscu_id'])
            ]
        ];
    }
}
?>
