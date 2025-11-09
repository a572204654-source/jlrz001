-- 语音识别系统数据库表

-- 1. 语音识别日志表
CREATE TABLE IF NOT EXISTS `voice_recognition_logs` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `audio_size` INT DEFAULT 0 COMMENT '音频文件大小（字节）',
  `recognized_text` TEXT COMMENT '识别出的文字',
  `audio_time` INT DEFAULT 0 COMMENT '音频时长（毫秒）',
  `recognition_type` VARCHAR(50) DEFAULT 'realtime' COMMENT '识别类型：realtime-实时, sentence-一句话, wechat-微信',
  `options` TEXT COMMENT '识别选项（JSON格式）',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_recognition_type` (`recognition_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='语音识别日志表';

-- 2. 长语音识别任务表
CREATE TABLE IF NOT EXISTS `voice_recognition_tasks` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `task_id` VARCHAR(100) NOT NULL COMMENT '腾讯云任务ID',
  `audio_url` VARCHAR(500) NOT NULL COMMENT '音频文件URL',
  `status` VARCHAR(50) DEFAULT 'pending' COMMENT '任务状态：pending-等待, processing-处理中, success-成功, failed-失败',
  `result_text` TEXT COMMENT '识别结果文本',
  `error_msg` VARCHAR(500) COMMENT '错误信息',
  `options` TEXT COMMENT '识别选项（JSON格式）',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_task_id` (`task_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='长语音识别任务表';

-- 3. 语音识别与监理日志关联表（可选）
CREATE TABLE IF NOT EXISTS `supervision_log_voices` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `log_id` INT UNSIGNED NOT NULL COMMENT '监理日志ID',
  `voice_log_id` INT NOT NULL COMMENT '语音识别日志ID',
  `field_name` VARCHAR(100) COMMENT '关联字段名称：project_dynamics-工程动态, supervision_work-监理工作, safety_work-安全工作',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_log_id` (`log_id`),
  INDEX `idx_voice_log_id` (`voice_log_id`),
  FOREIGN KEY (`log_id`) REFERENCES `supervision_logs` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`voice_log_id`) REFERENCES `voice_recognition_logs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='监理日志语音关联表';

-- 插入示例数据（可选）
-- INSERT INTO voice_recognition_logs (user_id, audio_size, recognized_text, audio_time, recognition_type) 
-- VALUES (1, 15234, '今天天气晴朗，施工进展顺利', 3000, 'realtime');

-- 查询统计SQL示例
-- SELECT 
--   COUNT(*) as total,
--   SUM(audio_size) as total_size,
--   SUM(audio_time) as total_time,
--   recognition_type
-- FROM voice_recognition_logs
-- GROUP BY recognition_type;

