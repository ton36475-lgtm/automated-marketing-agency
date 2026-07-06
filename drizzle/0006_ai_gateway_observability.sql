-- AI Gateway Observability Tables

-- Core request logging
CREATE TABLE llm_requests (
  id VARCHAR(36) PRIMARY KEY,
  request_id VARCHAR(50) UNIQUE NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  model VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  agent_name VARCHAR(100),
  function_name VARCHAR(100),
  task_id VARCHAR(36),
  batch_id VARCHAR(36),
  
  -- Request details
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  total_tokens INT NOT NULL,
  
  -- Performance
  latency_ms INT NOT NULL,
  
  -- Cost
  cost_usd DECIMAL(10, 6) NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  fallback_used BOOLEAN DEFAULT FALSE,
  fallback_reason TEXT,
  error_message TEXT,
  
  -- Metadata
  user_id VARCHAR(36),
  metadata JSON,
  
  INDEX idx_timestamp (timestamp),
  INDEX idx_model (model),
  INDEX idx_provider (provider),
  INDEX idx_agent (agent_name),
  INDEX idx_task (task_id),
  INDEX idx_status (status)
);

-- Model comparison tracking
CREATE TABLE llm_model_comparisons (
  id VARCHAR(36) PRIMARY KEY,
  task_id VARCHAR(36) NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  model_1 VARCHAR(50),
  model_1_tokens INT,
  model_1_cost DECIMAL(10, 6),
  model_1_latency INT,
  
  model_2 VARCHAR(50),
  model_2_tokens INT,
  model_2_cost DECIMAL(10, 6),
  model_2_latency INT,
  
  model_3 VARCHAR(50),
  model_3_tokens INT,
  model_3_cost DECIMAL(10, 6),
  model_3_latency INT,
  
  winner VARCHAR(50),
  analysis JSON,
  
  INDEX idx_timestamp (timestamp),
  INDEX idx_task (task_id)
);

-- Daily cost tracking
CREATE TABLE llm_cost_tracking (
  id VARCHAR(36) PRIMARY KEY,
  date DATE NOT NULL,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  
  request_count INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  
  avg_latency_ms INT,
  success_rate DECIMAL(5, 2),
  
  UNIQUE KEY unique_date_provider_model (date, provider, model),
  INDEX idx_date (date),
  INDEX idx_provider (provider)
);

-- Fallback tracking
CREATE TABLE llm_fallback_events (
  id VARCHAR(36) PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  request_id VARCHAR(50),
  
  primary_model VARCHAR(50) NOT NULL,
  primary_provider VARCHAR(50) NOT NULL,
  primary_error VARCHAR(255),
  
  fallback_model VARCHAR(50) NOT NULL,
  fallback_provider VARCHAR(50) NOT NULL,
  fallback_success BOOLEAN NOT NULL,
  
  INDEX idx_timestamp (timestamp),
  INDEX idx_primary_provider (primary_provider),
  INDEX idx_fallback_provider (fallback_provider)
);

-- Cache statistics
CREATE TABLE llm_cache_stats (
  id VARCHAR(36) PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  cache_hits INT DEFAULT 0,
  cache_misses INT DEFAULT 0,
  cache_hit_rate DECIMAL(5, 2),
  
  tokens_saved INT DEFAULT 0,
  cost_saved DECIMAL(10, 2) DEFAULT 0,
  
  INDEX idx_timestamp (timestamp)
);
